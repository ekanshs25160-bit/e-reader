# Flyleaf Reader — Technical Architecture

This document outlines the architecture, data flow, storage schema, theme engine, and reading rendering pipeline of the Flyleaf application.

---

## 1. High-Level Architecture & Layering

Flyleaf follows a feature-sliced architecture with strict boundary enforcement:

```
src/
├── app/                  # Next.js App Router (Routing only, pages < 80 lines)
│   ├── (app)/            # App shell routes (home, library, browse, vocabulary, stats, settings)
│   ├── (focus)/          # Focus/immersive routes (reader)
│   └── api/              # API Route Handlers (catalog, lookup)
├── features/             # Feature slices (reader, library, browse, vocabulary, stats, settings, ai, home, onboarding, auth)
│   └── <feature>/
│       ├── components/   # Feature-specific UI components (< 250 lines)
│       ├── hooks/        # Feature data & lifecycle hooks (< 200 lines)
│       ├── lib/          # Pure helper functions (< 300 lines)
│       ├── constants.js  # Feature constants
│       └── index.js      # Public API barrier (only index.js is importable externally)
├── components/           # Shared presentation components
│   ├── ui/               # Core design system primitives (Button, Card, Chip, Segmented, Cover, Overlay, etc.)
│   ├── layout/           # AppShell, Navigation, Header, Sidebar
│   └── feedback/         # Toast, ErrorBoundary, Skeletons
├── lib/                  # Application core utilities (pure, never imports React or UI)
│   ├── api/              # Network clients & fetchers
│   ├── storage/          # Versioned IndexedDB stores & migrations
│   ├── stats/            # Pure stats computation & streak calculation
│   ├── format/           # Formatting helpers (pluralize, dates, numbers)
│   └── env.js            # Fast-failing environment variable validator
├── hooks/                # Generic, cross-cutting hooks (useMediaQuery, useDebounce, useOnline)
├── providers/            # React context providers (ThemeProvider, ToastProvider)
├── styles/               # Global Tailwind & token declarations
└── constants/            # Global routes, storage keys, and layout limits
```

### Import Boundaries
Enforced automatically via ESLint (`no-restricted-imports`):
- Feature internals (`@/features/<name>/*/*`) cannot be imported directly across features; all cross-feature communication passes through `@/features/<name>` (`index.js`).
- `lib/` is completely decoupled from React and presentation logic: it never imports React components, hooks, or UI modules.
- Hooks and utilities use named exports exclusively.

---

## 2. Data Flow Architecture

Flyleaf operates offline-first with an optimistic local reactive state:

```
[User Action / Viewport Event]
          │
          ▼
 [Feature Hook / Screen]
   ├── Optimistic UI State update
   ├── Local state dispatch
   └── Storage / API dispatch
          │
          ▼
   [Storage Layer] ───────────────► [IndexedDB / localforage]
          │                                  │
          ▼                                  ▼
[Broadcast / Event Sync] ◄──────── [Multi-tab Storage Listener]
          │
          ▼
 [Active Subscribers]
```

1. **User Action / Navigation**: Components invoke feature hooks (e.g., `useBookLoader`, `useReadingSession`, `useReaderLocation`).
2. **Storage Execution**: `lib/storage` performs reads and writes through dedicated store instances.
3. **Cross-Tab Synchronization**: Global events (`flyleaf-theme-change`, `flyleaf_db_write`) notify open tabs to synchronize without requiring round-trip network revalidation.
4. **AI & Network Streams**: AI explanations and Gutenberg downloads stream progressively into memory before persisting to IndexedDB blobs.

---

## 3. Storage Schema & Migrations

Flyleaf uses IndexedDB via `localforage` under the database name `KindleAIReaderDB`. Data is segregated into specialized object stores:

| Store Name | Responsibility | Schema Key | Value Structure |
| :--- | :--- | :--- | :--- |
| `books_meta` | Lightweight book metadata & progress | `id` (string) | `{ id, title, author, coverUrl, progress, progressPercentage, currentPage, totalPages, lastReadCfi, currentChapter, addedAt, lastReadTimestamp, isOfflineAvailable, status }` |
| `books_blobs` | Binary EPUB archives for offline reading | `id` (string) | `Blob` / `ArrayBuffer` |
| `reading_locations` | Precise reading CFI & scroll progress | `bookId` (string) | `{ bookId, cfi, progress, chapter, page, totalPages, updatedAt }` |
| `bookmarks` | User bookmarks & annotations | `bookId` (string) | `Array<{ id, cfi, title, note, createdAt }>` |
| `highlights` | Text highlights & color tags | `bookId` (string) | `Array<{ id, cfiRange, text, color, note, createdAt }>` |
| `vocabulary` | Saved word lookups & definitions | `word` (string) | `{ id, word, context, bookTitle, definition, phonetic, partOfSpeech, addedAt, reviewStage }` |
| `reading_stats` | Daily reading sessions & telemetry | Date key (`YYYY-MM-DD`) | `{ date, seconds, pages, books: { [bookId]: { seconds, pages } } }` |
| `reader_settings` | User appearance & typography preferences | `'reader_settings'` | `{ palette, typeface, fontSize, lineHeight, align, margins, spread }` |
| `app_settings` | App-wide preferences | `'app_settings'` | Key-value settings dictionary |

