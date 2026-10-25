import { apiGet, backendFetch, buildQuery } from './client';
import { ApiError, isAbortError, errorFromResponse } from './errors';

export function normalizeGutendexBook(b) {
  return {
    id: b.id,
    title: b.title,
    author: b.authors?.map((a) => a.name).join(', ') || 'Unknown Author',
    authors: b.authors?.map((a) => a.name) || ['Unknown Author'],
    coverUrl:
      b.formats?.['image/jpeg'] ||
      `https://www.gutenberg.org/cache/epub/${b.id}/pg${b.id}.cover.medium.jpg`,
    downloadUrl:
      b.formats?.['application/epub+zip'] ||
      `https://www.gutenberg.org/ebooks/${b.id}.epub3.images`,
    subjects: b.subjects || [],
    bookshelves: b.bookshelves || [],
    languages: b.languages || ['en'],
    downloadCount: b.download_count || 0,
    summaries: b.summaries || [],
  };
}

export async function searchBooks(q, page = 1) {
  try {
    const data = await apiGet(`/api/catalog/search${buildQuery({ q, page })}`);
    return {
      total: data?.total ?? (data?.books?.length || 0),
      books: data?.books || [],
    };
  } catch {
    const res = await fetch(
      `https://gutendex.com/books/?${buildQuery({ search: q, page }).replace(/^\?/, '')}`
    );
    if (!res.ok) throw new ApiError('Catalog search failed', res.status);
    const data = await res.json();
    return {
      total: data.count,
      books: (data.results || []).map(normalizeGutendexBook),
    };
  }
}

export async function browseBooks(params = {}) {
  try {
    const data = await apiGet(`/api/catalog/browse${buildQuery(params)}`);
    return {
      total: data?.total ?? (data?.books?.length || 0),
      books: data?.books || [],
    };
  } catch {
    const queryParams = new URLSearchParams();
    if (params.languages) queryParams.set('languages', params.languages);
    if (params.page) queryParams.set('page', params.page);
    if (params.topic && params.topic !== 'All Classics') queryParams.set('topic', params.topic);

    const qs = queryParams.toString();
    const res = await fetch(`https://gutendex.com/books/${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new ApiError('Catalog browse failed', res.status);
    const data = await res.json();
    return {
      total: data.count,
      books: (data.results || []).map(normalizeGutendexBook),
    };
  }
}

export async function getCatalogBook(id) {
  const cleanId = String(id).replace(/^gutenberg_/, '').trim();
  try {
    return await apiGet(`/api/catalog/book/${encodeURIComponent(cleanId)}`);
  } catch {
    try {
      const res = await fetch(`https://gutendex.com/books/${encodeURIComponent(cleanId)}/`);
      if (res.ok) {
        const data = await res.json();
        return normalizeGutendexBook(data);
      }
    } catch {}

    throw new ApiError(`Book #${cleanId} not found on Project Gutenberg`, 404);
  }
}

export async function downloadEpub(id) {
  const cleanId = String(id || '').replace(/^gutenberg_/, '').trim();
  const res = await backendFetch(`/api/catalog/download/${encodeURIComponent(cleanId)}`);
  if (!res.ok) throw await errorFromResponse(res);

  let blob;
  try {
    blob = await res.blob();
  } catch (err) {
    if (isAbortError(err)) throw err;
    throw new ApiError('Download was interrupted', res.status);
  }

  if (blob.size === 0) {
    throw new ApiError('Downloaded file is not a valid EPUB', res.status);
  }

  const head = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
  if (head.length < 2 || head[0] !== 0x50 || head[1] !== 0x4b) {
    throw new ApiError('Downloaded file is not a valid EPUB', res.status);
  }

  return blob;
}
