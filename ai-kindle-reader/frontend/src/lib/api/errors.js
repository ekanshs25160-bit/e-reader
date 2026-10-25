export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const isAbortError = (err) => err?.name === 'AbortError';

export async function errorFromResponse(res) {
  let message = `Request failed with status ${res.status}`;
  try {
    const body = await res.json();
    if (body?.message) message = body.message;
  } catch {
    // Non-JSON error body
  }
  return new ApiError(message, res.status);
}
