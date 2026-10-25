/**
 * Validates public environment variables at startup and fails fast with a clear error message
 * if an invalid URL or malformed configuration is provided.
 */

const DEFAULT_API_URL = 'http://localhost:8000';

export function validateEnv(rawEnv = process.env) {
  const rawApiUrl = (rawEnv.NEXT_PUBLIC_API_URL || '').trim();

  if (rawApiUrl) {
    try {
      const parsed = new URL(rawApiUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error(`Invalid protocol "${parsed.protocol}"`);
      }
    } catch (err) {
      throw new Error(
        `[env] Invalid NEXT_PUBLIC_API_URL="${rawApiUrl}". Expected a valid http(s) URL (e.g., "http://localhost:8000"). ${err.message}`
      );
    }
  }

  const normalizedBase = (rawApiUrl || DEFAULT_API_URL).replace(/\/+$/, '');

  return {
    NEXT_PUBLIC_API_URL: normalizedBase,
    API_BASE_URL: normalizedBase.endsWith('/api') ? normalizedBase : `${normalizedBase}/api`,
    NODE_ENV: rawEnv.NODE_ENV || 'development',
  };
}

export const env = validateEnv();
