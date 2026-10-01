# Product Requirements Document (PRD)



## AI-Powered Mobile E-Reader — Backend & Serverless API Layer[cite: 1, 2]

### 1. Product Overview



**Product Name:** AI-Powered Mobile E-Reader Backend[cite: 1, 2]

**Version:** 1.0.0[cite: 1, 2]

**Product Type:** Serverless Edge API & AI Integration Gateway[cite: 1, 2]

The AI-Powered Mobile E-Reader Backend is a lightweight, edge-ready serverless API layer designed to support a client-side progressive web application[cite: 1, 2]. Built using Next.js Route Handlers, the backend functions as a secure gateway for artificial intelligence orchestration, external public-domain catalog querying, and streaming contextual explanations directly to mobile reading clients without exposing upstream API credentials.

### 2. Target Users



* **Mobile Readers:** Individuals seeking distraction-free reading of standard EPUB literature with on-demand contextual lookups.


* **Literary Students & Researchers:** Users requiring immediate vocabulary definitions, historical background, and character analysis without leaving the active viewport.


* **Public Domain Enthusiasts:** Readers downloading, saving, and consuming classics offline from Project Gutenberg catalogs.



### 3. Core Features



#### 3.1 AI Contextual Engine[cite: 1, 2]

* **Context-Aware Inference:** ✅ Stream character-by-character analysis for highlighted book excerpts, terms, and metaphors.


* **Live Search Grounding:** ✅ Integrate real-time Google Search grounding via the Google Gen AI SDK to verify historical facts, author biographies, and publication chronologies.


* **Anti-Spoiler Guardrails:** ✅ Enforce system instructions that prohibit revealing future plot developments beyond the user's provided chapter/position metadata.


* **Chapter Summarization:** ✅ Generate structural summaries of complete chapters to recap major narrative arcs.


* **Streaming Transfer Protocol:** ✅ Deliver generated tokens over Server-Sent Events (SSE) using HTTP chunked transfer encoding.



#### 3.2 External Catalog Discovery[cite: 1, 2]

* **Catalog Search Proxy:** ✅ Proxy search queries to the Gutendex REST API to prevent CORS issues on mobile clients.


* **Book Metadata Extraction:** ✅ Normalize external catalog responses into a unified JSON format containing title, author, cover URL, download URL, and language.


* **Download Proxy / Asset Forwarding:** ✅ Proxy `.epub` binary streams when origin servers lack permissive cross-origin resource sharing headers.



#### 3.3 Diagnostics & Operations



* **System Health Check:** ✅ Endpoint for verifying server uptime, model latency, and active upstream connectivity.


* **Rate Limiting & Quota Throttling:** ☐ Basic IP-based token bucket limiter to safeguard upstream model quotas.

---

### 4. Technical Specifications



#### 4.1 API Endpoints Structure



**AI Orchestration Routes** (`/api/ai/`)[cite: 1, 2]

* `POST /api/ai/assist` ✅
* **Purpose:** Contextual line explanation, metaphor breakdown, and vocabulary lookup.


* **Auth:** None (client-token/edge protected).


* **Request Body (JSON):**
```json
{
  "bookTitle": "Crime and Punishment",
  "author": "Fyodor Dostoevsky",
  "currentChapter": "Chapter 2",
  "selectedText": "He was so down and out that he had ceased to notice his surroundings...",
  "userQuery": "Explain the psychological state conveyed here."
}

```


* **Response:** `200 OK` (Stream: `text/event-stream; charset=utf-8`).


* **Error Codes:** `400 Bad Request` (missing `selectedText`), `500 Internal Server Error` (upstream SDK error).


* `POST /api/ai/summary` ✅
* **Purpose:** Generate chapter-level or section-level narrative summaries.


* **Auth:** None.


* **Request Body (JSON):**
```json
{
  "bookTitle": "Frankenstein",
  "author": "Mary Shelley",
  "chapterTitle": "Chapter 5",
  "chapterText": "It was on a dreary night of November that I beheld the accomplishment of my toils..."
}

```


* **Response:** `200 OK` (Stream: `text/event-stream; charset=utf-8`).


* **Error Codes:** `400 Bad Request` (empty `chapterText`), `413 Payload Too Large` (> 50,000 characters).


* `POST /api/ai/author-grounding` ✅
* **Purpose:** Execute live web-grounded research regarding author biography, era politics, or writing circumstances.


* **Auth:** None.


* **Request Body (JSON):**
```json
{
  "author": "Leo Tolstoy",
  "bookTitle": "War and Peace",
  "userQuery": "What personal experiences influenced Tolstoy's description of the Battle of Borodino?"
}

```


* **Response:** `200 OK` (Stream: `text/event-stream` with attached grounding metadata references).





**Catalog Discovery Routes** (`/api/catalog/`)[cite: 1, 2]

* `GET /api/catalog/search` ✅
* **Purpose:** Search public domain classic books via Gutendex.


