// The only module in the frontend that talks to the Express backend.
// Every other file must import from here instead of calling fetch() against the API directly.

const isBrowser = typeof window !== "undefined";

const rawBase = isBrowser
  ? "/api" // In the browser, always use same-origin /api (proxied by next.config.mjs — zero CORS!)
  : (
      process.env.NEXT_PUBLIC_API_URL ||
      "https://e-reader-backend-46oy.onrender.com/api"
    )
      .trim()
      .replace(/\/+$/, "");

export const API_BASE_URL = rawBase.endsWith("/api") ? rawBase : `${rawBase}/api`;

// Base host without trailing /api for backward compatibility
export const API_BASE = API_BASE_URL.replace(/\/api\/?$/, "");

// Resolves backend URLs whether the endpoint starts with /api or not,
// and whether API_BASE_URL ends with /api or not.
export function resolveApiUrl(baseUrl, endpoint) {
  const base = (baseUrl || "").trim().replace(/\/+$/, "");
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  const hasApiInBase = base.endsWith("/api");
  const rootBase = hasApiInBase ? base.slice(0, -4) : base;

  if (path.startsWith("/api/")) {
    return `${rootBase}${path}`;
  } else if (
    path === "/health" ||
    path.startsWith("/health?") ||
    path.startsWith("/health/")
  ) {
    return `${rootBase}${path}`;
  } else {
    return `${rootBase}/api${path}`;
  }
}

export async function fetchFromApi(endpoint, options = {}) {
  const url = resolveApiUrl(API_BASE_URL, endpoint);

  const defaultHeaders = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: defaultHeaders,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.blob();
}

export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

const isAbortError = (err) => err?.name === "AbortError";

function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      qs.append(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : "";
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function backendFetch(path, init, maxRetries = 4) {
  const url = resolveApiUrl(API_BASE_URL, path);
  let lastErr = null;
  let res = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      res = await fetch(url, init);
      // Auto-retry on 502/503/504 while Render free-tier container boots from cold sleep
      if ((res.status === 502 || res.status === 503 || res.status === 504) && attempt < maxRetries) {
        await wait(2500 * (attempt + 1));
        continue;
      }
      return res;
    } catch (err) {
      if (isAbortError(err)) throw err;
      lastErr = err;
      if (attempt < maxRetries) {
        await wait(2500 * (attempt + 1));
        continue;
      }
    }
  }

  if (res) return res;
  throw new ApiError(`Backend unreachable at ${url}: ${lastErr?.message || "Connection failed"}`, 0);
}

async function errorFromResponse(res) {
  let message = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.message) message = body.message;
  } catch {
    // Non-JSON error body; keep the generic message.
  }
  return new ApiError(message, res.status);
}

export async function apiGet(path) {
  const res = await backendFetch(path);
  if (!res.ok) throw await errorFromResponse(res);

  let json;
  try {
    json = await res.json();
  } catch {
    throw new ApiError("Backend returned an invalid response", res.status);
  }
  return json?.data;
}

// Helper to normalize raw Gutendex book objects if backend is cold-starting/unreachable
function normalizeGutendexBook(b) {
  return {
    id: b.id,
    title: b.title,
    author: b.authors?.map((a) => a.name).join(", ") || "Unknown Author",
    authors: b.authors?.map((a) => a.name) || ["Unknown Author"],
    coverUrl:
      b.formats?.["image/jpeg"] ||
      `https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.cover.medium.jpg`,
    downloadUrl:
      b.formats?.["application/epub+zip"] ||
      `https://www.gutenberg.org/ebooks/${b.id}.epub3.images`,
    subjects: b.subjects || [],
    bookshelves: b.bookshelves || [],
    languages: b.languages || ["en"],
    downloadCount: b.download_count || 0,
    summaries: b.summaries || [],
  };
}

export const searchBooks = async (q, page = 1) => {
  try {
    const data = await apiGet(`/api/catalog/search${buildQuery({ q, page })}`);
    return {
      total: data?.total ?? (data?.books?.length || 0),
      books: data?.books || [],
    };
  } catch {
    const res = await fetch(
      `https://gutendex.com/books/?${buildQuery({ search: q, page }).replace(/^\?/, "")}`
    );
    if (!res.ok) throw new ApiError("Catalog search failed", res.status);
    const data = await res.json();
    return {
      total: data.count,
      books: (data.results || []).map(normalizeGutendexBook),
    };
  }
};

export const browseBooks = async (params = {}) => {
  try {
    const data = await apiGet(`/api/catalog/browse${buildQuery(params)}`);
    return {
      total: data?.total ?? (data?.books?.length || 0),
      books: data?.books || [],
    };
  } catch {
    const queryParams = new URLSearchParams();
    if (params.languages) queryParams.set("languages", params.languages);
    if (params.page) queryParams.set("page", params.page);
    if (params.topic && params.topic !== "All Classics") queryParams.set("topic", params.topic);

    const qs = queryParams.toString();
    const res = await fetch(`https://gutendex.com/books/${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new ApiError("Catalog browse failed", res.status);
    const data = await res.json();
    return {
      total: data.count,
      books: (data.results || []).map(normalizeGutendexBook),
    };
  }
};

export const getCatalogBook = async (id) => {
  const cleanId = String(id).replace(/^gutenberg_/, "").trim();
  try {
    return await apiGet(`/api/catalog/book/${encodeURIComponent(cleanId)}`);
  } catch {
    // Direct client fallback to Gutendex (with mandatory trailing slash)
    try {
      const res = await fetch(`https://gutendex.com/books/${encodeURIComponent(cleanId)}/`);
      if (res.ok) {
        const data = await res.json();
        return normalizeGutendexBook(data);
      }
    } catch {}

    throw new ApiError(`Book #${cleanId} not found on Project Gutenberg`, 404);
  }
};

