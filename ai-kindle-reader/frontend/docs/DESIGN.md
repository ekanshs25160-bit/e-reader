# Flyleaf Editorial Design Specification

Extracted directly from the reading viewport; governs every screen, layout, and control across Flyleaf.

---

## 1. Core Principles

- **Content first**: The reader's text and metadata take absolute precedence.
- **Quiet chrome**: Controls remain unobtrusive and recede into the surface until needed.
- **One accent**: A single warm bronze accent per screen. Accent is reserved strictly for reading progress lines, active states, links, and one focal highlight per viewport.
- **No decoration for its own sake**: No fake gradients, no ornamental badges, no drop shadows on page surfaces, no colored circular icon chips.
- **Calm voice**: Restrained microcopy with clear information architecture and no exclamation marks.

---

## 2. Color Palettes

Four palettes are supported app-wide via CSS variables. Every component respects the active theme (`:root`, `.dark`, `.sepia`, `.oled`, or `data-theme`).

| Token | Paper (Default) | Sepia | Night | OLED | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Background** (`--theme-bg`) | `#FAF9F6` | `#F4ECD8` | `#141824` | `#000000` | Full-page backdrop |
| **Surface** (`--theme-surface`) | `#FAF9F6` | `#F4ECD8` | `#141824` | `#000000` | Cards, panels, popovers |
| **Ink** (`--theme-ink`) | `#152A41` | `#2C2214` | `#F0F2F5` | `#EDEDED` | Primary text, titles, active icons |
| **Muted** (`--theme-muted`) | `#43474D` (~60% ink) | `#5B472C` (~60% ink) | `#A0AEC0` (~60% ink) | `#A0A0A0` (~60% ink) | Secondary labels, microcopy, unselected icons |
| **Hairline** (`--theme-hairline`) | `rgba(21, 42, 65, 0.12)` | `rgba(44, 34, 20, 0.12)` | `rgba(240, 242, 245, 0.12)` | `rgba(237, 237, 237, 0.12)` | 1px dividers, card borders, pills |
| **Accent** (`--theme-accent`) | `#855224` | `#7A491B` | `#E2B170` | `#E2B170` | Progress lines, active states, links |
| **Contrast** (`--theme-contrast`) | `#FAF9F6` | `#F4ECD8` | `#141824` | `#000000` | Text on ink-filled controls |
| **Semantic Error** | `#9E3535` | `#9A3828` | `#D05D5D` | `#D05D5D` | Restrained error messaging |
| **Semantic Success** | `#2A6B48` | `#2B613D` | `#4E9A68` | `#4E9A68` | Offline vault verified status |

### Accent Rules
- Use accent **ONLY** for:
  1. Progress lines (`ProgressLine`)
  2. Active segmented indicators or selected link states
  3. Single focal highlight per screen
- **Never** use accent for generic background fills or decorative borders.

---

## 3. Surfaces & Elevation

- **Surfaces are flat**: No page drop shadows, no linear gradients on page backgrounds, no colored tint washes.
- **Separation via whitespace and hairlines**: Containers and sections are bounded with 1px hairlines (`border border-hairline`) and whitespace.
- **Floating Overlays**:
  - Menus, dropdowns, popovers, and side panels may use `bg-surface/90` + `backdrop-blur-md` + hairline border (`border border-hairline`) + soft shadow (`shadow-[0_12px_36px_rgba(0,0,0,0.08)]`).

---

## 4. Typography

| Role | Font Family | Size | Weight | Tracking | Details |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Page Title** | Newsreader / Literata (Serif) | 32–40px | 400 (Regular) | `-0.015em` | Editorial lead |
| **Section Title** | Newsreader / Literata (Serif) | 20–24px | 400 (Regular) | `normal` | Quiet chaptering |
| **Body Text** | Inter (Sans) | 15–16px | 400 (Regular) | `normal` | Line height 1.6–1.75 |
| **UI Controls** | Inter (Sans) | 13–15px | 500 (Medium) | `0.01em` | Buttons, chips, tabs |
| **Meta / Eyebrow** | Inter (Sans) | 10–11px | 500 (Medium) | `0.12em` | UPPERCASE, muted |
| **Numerals** | Newsreader / Literata / Inter | Any | 400–500 | `normal` | Always `tabular-nums` |

> [!IMPORTANT]
> Maximum font weight for UI text is **500** (`font-medium`). Never use 600+ (semi-bold or bold) on standard UI labels.

---

## 5. Shape & Borders

- **Cards & Inputs**: `rounded-[12px]` (12px radius)
- **Pills, Chips & Buttons**: `rounded-full` (999px pill)
- **Sheets, Drawers & Panels**: `rounded-[24px]` (24px radius)
- **Borders**: Strictly 1px hairlines (`border border-hairline` or directional `border-b border-hairline`).

---

## 6. Spacing Scale