* **Query Parameters:**
* `q` (string, required): Search keyword (title or author).


* `page` (number, optional, default: 1): Pagination index.


* **Upstream Forwarding:** `[https://gutendex.com/books?search=](https://gutendex.com/books?search=){q}&page={page}`

* **Response (JSON):**
```json
{
  "total": 42,
  "page": 1,
  "books": [
    {
      "id": 1342,
      "title": "Pride and Prejudice",
      "authors": ["Jane Austen"],
      "coverUrl": "https://www.gutenberg.org/cache/epub/1342/pg1342.cover.medium.jpg",
      "downloadUrl": "https://www.gutenberg.org/ebooks/1342.epub3.images",
      "languages": ["en"]
    }
  ]
}

```




* `GET /api/catalog/download/:bookId` ✅
* **Purpose:** Stream binary `.epub` file directly to client to bypass remote CORS restrictions.


* **URL Parameter:** `bookId` (numeric Gutenberg ID).


* **Response:** `200 OK` (`Content-Type: application/epub+zip`, stream binary).



**Health & Observability Routes** (`/api/healthcheck/`)

* `GET /api/healthcheck` ✅
* **Purpose:** System telemetry and Gemini API accessibility check.


* **Response (JSON):**
```json
{
  "status": "operational",
  "timestamp": "2026-09-29T15:00:22.000Z",
  "version": "1.0.0",
  "modelConnected": true
}

```





---

#### 4.2 Backend Processing Functions[cite: 1, 2]

##### Function 1: `buildAiSystemInstruction(bookTitle, author, antiSpoilerStrictness)`

* **File:** `app/api/ai/helpers.js`
* **Purpose:** Dynamically constructs the system instruction string guiding the Gemini model.
* **Parameters:**
* `bookTitle` (string): Title of the active book.


* `author` (string): Author of the active book.


* `antiSpoilerStrictness` (boolean): Whether to enforce hard stops on unreached narrative points.




* **Logic:**
1. Sets model identity: "You are an elite literary scholar embedded inside a Kindle-style reader."


2. Binds context: Sets boundaries to the specified book and author.


3. Applies constraints: Forbids spoiling subsequent plot developments.


4. Enforces output style: Concise, markdown-formatted, clear bullet points for definitions.




* **Returns:** Formatted system instruction string.

##### Function 2: `createGeminiStream(systemInstruction, userContent, enableSearch)`

* **File:** `app/api/ai/helpers.js`
* **Purpose:** Initializes `@google/genai` client and calls the streaming endpoint.
* **Parameters:**
* `systemInstruction` (string): Output from `buildAiSystemInstruction`.
* `userContent` (string): Formatted user prompt containing the excerpt and question.


* `enableSearch` (boolean): Flag to toggle `googleSearch` tool grounding.




* **Logic:**
1. Reads `process.env.GEMINI_API_KEY`.


2. Instantiates client: `new GoogleGenAI({ apiKey })`.


3. Executes `ai.models.generateContentStream` targeting model `gemini-3.5-flash`.


4. Appends `tools: [{ googleSearch: {} }]` if `enableSearch` is true.




* **Returns:** Readable asynchronous generator stream of text chunks.



##### Function 3: `formatGutendexResponse(rawJson)`

* **File:** `app/api/catalog/helpers.js`
* **Purpose:** Filters, normalizes, and strips superfluous Gutenberg metadata.
* **Parameters:** `rawJson` (object): Direct payload from `[https://gutendex.com/books](https://gutendex.com/books)`.


* **Logic:**
1. Maps `results` array.
2. Filters out entries lacking `application/epub+zip` in the `formats` object.
3. Extracts best cover art thumbnail (`image/jpeg`).
4. Extracts author names from `authors[].name`.


* **Returns:** Cleaned JSON array of book objects ready for client consumption.

---

#### 4.3 Data Schemas



**AI Interaction Request Schema:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "AiAssistRequest",
  "type": "object",
  "properties": {
    "bookTitle": { "type": "string", "minLength": 1 },
    "author": { "type": "string", "minLength": 1 },
    "currentChapter": { "type": "string" },
    "selectedText": { "type": "string", "minLength": 1, "maxLength": 10000 },
    "userQuery": { "type": "string", "maxLength": 500 }
  },
  "required": ["bookTitle", "selectedText"]
}

```

**Normalized Book Entity Schema:**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "BookEntity",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "title": { "type": "string" },
    "author": { "type": "string" },
    "coverUrl": { "type": "string" },
    "downloadUrl": { "type": "string" },
    "fileSize": { "type": "number" },
    "progressPercentage": { "type": "number", "minimum": 0, "maximum": 100 },
    "lastReadCfi": { "type": "string" },
    "lastReadTimestamp": { "type": "number" }
  },
  "required": ["id", "title"]
}

```

---

### 5. Security Features



* **Environment Isolation:** Upstream `GEMINI_API_KEY` stored exclusively in server-side runtime environments (`.env.local` / Vercel Environment Variables); never shipped to client bundles.


