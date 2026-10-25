import { isBrowser, bookmarksStore, recordWriteTimestamp } from './db';

export async function getBookmarks(bookId) {
  if (!isBrowser || !bookmarksStore) return [];
  try {
    return (await bookmarksStore.getItem(String(bookId))) || [];
  } catch {
    return [];
  }
}

export async function addBookmark(bookId, bookmark) {
  if (!isBrowser || !bookmarksStore) return null;
  try {
    const id = String(bookId);
    const list = (await bookmarksStore.getItem(id)) || [];
    const newEntry = {
      id: `bm-${Date.now()}`,
      createdAt: Date.now(),
      ...bookmark,
    };
    const updated = [newEntry, ...list];
    await bookmarksStore.setItem(id, updated);
    recordWriteTimestamp();
    return newEntry;
  } catch (err) {
    console.error('[KindleAIReader DB] Error adding bookmark:', err);
    return null;
  }
}

export async function removeBookmark(bookId, bookmarkId) {
  if (!isBrowser || !bookmarksStore) return false;
  try {
    const id = String(bookId);
    const list = (await bookmarksStore.getItem(id)) || [];
    const updated = list.filter((b) => b.id !== bookmarkId);
    await bookmarksStore.setItem(id, updated);
    recordWriteTimestamp();
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error removing bookmark:', err);
    return false;
  }
}
