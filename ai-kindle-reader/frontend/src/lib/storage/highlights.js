import { isBrowser, highlightsStore, recordWriteTimestamp } from './db';

export async function getHighlights(bookId) {
  if (!isBrowser || !highlightsStore) return [];
  try {
    return (await highlightsStore.getItem(String(bookId))) || [];
  } catch {
    return [];
  }
}

export async function getAllHighlights() {
  if (!isBrowser || !highlightsStore) return [];
  try {
    const all = [];
    await highlightsStore.iterate((list, bookId) => {
      if (Array.isArray(list)) {
        list.forEach((item) => {
          all.push({ ...item, bookId });
        });
      }
    });
    return all;
  } catch (err) {
    console.warn('[KindleAIReader DB] Error fetching all highlights:', err);
    return [];
  }
}

export async function addHighlight(bookId, highlight) {
  if (!isBrowser || !highlightsStore) return null;
  try {
    const id = String(bookId);
    const list = (await highlightsStore.getItem(id)) || [];
    const newEntry = {
      id: `hl-${Date.now()}`,
      createdAt: Date.now(),
      ...highlight,
    };
    const updated = [newEntry, ...list];
    await highlightsStore.setItem(id, updated);
    recordWriteTimestamp();
    return newEntry;
  } catch (err) {
    console.error('[KindleAIReader DB] Error adding highlight:', err);
    return null;
  }
}

export async function removeHighlight(bookId, highlightId) {
  if (!isBrowser || !highlightsStore) return false;
  try {
    const id = String(bookId);
    const list = (await highlightsStore.getItem(id)) || [];
    const updated = list.filter((h) => h.id !== highlightId);
    await highlightsStore.setItem(id, updated);
    recordWriteTimestamp();
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error removing highlight:', err);
    return false;
  }
}
