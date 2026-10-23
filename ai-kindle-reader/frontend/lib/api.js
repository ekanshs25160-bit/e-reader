// The only module in the frontend that talks to the Express backend.
// Every other file must import from here instead of calling fetch() against the API directly.

const rawBase = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"
)
  .trim() // Removes any hidden newline (\n) or space from Render Env Vars
  .replace(/^https?:\/(?!\/)/i, (match) => `${match}/`) // Fixes accidental single-slash https:/ typos
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

async function backendFetch(path, init) {
  const url = resolveApiUrl(API_BASE_URL, path);
  try {
    return await fetch(url, init);
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError(`Backend unreachable at ${url}`, 0);
  }
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
    return await apiGet(`/api/catalog/search${buildQuery({ q, page })}`);
  } catch {
    const res = await fetch(
      `https://gutendex.com/books${buildQuery({ search: q, page })}`
    );
    if (!res.ok) throw new ApiError("Catalog search failed", res.status);
    const data = await res.json();
    return {
      count: data.count,
      results: (data.results || []).map(normalizeGutendexBook),
    };
  }
};

export const browseBooks = async (params = {}) => {
  try {
    return await apiGet(`/api/catalog/browse${buildQuery(params)}`);
  } catch {
    const res = await fetch(`https://gutendex.com/books${buildQuery(params)}`);
    if (!res.ok) throw new ApiError("Catalog browse failed", res.status);
    const data = await res.json();
    return {
      count: data.count,
      results: (data.results || []).map(normalizeGutendexBook),
    };
  }
};

export const getCatalogBook = async (id) => {
  try {
    return await apiGet(`/api/catalog/book/${encodeURIComponent(id)}`);
  } catch {
    // Direct client fallback to Gutendex if Render backend is asleep or blocked
    const cleanId = String(id).replace(/^gutenberg_/, "");
    const res = await fetch(`https://gutendex.com/books/${encodeURIComponent(cleanId)}`);
    if (!res.ok) throw new ApiError(`Book #${cleanId} not found`, res.status);
    const data = await res.json();
    return normalizeGutendexBook(data);
  }
};

export const lookupWord = async (word) => {
  try {
    return await apiGet(`/api/lookup/define${buildQuery({ word })}`);
  } catch {
    const clean = String(word).trim().toLowerCase();
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(clean)}`
    );
    if (!res.ok) throw new ApiError("Definition not found", res.status);
    return await res.json();
  }
};

export async function downloadEpub(id) {
  const res = await backendFetch(`/api/catalog/download/${encodeURIComponent(id)}`);
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
