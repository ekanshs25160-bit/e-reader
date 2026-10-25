import { backendFetch } from './client';
import { ApiError, isAbortError, errorFromResponse } from './errors';

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
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).replace(/^ /, ''))
      .join('\n');

    if (!data) return false;

    if (data.trim() === '[DONE]') {
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
    if (typeof payload?.text === 'string' && payload.text) {
      onToken?.(payload.text);
    }
    return false;
  };

  let reader;
  try {
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const res = await backendFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(body ?? {}),
      signal,
    });

    if (!res.ok) throw await errorFromResponse(res);
    if (!res.body) throw new ApiError('Backend returned an empty stream', res.status);

    reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let terminal = false;

    while (!terminal) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

      const events = buffer.split('\n\n');
      buffer = events.pop();

      for (const event of events) {
        if (handleEvent(event)) {
          terminal = true;
          break;
        }
      }
    }

    if (!terminal) {
      buffer += decoder.decode().replace(/\r\n/g, '\n');
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
    fail(err instanceof ApiError ? err : new ApiError(err?.message || 'Stream failed', 0));
  }

  if (unhandledError) throw unhandledError;
}
