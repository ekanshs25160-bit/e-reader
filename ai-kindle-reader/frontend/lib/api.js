// The only module in the frontend that talks to the Express backend.
// Every other file must import from here instead of calling fetch() against the API directly.

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

// fetch() against the backend; network-level failures become ApiError(status 0).
// AbortError is re-thrown untouched so callers can tell a cancel from a failure.
async function backendFetch(path, init) {
  try {
    return await fetch(`${API_BASE}${path}`, init);
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError(`Backend unreachable at ${API_BASE}`, 0);
  }
}

// Backend errors look like { statusCode, success: false, message, errors }.
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

export const searchBooks = (q, page = 1) =>
  apiGet(`/api/catalog/search${buildQuery({ q, page })}`);

export const browseBooks = (params = {}) =>
  apiGet(`/api/catalog/browse${buildQuery(params)}`);

export const getCatalogBook = (id) =>
  apiGet(`/api/catalog/book/${encodeURIComponent(id)}`);

export const lookupWord = (word) =>
  apiGet(`/api/lookup/define${buildQuery({ word })}`);

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

// POST JSON and consume a Server-Sent-Events style stream:
//   data: {"text":"..."}\n\n   -> onToken(text)
//   data: {"error":"..."}\n\n  -> onError(ApiError)
//   data: [DONE]\n\n           -> onDone()
// Aborting via `signal` stops quietly: neither onDone nor onError is called.
export async function streamAi(endpoint, body, { onToken, onDone, onError, signal } = {}) {
  let finished = false;
  let unhandledError = null;

  const fail = (err) => {
    if (finished) return;
    finished = true;
    if (onError) onError(err);
    else unhandledError = err; // No handler: surface it to the caller once we unwind.
  };

  const complete = () => {
    if (finished) return;
    finished = true;
    onDone?.();
  };

  // Returns true once the stream has reached a terminal state ([DONE] or error).
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
      return false; // Ignore malformed events instead of killing the stream.
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

      // Events end at a blank line; whatever trails the last blank line is a partial chunk.
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
