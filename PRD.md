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
* **Stateless Serverless Execution:** Backend runs completely stateless; no operational databases (PostgreSQL/MongoDB) required.


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