### Versioned Migrations
Storage migrations are coordinated through `src/lib/storage/migrations.js`:
- `CURRENT_SCHEMA_VERSION = 2`
- When the application boots, `runStorageMigrations()` checks `localStorage.getItem('flyleaf_db_schema_version')`.
- If the stored version is lower than `CURRENT_SCHEMA_VERSION`, each migration function executes in order before user interactions begin.
- **Migration v1 → v2**: Normalizes fractional progress numbers (`0.0`–`1.0`) into consistent integer percentages (`0`–`100`) across all book records and guarantees string IDs.

---

## 4. Theme System & Contrast Architecture

Flyleaf implements an editorial four-palette design system:

```
[System Dark MQ / User Choice]
              │
              ▼
    [ThemeProvider]
              │
   ┌──────────┴──────────────────────────┐
   ▼                                     ▼
HTML Class / data-theme           CSS Custom Properties
(.paper, .sepia, .night, .oled)   (--reader-bg, --reader-fg, --reader-muted,
                                   --reader-border, --reader-accent)
                                         │
                                         ▼
                               [Reader Chrome & Iframe Theme]
```

### The Four Palettes
1. **Paper**: `#FAF9F6` background, `#152A41` text, `#43474D` muted. Contrast: 13.5:1 (WCAG AAA).
2. **Sepia**: `#F4ECD8` background, `#2C2214` text, `#5B472C` muted. Contrast: 12.8:1 (WCAG AAA).
3. **Night**: `#141824` background, `#F0F2F5` text, `#A0AEC0` muted. Contrast: 14.1:1 (WCAG AAA).
4. **OLED**: `#000000` background, `#EDEDED` text, `#A0A0A0` muted. Contrast: 18.2:1 (WCAG AAA).

### CSS Custom Properties on Reader Root
The reader container binds CSS custom properties dynamically:
- `--reader-bg`: Active canvas background color
- `--reader-fg`: Active primary text and icon color
- `--reader-muted`: Secondary label color
- `--reader-border`: Border and divider color
- `--reader-accent`: Progress bar and focal highlight color

All reader header elements, back button, title pill, reading progress, and bottom bar controls consume these variables to guarantee minimum 4.5:1 contrast across all four palettes.

---

## 5. Reader Engine Architecture

The reading engine orchestrates `epub.js` rendering inside an isolated sandboxed iframe:

```
                     [ReaderScreen]
                           │
       ┌───────────────────┼───────────────────┐
       ▼                   ▼                   ▼
 [ReaderHeader]      [ReaderCanvas]      [ReaderFooter]
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
[useViewportResize]  [useEpubRendition]  [useDynamicTheme]
         │                 │                 │
         │          ┌──────┴──────┐          │
         ▼          ▼             ▼          ▼
   [layout.js] [gestures.js] [themes.js] [locations.js]
```

### Core Engine Modules (`src/features/reader/engine/`)
- **`layout.js`**: Pure mathematical calculations for page geometry (`getPageAreaDimensions`):
  - Phone (`< 768px`): `pageWidth = stageWidth - 32px` (2×16px gutters).
  - Tablet (`768px`–`1023px`): `pageWidth = min(stageWidth, 44rem)`.
  - Desktop (`>= 1024px`): `pageWidth = min(stageWidth - 96px, 44rem)`.
- **`themes.js`**: Injects EPUB rendition styles. Strictly sets `0 !important` padding and margin on `html` and `body` inside the iframe to prevent clipping and asymmetric gutters.
- **`gestures.js`**: Touch swiping with horizontal flick commit (45px commit threshold, 20px/250ms velocity flick), snap-back animation (220ms bezier), trackpad wheel paging (debounced 350ms), and click zones (phone/tablet only).
- **`selection.js`**: Text range extraction, CFI range resolution, and floating action card positioning.
- **`locations.js`**: Chapter text extraction and CFI-to-percentage progress mapping.
- **`create-rendition.js`**: Web font injection (Literata, EB Garamond, Inter, Newsreader, Lora, OpenDyslexic), neighbor page containment enforcement, and MutationObserver setup for `.epub-container`.

### Containment & CFI Stability Rules
1. **Zero Padding Inside Iframe**: Horizontal padding inside the EPUB iframe is strictly prohibited; page dimensions are governed exclusively by the viewer element's width and height.
2. **MutationObserver Containment**: Immediately after `book.renderTo()`, a `MutationObserver` monitors the viewer container and enforces `overflow: hidden` and `scrollbar-width: none` on `.epub-container` so neighboring pages never bleed into gutters.
3. **Resize Protection**: Viewport resizes are debounced to 120ms. `resizingUntilRef` sets a timestamp guard (`Date.now() + 600ms`) during resize events so that intermediate reflow events do not overwrite the user's saved CFI in IndexedDB.
4. **Theme Decoupling**: Typography, font size, and color adjustments re-theme the live rendition without destroying or re-mounting the EPUB instance, ensuring instantaneous theme switches.
