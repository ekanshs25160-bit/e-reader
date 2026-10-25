import { isBrowser, metaStore, blobStore, bookmarksStore, highlightsStore, progressStore, ensureStoresReady, recordWriteTimestamp } from './db';

export function slugify(text) {
  return (
    String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `book-${Date.now()}`
  );
}

export async function saveBook(bookIdOrMeta, metadataOrBlob, maybeBlob) {
  if (!isBrowser || !metaStore) return null;
  await ensureStoresReady();

  let id;
  let metadata;
  let fileBlob;

  if (typeof bookIdOrMeta === 'object' && bookIdOrMeta !== null) {
    metadata = bookIdOrMeta;
    id = String(metadata.id || slugify(metadata.title));
    fileBlob = metadataOrBlob || null;
  } else {
    id = String(bookIdOrMeta);
    metadata = metadataOrBlob || {};
    fileBlob = maybeBlob || null;
  }

  if (fileBlob && blobStore) {
    await blobStore.setItem(id, fileBlob);
  }

  const existing = (await metaStore.getItem(id)) || {};

  const rawPct =
    metadata.progressPercentage !== undefined
      ? metadata.progressPercentage
      : metadata.progress !== undefined
      ? metadata.progress
      : existing.progressPercentage ?? existing.progress ?? 0;

  const normalizedPercent =
    typeof rawPct === 'number' && rawPct > 0 && rawPct <= 1
      ? Math.round(rawPct * 100)
      : Math.min(100, Math.max(0, Math.round(Number(rawPct) || 0)));

  const hasBinary = Boolean(
    fileBlob || (blobStore && (await blobStore.getItem(id)))
  );

  const bookRecord = {
    ...existing,
    ...metadata,
    id,
    title: metadata.title || existing.title || 'Untitled Book',
    author: metadata.author || existing.author || 'Unknown Author',
    coverUrl:
      metadata.coverUrl && !metadata.coverUrl.startsWith('blob:')
        ? metadata.coverUrl
        : existing.coverUrl || null,
    fileSize: fileBlob?.size || metadata.fileSize || existing.fileSize || 0,
    progressPercentage: normalizedPercent,
    progress: normalizedPercent,
    currentPage: metadata.currentPage || existing.currentPage || 1,
    totalPages: metadata.totalPages || existing.totalPages || 1,
    lastReadCfi: metadata.lastReadCfi ?? existing.lastReadCfi ?? null,
    currentChapter:
      metadata.currentChapter ??
      existing.currentChapter ??
      metadata.chapterHeading ??
      'Start',
    lastReadTimestamp: Date.now(),
    addedAt: existing.addedAt || metadata.addedAt || Date.now(),
    isOfflineAvailable: hasBinary,
    hasBinary,
    status:
      metadata.status ||
      (normalizedPercent >= 100
        ? 'finished'
        : normalizedPercent > 0
        ? 'reading'
        : existing.status || 'to-read'),
  };

  delete bookRecord.file;

  await metaStore.setItem(id, bookRecord);
  recordWriteTimestamp();
  return bookRecord;
}

export async function getAllBooks() {
  if (!isBrowser || !metaStore) return [];
  try {
    const books = [];
    await metaStore.iterate((value) => {
      const { file, ...cleanMeta } = value;
      books.push(cleanMeta);
    });

    return books.sort(
      (a, b) => (b.lastReadTimestamp || 0) - (a.lastReadTimestamp || 0)
    );
  } catch (err) {
    console.warn('[KindleAIReader DB] Error fetching all books:', err);
    return [];
  }
}

export async function getBookMeta(bookId) {
  if (!isBrowser || !metaStore) return null;
  try {
    return await metaStore.getItem(String(bookId));
  } catch (err) {
    console.warn('[KindleAIReader DB] Error getting book meta:', err);
    return null;
  }
}

export const getBook = getBookMeta;

export async function getBookBlob(bookId) {
  if (!isBrowser || !blobStore) return null;
  try {
    return await blobStore.getItem(String(bookId));
  } catch (err) {
    console.warn('[KindleAIReader DB] Error reading book blob:', err);
    return null;
  }
}

export const getBookFile = getBookBlob;

export async function deleteBook(bookId) {
  if (!isBrowser) return false;
  try {
    const id = String(bookId);
    await Promise.all([
      metaStore?.removeItem(id),
      blobStore?.removeItem(id),
      bookmarksStore?.removeItem(id),
      highlightsStore?.removeItem(id),
      progressStore?.removeItem(id),
    ]);
    recordWriteTimestamp();
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error deleting book:', err);
    return false;
  }
}