* **Input Sanitization:** Strips HTML/script tags from user-provided prompts prior to compiling LLM inputs.
* **Payload Size Caps:** Enforces strict 2MB body limit on incoming API requests to prevent memory denial-of-service on serverless functions.
* **CORS Protection:** Restricts API route invocations to approved web origins via HTTP response headers.

---

### 6. Storage & Edge Cache Management



* **Edge Route Caching:** `GET /api/catalog/search` responses cached at Edge CDN layers with `s-maxage=86400` (24-hour TTL) to minimize upstream Gutendex traffic.
* **Stateless Serverless Execution:** Backend runs completely stateless; no operational databases (PostgreSQL/MongoDB) required. *(Amended in v1.1 — see Section 8: an optional database is introduced solely for accounts, sync, annotations and AI response caching.)*


* **Binary Streaming:** Downloads piped directly to client response bodies without writing temporary files to server disk.



---

### 7. Success Criteria



* ✅ Serverless AI proxy streaming first token in under 450ms on mobile LTE networks.
* ✅ Zero API key leakage into client-side application bundles.


* ✅ 100% reliable conversion of Gutendex catalog responses into normalized schemas.


* ✅ Health endpoint providing live telemetry on upstream AI API availability.



---

---

# Product Requirements Document (PRD)



## AI-Powered Mobile E-Reader — Frontend (Mobile PWA & Reader Client)[cite: 1, 2]

### 1. Product Overview



**Product Name:** AI-Powered Mobile E-Reader Client[cite: 1, 2]

**Version:** 1.0.0[cite: 1, 2]

**Product Type:** Progressive Web App (PWA) / Hybrid Mobile Client[cite: 1, 2]

The frontend is an offline-first Progressive Web App designed to mirror the physical reading ergonomics of a dedicated Kindle hardware e-reader. Operating entirely client-side for book parsing, pagination, theme rendering, and position persistence, the application stores full EPUB files directly in phone memory (IndexedDB via `localForage`). A context-aware sliding AI drawer bridges client reading states with serverless generative intelligence for instantaneous, distraction-free analysis.

### 2. Target Users



* **Mobile Readers:** Individuals seeking an uncompromised book-reading layout on smartphones with touch pagination and zero visual clutter.


* **Night & Commute Readers:** Users switching between high-contrast daylight settings and pitch-black OLED themes during travel.


* **Active Learners:** Readers who frequently look up terms, character backgrounds, and subtext without switching apps.



---

### 3. Core Features



#### 3.1 Library & Catalog View (`/`)[cite: 1, 2]

* **Bookshelf Display:** ✅ Grid/Card listing of imported books with cover art, title, author, and calculated reading progress bar.


* **EPUB File Uploader:** ✅ Drag-and-drop / file-input component supporting direct upload of local DRM-free `.epub` files.


* **In-App Gutenberg Search:** ✅ Live search modal querying `/api/catalog/search`, allowing single-tap downloading of public domain classics directly into device memory.


* **Book Deletion & Management:** ✅ Long-press / context action to delete saved book binaries and associated progress records from IndexedDB.



#### 3.2 Immersive Reader Viewport (`/reader/[id]`)[cite: 1, 2]

* **Kindle Pagination Engine:** ✅ Horizontal page-flip mechanism using `epub.js` paginated flow (no vertical scroll).


* **Invisible Touch Spatial Hitboxes:** ✅
* *Right 75% Viewport:* Trigger forward page flip (`rendition.next()`).


* *Left 15% Viewport:* Trigger reverse page flip (`rendition.prev()`).


* *Center 10% Viewport:* Toggle configuration toolbars (`isMenuOpen` state).




* **Swipe Gesture Navigation:** ✅ Touch event swipe detection using `react-swipeable`.


* **Dynamic Text Justification:** ✅ CSS injection enforcing `text-align: justify`, hyphenation, and standardized paragraph indents (`1.5em`).


* **Progress Tracking & Scrubbing:** ✅ Footer status displaying current chapter title, reading percentage, and relative page location.



#### 3.3 Typography & Themes ("Aa" Settings)[cite: 1, 2]

* **Font Family Selector:** ✅ Dynamic toggling between Classical Serif (Georgia / Merriweather) and Modern Sans-Serif (Inter / System UI).


* **Font Scaling Controls:** ✅ Step slider / buttons scaling font dynamically from 12px to 28px.


* **Kindle Ambient Themes:** ✅ Instantaneous color palette shifts:
* *Day Mode:* Slate text (`#111111`) on pearl white background (`#FDFBF7`).


* *Sepia Mode:* Espresso text (`#2C2214`) on warm cream background (`#F4ECD8`).


* *OLED Night Mode:* Warm gray text (`#A0A0A0`) on pitch-black background (`#000000`).





#### 3.4 Interactive AI Drawer Component[cite: 1, 2]

* **Text Selection Hook:** ✅ Native touch text highlight listener inside the reader `iframe` extracting selection string and CFI coordinates.


