import { ApiError, isAbortError, errorFromResponse } from './errors';

const isBrowser = typeof window !== 'undefined';

const rawBase = isBrowser
  ? '/api'
  : (
      process.env.NEXT_PUBLIC_API_URL ||
      'https://e-reader-backend-46oy.onrender.com/api'
    )
      .trim()
      .replace(/\/+$/, '');

export const API_BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`;
export const API_BASE = API_BASE_URL.replace(/\/api\/?$/, '');

export function resolveApiUrl(baseUrl, endpoint) {
  const base = (baseUrl || '').trim().replace(/\/+$/, '');
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const hasApiInBase = base.endsWith('/api');
  const rootBase = hasApiInBase ? base.slice(0, -4) : base;

  if (path.startsWith('/api/')) {
    return `${rootBase}${path}`;
  } else if (
    path === '/health' ||
    path.startsWith('/health?') ||
    path.startsWith('/health/')
  ) {
    return `${rootBase}${path}`;
  } else {
    return `${rootBase}/api${path}`;
  }
}

export function buildQuery(params = {}) {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      qs.append(key, String(value));
    }
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function backendFetch(path, init, maxRetries = 4) {
  const url = resolveApiUrl(API_BASE_URL, path);
  let lastErr = null;
  let res = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      res = await fetch(url, init);
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
  throw new ApiError(`Backend unreachable at ${url}: ${lastErr?.message || 'Connection failed'}`, 0);
}

export async function fetchFromApi(endpoint, options = {}) {
  const url = resolveApiUrl(API_BASE_URL, endpoint);

  const defaultHeaders = {
    'Content-Type': 'application/json',
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

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }
  return response.blob();
}

export async function apiGet(path) {
  const res = await backendFetch(path);
  if (!res.ok) throw await errorFromResponse(res);

  let json;
  try {
    json = await res.json();
  } catch {
    throw new ApiError('Backend returned an invalid response', res.status);
  }
  return json?.data;
}