- **Scale**: 4px base increments (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `56px`).
- **Page Gutters**:
  - Phone: `16px` (`px-4`)
  - Tablet: `32px` (`px-8`)
  - Desktop: `48px` (`px-12`)
- **Section Spacing**: `40px` to `56px` (`space-y-10` to `space-y-14`)
- **Content Max Width**: `72rem` (1152px)
- **Text & Forms Max Width**: `40rem` (640px)

---

## 7. Iconography

- **Library**: Material Symbols Outlined
- **Weight**: 300 (`font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24`)
- **Size**: 20px–24px standard
- **Color**: Muted (`var(--theme-muted)`) by default; Ink (`var(--theme-ink)`) when active.
- **Rule**: No colored circular icon chips or badge backgrounds behind icons.

---

## 8. Motion & Micro-interactions

- **Timing**: 160ms–220ms duration.
- **Easing**: `ease-out` (smooth, calm decelerations).
- **No bounce**: Avoid elastic or spring physics.
- **Accessibility**: Respects `prefers-reduced-motion` globally (animation and transition durations collapse to `0.01ms`).

---

## 9. Component Catalog (`components/ui`)

### `PageHeader`
```jsx
<PageHeader
  eyebrow="Reader Notes"
  title="Marginalia & Highlights"
  description="All annotations captured across your personal library."
  action={<Button variant="secondary">Export</Button>}
/>
```
- Eyebrow in 10.5px uppercase muted text.
- Serif regular title (32-38px).
- Bottom 1px hairline border.

### `SectionHeader`
```jsx
<SectionHeader
  eyebrow="Library"
  title="Recent Titles"
  action={<Button variant="ghost" size="sm">View all</Button>}
/>
```
- Uppercase micro label with 1px hairline rule.

### `Card`
```jsx
<Card interactive onClick={handleOpen}>
  <p className="text-ink">Flat surface bounded by a 1px hairline.</p>
</Card>
```
- Flat `bg-surface`, `border border-hairline`, `rounded-[12px]`, zero drop shadow.

### `StatBlock`
```jsx
<StatBlock value="142" label="Pages read today" unit="pages" />
```
- Serif regular number (32-36px), tabular numerals, uppercase micro label.

### `Button`
```jsx
<Button variant="primary">Read book</Button>
<Button variant="secondary">Download EPUB</Button>
<Button variant="ghost">Clear</Button>
<Button variant="icon" aria-label="Settings" icon="tune" />
```
- Primary: Ink pill with paper text (`bg-ink text-background`).
- Secondary: Hairline pill with ink text (`border border-hairline text-ink`).
- Ghost: Quiet text button.
- Icon: Minimum 44px touch target, 300-weight icon.

### `Chip`
```jsx
<Chip label="All Classics" selected={active} onClick={() => setActive(true)} />
```
- Pill shape with checkmark when selected.

### `Segmented`
```jsx
<Segmented
  options={[
    { id: 'all', label: 'All' },
    { id: 'reading', label: 'In Progress' },
    { id: 'finished', label: 'Finished' },
  ]}
  value={tab}
  onChange={setTab}
/>
```
- Segmented control in 1px hairline container with ink-filled active tab.

### `ProgressLine`
```jsx
<ProgressLine value={42} max={100} showPercentage label="Chapter III" />
```
- 2px or 4px accent line progress indicator.

### `EmptyState`
```jsx
<EmptyState
  icon="menu_book"
  title="Your desk is clear"
  description="Import an EPUB or explore curated public domain classics."
  action={<Button variant="primary">Browse catalog</Button>}
/>
```
- Thin-line icon, serif title, calm microcopy, single primary action.

### `Cover`
```jsx
<Cover
  src={book.coverUrl}
  title="The Odyssey"
  author="Homer"
  aspect="aspect-[2/3]"
/>
```
- Renders stored cover image; gracefully falls back to an authentic typographic book jacket in the active palette.

### `Toast`
```jsx
<Toast message="Saved to local vault" visible={true} onDismiss={() => {}} />
```
- Floating pill notification with soft shadow and quiet accent indicator.

### `Popover` & `SidePanel`
```jsx
<Popover trigger={<Button variant="secondary">Filter</Button>} open={open} onClose={() => setOpen(false)}>
  <div className="p-2">Content</div>
</Popover>

<SidePanel title="Table of Contents" open={openPanel} onClose={() => setOpenPanel(false)}>
  <div>Chapters</div>
</SidePanel>
```
- Floating overlays with `surface/90`, `backdrop-blur-md`, `border border-hairline`, and 24px corner radius.

---

## 10. Voice Guidelines

- **Restrained & confident**: State facts simply.
- **No exclamation marks**: Avoid artificial excitement (`Saved to vault` instead of `Saved to vault!`).
- **Local-first clarity**: Clearly inform the user that data is kept locally on this device.