* **Floating Action Context Trigger:** ✅ Inline menu popping up on selection: "Explain", "Analyze", "Define", and "Ask AI".


* **Slide-Up Bottom Sheet:** ✅ Non-intrusive mobile drawer overlaying the lower 45% of the viewport.


* **Streaming Response Renderer:** ✅ Live markdown parser rendering incoming Server-Sent Events (SSE) tokens with syntax highlighting and bulleted formatting.


* **Author Grounding Toggle:** ✅ Button inside drawer enabling Google Search Grounding for author biographical facts.



#### 3.5 Storage, Bookmarking & PWA Engine[cite: 1, 2]

* **Offline File Storage:** ✅ Full binary EPUB storage inside IndexedDB via `localForage` (supporting 500MB+ of books).


* **CFI Smart Bookmark:** ✅ Auto-saving current Content Fragment Identifier (CFI) string to local storage on every page turn.


* **PWA Manifest Configuration:** ✅ `manifest.json` configured for `standalone` display mode, eliminating browser address bars.


* **Service Worker Asset Caching:** ✅ Offline shell and static resource caching via Service Workers.



---

### 4. Technical Specifications



#### 4.1 Application Routes



| Route | View Description | Data Source | Offline Capable |
| --- | --- | --- | --- |
| `/` | Library Dashboard & Shelf | IndexedDB (`localForage`) | Yes (100%)

 |
| `/search` | Public Domain Search Modal | `/api/catalog/search` | No (Requires Network)

 |
| `/reader/:id` | Full-Screen Kindle Reader | IndexedDB + `epub.js` | Yes (100%)

 |

---

#### 4.2 Frontend Core Functions & Logic[cite: 1, 2]

##### Storage Utilities (`utils/db.js`)



```javascript
// 1. Initialize localForage instance
export function initDB()

```

* **Purpose:** Configures the `localForage` IndexedDB store named `kindle_reader_db`.



```javascript
// 2. Save book binary and metadata
export async function saveBook(bookId, metadata, fileBlob)

```

* **Parameters:**
* `bookId` (string): Unique identifier (UUID or Gutenberg ID).


* `metadata` (object): Title, author, total chapters, cover art base64.


* `fileBlob` (Blob): Binary EPUB file blob.




* **Returns:** Promise resolving to boolean status.

```javascript
// 3. Retrieve raw book binary
export async function getBookBlob(bookId)

```

* **Parameters:** `bookId` (string)
* **Returns:** Promise resolving to raw `Blob` for passing to `epub.js`.



```javascript
// 4. Save reading position
export async function saveReadingLocation(bookId, cfiString, percentage)

```

* **Parameters:**
* `bookId` (string)
* `cfiString` (string): Content Fragment Identifier pointer.


* `percentage` (number): Calculated read fraction (0.0 to 1.0).




* **Returns:** Promise resolving to updated position object.

```javascript
// 5. Retrieve reading position
export async function getReadingLocation(bookId)

```

* **Parameters:** `bookId` (string)
* **Returns:** Promise resolving to `{ cfi: string, percentage: number }`.



---

##### Reader Viewport Logic (`components/ReaderCanvas.jsx`)



```javascript
// 1. Initialize epub.js Rendition
function mountReader(containerElement, bookData, startCfi)

```

* **Parameters:**
* `containerElement` (DOMNode): Div mounting reference.


* `bookData` (ArrayBuffer / Blob): Book file asset.


* `startCfi` (string): Last recorded bookmark pointer.




* **Logic:**
1. Calls `ePub(bookData)`.
2. Binds `book.renderTo(containerElement, { flow: "paginated", width: "100%", height: "100%" })`.


3. Injects default typography stylesheets (justification, margins, indents).


4. Calls `rendition.display(startCfi || undefined)`.
5. Attaches `rendition.on("relocated", handleLocationChange)`.
6. Attaches `rendition.on("selected", handleTextSelection)`.



```javascript
// 2. Screen Touch Dispatcher
function handleScreenTap(event)

```

* **Parameters:** `event` (TouchEvent / MouseEvent)
* **Logic:**
1. Computes `xRatio = event.clientX / window.innerWidth`.
2. If `xRatio > 0.85`: Calls `rendition.next()`.


3. If `xRatio < 0.15`: Calls `rendition.prev()`.


4. If `0.15 <= xRatio <= 0.85`: Toggles `isMenuOpen` state.





```javascript
// 3. Apply Visual Theme
function applyTheme(themeName, fontSize, fontFamily)

```

* **Parameters:**
* `themeName` ("day" | "sepia" | "night")


* `fontSize` (number in px)


* `fontFamily` (string)




* **Logic:**
1. Selects CSS property dictionary according to theme palette.


2. Executes `rendition.themes.override("color", palette.text)`.
3. Executes `rendition.themes.override("background", palette.bg)`.
4. Executes `rendition.themes.fontSize(`${fontSize}px`)`.
5. Executes `rendition.themes.font(fontFamily)`.