// ---- Dictionary lookup (Next.js server-to-server proxy) ----
// Resolves to a normalized object that existing callers consume:
//   { word, phonetic, audio, partsOfSpeech: string[], definition: string[], entries: <raw API array> }
const dictCache = new Map();

function normalizeDictionaryEntries(entries, fallbackWord) {
  const first = entries?.[0] || {};
  const phoneticsAll = entries.flatMap((e) => e.phonetics || []);
  const phonetic =
    entries.find((e) => e.phonetic)?.phonetic ||
    phoneticsAll.find((p) => p?.text)?.text ||
    "";
  const audio = phoneticsAll.find((p) => p?.audio)?.audio || "";

  const partsOfSpeech = [];
  const definition = [];
  for (const entry of entries) {
    for (const meaning of entry.meanings || []) {
      if (meaning.partOfSpeech && !partsOfSpeech.includes(meaning.partOfSpeech)) {
        partsOfSpeech.push(meaning.partOfSpeech);
      }
      for (const d of meaning.definitions || []) {
        if (d?.definition) definition.push(d.definition);
      }
    }
  }

  return {
    word: first.word || fallbackWord,
    phonetic,
    audio,
    partsOfSpeech,
    definition,
    entries,
  };
}

export const lookupWord = async (word) => {
  const clean = String(word || "")
    .trim()
    .replace(/^[^a-zA-Z0-9-]+|[^a-zA-Z0-9-]+$/g, "")
    .toLowerCase();

  const empty = (w) => ({ word: w, phonetic: "", audio: "", partsOfSpeech: [], definition: [], entries: [] });

  if (!clean || (/\s/.test(clean) && clean.split(/\s+/).length > 3)) return empty(clean);

  // Dictionary only handles single headwords; use first token for short phrases.
  const term = clean.split(/\s+/)[0];

  if (dictCache.has(term)) return dictCache.get(term);

  try {
    const data = await apiGet(`/api/lookup/define?word=${encodeURIComponent(term)}`);
    let result;
    if (Array.isArray(data) && data.length > 0) {
      result = normalizeDictionaryEntries(data, term);
    } else if (data && Array.isArray(data.definition) && data.definition.length > 0) {
      result = { ...empty(term), ...data, entries: data.entries || [] };
    } else {
      result = empty(term);
    }
    dictCache.set(term, result);
    return result;
  } catch (err) {
    return empty(term);
  }
};

export async function downloadEpub(id) {
  const cleanId = String(id || "").replace(/^gutenberg_/, "").trim();
  const res = await backendFetch(`/api/catalog/download/${encodeURIComponent(cleanId)}`);
  if (!res.ok) throw await errorFromResponse(res);

  let blob;
  try {
    blob = await res.blob();
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError("Download was interrupted", res.status);
  }

  if (blob.size === 0) {
    throw new ApiError("Downloaded file is not a valid EPUB", res.status);
  }

  // An EPUB is a zip archive, which always starts with "PK".
  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (head.length < 2 || head[0] !== 0x50 || head[1] !== 0x4b) {
    throw new ApiError("Downloaded file is not a valid EPUB", res.status);
  }

  return blob;
}

export async function streamAi(endpoint, body, { onToken, onDone, onError, signal } = {}) {
  let finished = false;
  let unhandledError = null;

  const fail = (err) => {
    if (finished) return;
    finished = true;
    if (onError) onError(err);
    else unhandledError = err;
  };

  const complete = () => {
    if (finished) return;
    finished = true;
    onDone?.();
  };

  const handleEvent = (block) => {
    const data = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).replace(/^ /, ""))
      .join("\n");

    if (!data) return false;

    if (data.trim() === "[DONE]") {
      complete();
      return true;
    }

    let payload;
    try {
      payload = JSON.parse(data);
    } catch {
      return false;
    }

    if (payload?.error) {
      fail(new ApiError(String(payload.error), 0));
      return true;
    }
    if (typeof payload?.text === "string" && payload.text) {
      onToken?.(payload.text);
    }
    return false;
  };

  let reader;
  try {
    const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const res = await backendFetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify(body ?? {}),
      signal,
    });

    if (!res.ok) throw await errorFromResponse(res);
    if (!res.body) throw new ApiError("Backend returned an empty stream", res.status);

    reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let terminal = false;

    while (!terminal) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");

      const events = buffer.split("\n\n");
      buffer = events.pop();

      for (const event of events) {
        if (handleEvent(event)) {
          terminal = true;
          break;
        }
      }
    }

    if (!terminal) {
      buffer += decoder.decode().replace(/\r\n/g, "\n");
      if (buffer.trim()) terminal = handleEvent(buffer);
    }

    if (terminal) {
      await reader.cancel().catch(() => {});
    }
    complete();
  } catch (err) {
    if (reader) await reader.cancel().catch(() => {});
    if (isAbortError(err) || signal?.aborted) {
      finished = true;
      return;
    }
    fail(err instanceof ApiError ? err : new ApiError(err?.message || "Stream failed", 0));
  }

  if (unhandledError) throw unhandledError;
}