```javascript
// 4. Selection Event Handler
function handleTextSelection(cfiRange, contents)

```

* **Parameters:**
* `cfiRange` (string): Selection coordinates.
* `contents` (object): Selected text content context.




* **Logic:**
1. Extracts plain text selection string.


2. Records current selection to React state.
3. Displays floating action contextual menu directly above the coordinates.





---

##### AI Assistant Interaction Drawer (`components/AiDrawer.jsx`)



```javascript
// 1. Stream Query Dispatcher
async function streamAiResponse(selectedText, userQuery, bookContext)

```

* **Parameters:**
* `selectedText` (string): Highlighted quote.


* `userQuery` (string): Specific reader question.


* `bookContext` (object): `{ title, author, chapter }`



* **Logic:**
1. Sets UI drawer state: `isOpen: true`, `isLoading: true`, `responseChunks: ""`.
2. Dispatches `fetch("/api/ai/assist", { method: "POST", body: ... })`.


3. Instantiates `response.body.getReader()`.
4. Loops through incoming chunks, decoding UTF-8 text and appending characters incrementally to `responseChunks` state to achieve typewriter effect.


5. Sets `isLoading: false` upon stream termination.



---

#### 4.3 State & Data Layer Architecture



* **Global UI State:** React Context (`ReaderContext`) managing:
* `activeTheme`: `"day" | "sepia" | "night"`

* `activeFont`: `"serif" | "sans-serif"`

* `activeFontSize`: Number (12 - 28)


* `isMenuOpen`: Boolean


* `isAiDrawerOpen`: Boolean




* **Reader State:** Managed directly by `ReaderCanvas.jsx`:
* `currentCfi`: Active location string


* `progressPercent`: Current numeric completion


* `currentChapterTitle`: Extracted spine label




* **Database Layer:** Direct asynchronous bindings to `localForage` store (`IndexedDB`).



---

#### 4.4 Open Technical Decisions



* **Pagination Pre-computation:** `epub.js` generates dynamic locations asynchronously on load. On long books (>1000 pages), pre-generating total pagination requires 3-5 seconds of background parsing.
* *Decision:* Display chapter-relative percentage immediately; compute full book locations silently inside a Web Worker.


* **Capacitor Transition Preparation:** The client codebase avoids native Node dependencies, using purely standard Web APIs (`fetch`, `IndexedDB`, `ServiceWorker`) so that wrapping the project with `@capacitor/core` requires zero architectural refactoring.



---

### 5. Design Reference



* **Layout Origin:** Formally aligned with Google Stitch mobile UI designs and physical Kindle Paperwhite ergonomics.


* **Reading Margins:** Strict mobile viewport padding: `padding-left: 24px`, `padding-right: 24px`, `padding-top: 32px`, `padding-bottom: 24px`.


* **Typography Standards:**
* Serif: `Merriweather`, `Georgia`, serif


* Sans-Serif: `Inter`, `-apple-system`, sans-serif


* Line Height: Strictly `1.65` for optimal readability without visual strain.


* Alignment: Full justified (`text-align: justify`) with active hyphenation rules.





---

### 6. Non-Functional Requirements



* **Offline Availability:** Once an EPUB is saved to IndexedDB, reading, theme switching, and bookmark navigation must function without an active internet connection.


* **Touch Responsiveness:** Screen navigation taps must register page turns with under 50ms latency.
* **Display Optimization:** Night mode must use pure `#000000` to deactivate OLED pixels and save phone battery.


* **PWA Conformance:** Achieves 100/100 Lighthouse PWA score with install prompts functional on Chrome for Android and Safari for iOS.



---

### 7. Success Criteria



* ✅ PWA launches in full-screen standalone mode with zero browser address bar intrusion.


* ✅ EPUB files up to 50MB load, parse, and paginate inside mobile browser memory without crashes.


* ✅ Exact reading position (CFI) automatically restored upon reloading the web application.


* ✅ Text highlighting smoothly launches the AI drawer, streaming contextual explanations via SSE in real time.


* ✅ 100% compliant with standard JavaScript (ES6+) without requiring TypeScript compilation steps.


---

---

# Product Requirements Document (PRD)

## AI-Powered Mobile E-Reader — Part 3: Feature Expansion (v1.1 – v2.0)

### 8. Expansion Overview

**Why this section exists:** v1.0 is a single-device, local-only reader. Compared with Kindle, Kobo and Apple Books it lacks sync, a notebook for highlights, a fast dictionary, catalog browsing, reading stats and broader format support. This part specifies those gaps and where the AI layer can go beyond what those apps offer.

**Guiding Principles:**

* **Local-first, optional sync:** Reading, the local library and offline use never require an account. Signing in only adds sync and backup.
* **AI where it is differentiated:** Use plain APIs for plain lookups (definitions) and reserve the LLM for passages, characters, themes and recaps.
* **Progress-aware AI:** Every AI feature receives the reader's position so it can enforce spoiler boundaries.
* **No book text stored server-side:** Servers hold metadata, positions and annotations only.

**Architecture Decision (amends Section 6):** v1.0 specified a fully stateless backend with no database. From v1.1 an optional database (Postgres / Supabase) is introduced solely for accounts, sync, annotations and AI response caching. The stateless principle still applies to catalog proxying and AI streaming.

**Phasing:**

| Phase | Version | Scope |
| --- | --- | --- |
| A | v1.1 | Accounts & sync, highlights & notes, dictionary lookup |
| B | v1.2 | Catalog browse, library organization, reading stats |
| C | v1.3 | Progress-aware AI (X-Ray, recap, per-book chat), AI caching & quotas |
| D | v2.0 | OPDS sources, extra formats (PDF/MOBI/AZW3/FB2), send-to-reader, text-to-speech |

---

### 9. Accounts & Cross-Device Sync (Phase A)

#### 9.1 Features

* **Optional Accounts:** ☐ Passwordless sign-in (email magic link and/or Google OAuth). App is fully usable signed-out.
* **Reading Position Sync:** ☐ CFI and percentage synced per book across devices.
* **Library Metadata Sync:** ☐ Book list, shelves, finished status and settings (theme, font, size) synced. EPUB binaries are **not** uploaded in v1.1; a new device shows the book as "Not on this device" and prompts a re-download (catalog books) or re-import (personal files).
* **Book Identity Matching:** ☐ Personal uploads are identified by a content hash (SHA-256 of the file) so the same book matches across devices.
* **Offline Write Queue:** ☐ Changes made offline are queued in IndexedDB and flushed when connectivity returns.
* **Conflict Policy:** ☐ Progress uses last-write-wins by `updatedAt` per book. Annotations merge by `id` (union), with soft-delete tombstones so deletions propagate.
* **Account Data Export & Deletion:** ☐ One-tap JSON export and full account deletion.

#### 9.2 API Endpoints

* `POST /api/auth/magic-link` ☐ — Sends sign-in email. **Body:** `{ "email": "..." }`.
* `GET /api/auth/session` ☐ — Returns the current user or `401`.
* `GET /api/sync/progress?since={timestamp}` ☐ — Returns progress records changed after `since`.
* `PUT /api/sync/progress/:bookKey` ☐ — Upserts `{ cfi, percentage, updatedAt }`. Returns `409` with the server copy if the server record is newer.
* `GET /api/sync/library` / `PUT /api/sync/library` ☐ — Library metadata and shelves.
* `DELETE /api/account` ☐ — Deletes the user and all associated rows.

**Auth:** Session cookie (HTTP-only, SameSite) or short-lived JWT. All `/api/sync/*` routes require auth.

---

### 10. Highlights, Notes & Notebook (Phase A)

#### 10.1 Features

* **Persistent Highlights:** ☐ Selecting text offers Highlight (4 colors), Add Note, Copy, Look Up and Ask AI. Highlights are re-rendered on load via `rendition.annotations`.
* **Notes & Bookmarks:** ☐ Attach free-text notes to a highlight, plus manual page bookmarks.
* **Save AI Answer to Note:** ☐ One tap to keep an AI drawer response as a note on the selected passage.
* **Notebook View:** ☐ Per-book list of all highlights, notes and bookmarks, grouped by chapter, filterable by color, searchable, and tap-to-jump (via CFI).
* **Export:** ☐ Markdown and JSON export per book; Readwise-compatible CSV as a stretch goal.

#### 10.2 API Endpoints

* `GET /api/sync/annotations?bookKey={key}&since={timestamp}` ☐
* `PUT /api/sync/annotations/:id` ☐ — Upsert one annotation (idempotent by client-generated UUID).
* `DELETE /api/sync/annotations/:id` ☐ — Soft delete (tombstone).

Annotations are stored locally first (IndexedDB `annotations` store) and synced when signed in.

---

### 11. Dictionary & Lookup (Phase A)

* **Smart Selection Routing:** ☐ Selections of 1–2 words open an instant dictionary card. Longer selections open the AI drawer.
* **Dictionary Proxy:** ☐ `GET /api/lookup/define?word={w}&lang={code}` proxies a free dictionary source (Free Dictionary API / Wiktionary), returning `{ word, phonetic, partsOfSpeech[], definitions[], examples[] }`.
* **Caching:** ☐ Responses cached at the edge for 30 days. Previously looked-up words are also cached on the device for offline reuse.
* **Fallbacks:** ☐ If the dictionary has no entry (archaic words, proper nouns), offer "Explain with AI" as a one-tap fallback.
* **Vocabulary List:** ☐ Looked-up words are saved to a per-book vocabulary list with the source sentence, exportable as CSV for flashcard apps.
* **Latency Target:** Dictionary card shown in under 300ms (p95, cached).

---

### 12. Catalog Browse & Sources (Phase B, OPDS in Phase D)

#### 12.1 Features

* **Browse Shelves:** ☐ Home sections for Popular, Trending by genre/topic, and by language, built on Gutendex `sort`, `topic` and `languages` parameters.
* **Filters:** ☐ Language, topic, and "has EPUB" (already enforced server-side).
* **Book Detail Page:** ☐ Cover, author, subjects, description, size, and Download / Open buttons.
* **Metadata Enrichment:** ☐ Optional Open Library lookup for description, series and first-publication year.
* **Better Editions (Phase D):** ☐ Standard Ebooks as an additional source for higher-quality formatting.
* **OPDS Support (Phase D):** ☐ User can add OPDS feeds (e.g. Calibre-Web, Standard Ebooks) and browse/download from them.

#### 12.2 API Endpoints

* `GET /api/catalog/browse?sort=popular&topic={t}&languages={l}&page={n}` ☐
* `GET /api/catalog/book/:id` ☐ — Normalized detail record.
* `GET /api/catalog/opds?url={feedUrl}` ☐ — Server-side OPDS fetch/normalize (allow-listed schemes, size and timeout limits).

**Upstream Etiquette:** Cache browse responses (`s-maxage` ≥ 24h), send a descriptive `User-Agent`, and keep request volume to Project Gutenberg low; review their automated-access guidelines before launch.

---

### 13. Library Organization & Reading Stats (Phase B)

#### 13.1 Library Organization

* **Collections / Shelves:** ☐ User-created shelves (e.g. "To Read", "Favorites"); a book can belong to several.
* **Status:** ☐ `unread | reading | finished` with auto-transition at ≥98% progress.
* **Sort & Filter:** ☐ Sort by recent, title, author, progress; filter by shelf or status.
* **Series Grouping:** ☐ Group by series when metadata is available.

#### 13.2 Reading Stats

* **Sessions:** ☐ A session starts when the reader opens and ends after 2 minutes of inactivity or exit. Record start, duration and pages turned.
* **Metrics:** ☐ Time read today/week, pages per session, current streak, optional daily goal, estimated time left in chapter/book (from pace).
* **Privacy:** ☐ Stats are computed locally and synced as daily aggregates, not raw event logs.
* **Stats Screen (`/stats`):** ☐ Simple weekly bar chart, streak counter, books finished.

---

### 14. Progress-Aware AI (Phase C)

#### 14.1 Features

* **Progress Context on Every AI Call:** ☐ Requests include `progress: { chapterIndex, chapterTitle, percentage }`. The system instruction treats everything after that point as off-limits (extends `antiSpoilerStrictness`).
* **Spoiler-Safe X-Ray:** ☐ Lists characters, places and terms **seen so far** with short descriptions, built incrementally per chapter and cached.
* **Re-Entry Recap:** ☐ "Previously…" summary shown when reopening a book after 7+ days away, limited to events before the saved position.
* **Per-Book Chat:** ☐ Conversational Q&A about the book, same spoiler boundary, with a visible "Spoilers: off" indicator.
* **Chapter Summaries (extends v1.0):** ☐ Cached per `(bookKey, chapterIndex)`.
* **Save to Notebook:** ☐ Any AI answer can be saved as a note (see Section 10).

#### 14.2 API Endpoints

* `POST /api/ai/xray` ☐ — **Body:** `{ bookTitle, author, progress, chapterTextSoFar? }`. **Response:** JSON `{ characters[], places[], terms[] }` (non-streaming, cached).
* `POST /api/ai/recap` ☐ — **Body:** `{ bookTitle, author, progress, lastReadAt }`. **Response:** SSE stream.
* `POST /api/ai/chat` ☐ — **Body:** `{ bookTitle, author, progress, history[], message }`. **Response:** SSE stream. History capped (last 10 turns).

#### 14.3 Cost, Caching & Abuse Controls

* **Response Cache:** ☐ Key = hash(`mode`, `bookKey`, `progress bucket`, normalized `selectedText`, `userQuery`). Identical requests return cached output instead of calling the model.
* **Quotas:** ☐ Per-user daily AI request budget (higher for signed-in users) and per-IP token bucket; return `429` with `Retry-After`.
* **Input Limits:** ☐ Enforce existing payload caps (2MB body, 10,000-char selection) plus a per-request token ceiling.
* **Model Config:** ☐ Model name and spoiler strictness live in server config, not hard-coded in route files.
* **Disclosure:** ☐ First AI use shows a notice that selected text is sent to a third-party model.

---

### 15. Formats, Ingestion & Accessibility (Phase D)

* **Additional Formats:** ☐ PDF, MOBI/AZW3 (DRM-free), FB2 and CBZ. Evaluate client-side parsing (e.g. `foliate-js`) versus a server-side conversion step (Calibre `ebook-convert`) — see Open Questions.
* **PDF Caveat:** ☐ PDFs do not reflow; font scaling and themes apply only in a "fit width" mode. AI selection still works on the text layer.
* **Send-to-Reader:** ☐ Unique inbox address that accepts `.epub` attachments, and "Save article as ebook" from a pasted URL.
* **Text-to-Speech:** ☐ Start with the browser Web Speech API (offline-capable on many devices); evaluate server TTS later.
* **Accessibility:** ☐ Screen reader labels on all controls, dyslexia-friendly font option, adjustable line/letter spacing, and a reduced-motion setting for page turns.

---

### 16. New Data Models

**ProgressRecord:**

```json
{
  "bookKey": "gutenberg:1342",
  "cfi": "epubcfi(/6/14!/4/2/1:0)",
  "percentage": 42.5,
  "updatedAt": 1790000000000,
  "deviceId": "string"
}
```

**Annotation:**

```json
{
  "id": "uuid-v4",
  "bookKey": "gutenberg:1342",
  "type": "highlight | note | bookmark",
  "cfiRange": "epubcfi(/6/14!/4/2,/1:0,/1:50)",
  "color": "yellow | green | blue | pink",
  "text": "selected excerpt",
  "note": "optional user note or saved AI answer",
  "chapterTitle": "Chapter 5",
  "createdAt": 1790000000000,
  "updatedAt": 1790000000000,
  "deleted": false
}
```

**ReadingSession:**

```json
{
  "bookKey": "gutenberg:1342",
  "date": "2026-10-01",
  "durationSeconds": 1260,
  "pagesTurned": 31
}
```

**Book Key Convention:** `gutenberg:{id}` for catalog books, `file:{sha256}` for personal uploads.

**Server Tables (Phase A–C):** `users`, `progress`, `annotations`, `library_items`, `shelves`, `reading_daily`, `ai_cache`. Row-level security so a user can only read and write their own rows.

**New Client Stores (IndexedDB):** `annotations`, `vocabulary`, `sessions`, `shelves`, `syncQueue`.

**BookEntity Additions:** `bookKey`, `status`, `shelfIds[]`, `series`, `contentHash`, `source` (`gutenberg | upload | opds`).

---

### 17. New Routes (Frontend)

| Route | View Description | Data Source | Offline Capable |
| --- | --- | --- | --- |
| `/browse` | Catalog shelves, filters, book detail | `/api/catalog/browse` | No |
| `/notebook/:bookKey` | Highlights, notes, bookmarks, export | IndexedDB (+ sync) | Yes |
| `/stats` | Reading time, streaks, goals | IndexedDB (+ sync) | Yes |
| `/vocabulary` | Saved words across books | IndexedDB | Yes |
| `/settings/account` | Sign-in, sync status, export/delete | `/api/auth/*` | Partial |

---

### 18. Security, Privacy & Operations Additions

* **Auth Hardening:** HTTP-only cookies, CSRF protection on state-changing routes, rate-limited sign-in endpoint.
* **Data Minimization:** No EPUB text stored server-side. `chapterTextSoFar` is processed in memory and never logged.
* **Logging:** Redact `selectedText` and `message` fields from application logs.
* **User Control:** Export and delete endpoints (Section 9) with confirmation UI.
* **Backups & Migrations:** Daily database backup; versioned schema migrations.
* **Monitoring:** Track AI cache hit rate, per-user AI spend, sync conflict rate, and dictionary latency on the health endpoint.
* **CORS & Origins:** Allow-list must include the PWA origin and, for the future native shell, the Capacitor origins.

---

### 19. Updated Success Criteria (v1.1+)

* ☐ A reading position saved on device A resumes on device B within 2 seconds of opening the book.
* ☐ Highlights and notes created offline appear on all devices after reconnect, with no duplicates and correct deletions.
* ☐ Dictionary card appears in under 300ms (p95) for cached words.
* ☐ X-Ray and recap outputs contain no characters, events or terms from beyond the saved position (verified against a test set of books).
* ☐ AI cache hit rate above 30% on repeated passages; no user can exceed the daily AI quota.
* ☐ All v1.0 offline guarantees remain intact: reading, themes and bookmarks work with no account and no network.
* ☐ Account deletion removes all server-side user data.

---

### 20. Open Questions

* **Local-first vs. accounts-first:** Ship v1.0 local-only and add sync in v1.1 (recommended), or build accounts from the start?
* **Database & auth provider:** Supabase (Postgres + auth + row-level security) vs. a custom Postgres + Auth.js setup.
* **Sync of personal files:** Keep metadata-only in v1.1, or add optional encrypted file backup later?
* **Format strategy:** Client-side parsing (`foliate-js`) vs. server-side Calibre conversion for MOBI/AZW3/FB2.
* **Backend runtime:** The repo currently uses a standalone Express backend while Sections 1–7 describe Next.js Route Handlers. Choose one before building the AI routes (long-running host vs. serverless).
* **AI model & quota policy:** Default model, per-user limits, and whether heavier features (chat, X-Ray) are limited to signed-in users.
* **Licensing/terms:** Confirm Project Gutenberg's automated-access guidelines and the terms of any dictionary or metadata API before launch.

---
