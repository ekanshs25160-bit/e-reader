import {
  metaStore,
  blobStore,
  progressStore,
  highlightsStore,
  bookmarksStore,
  vocabStore,
  statsStore,
  settingsStore,
} from './db';
import { base64ToBlob } from './archive-helpers';

export async function restoreArchiveData(archiveData) {
  const results = {
    booksRestored: 0,
    highlightsRestored: 0,
    bookmarksRestored: 0,
    vocabularyRestored: 0,
    sessionsRestored: 0,
  };

  const books = Array.isArray(archiveData.books) ? archiveData.books : [];
  if (metaStore && books.length > 0) {
    for (const b of books) {
      if (!b?.id) continue;
      const existing = (await metaStore.getItem(String(b.id))) || {};
      await metaStore.setItem(String(b.id), { ...existing, ...b });
      results.booksRestored++;
    }
  }

  if (blobStore && archiveData.binaries && typeof archiveData.binaries === 'object') {
    for (const [bookId, b64] of Object.entries(archiveData.binaries)) {
      try {
        if (b64 && typeof b64 === 'string') {
          const blob = base64ToBlob(b64);
          await blobStore.setItem(String(bookId), blob);
        }
      } catch (err) {
        console.warn(`Failed restoring binary for ${bookId}:`, err);
      }
    }
  }

  const progressList = Array.isArray(archiveData.progress) ? archiveData.progress : [];
  if (progressStore && progressList.length > 0) {
    for (const p of progressList) {
      if (!p?.bookId) continue;
      const { bookId, ...progData } = p;
      const existing = (await progressStore.getItem(String(bookId))) || {};
      await progressStore.setItem(String(bookId), { ...existing, ...progData });
    }
  }

  const highlightGroups = Array.isArray(archiveData.highlights) ? archiveData.highlights : [];
  if (highlightsStore && highlightGroups.length > 0) {
    for (const group of highlightGroups) {
      if (!group?.bookId || !Array.isArray(group.items)) continue;
      const bookId = String(group.bookId);
      const existing = (await highlightsStore.getItem(bookId)) || [];
      const existingIds = new Set(existing.map((h) => h.id));
      const newItems = group.items.filter((h) => !existingIds.has(h.id));
      await highlightsStore.setItem(bookId, [...existing, ...newItems]);
      results.highlightsRestored += newItems.length;
    }
  }

  const bookmarkGroups = Array.isArray(archiveData.bookmarks) ? archiveData.bookmarks : [];
  if (bookmarksStore && bookmarkGroups.length > 0) {
    for (const group of bookmarkGroups) {
      if (!group?.bookId || !Array.isArray(group.items)) continue;
      const bookId = String(group.bookId);
      const existing = (await bookmarksStore.getItem(bookId)) || [];
      const existingIds = new Set(existing.map((b) => b.id || b.cfi));
      const newItems = group.items.filter((b) => !existingIds.has(b.id || b.cfi));
      await bookmarksStore.setItem(bookId, [...existing, ...newItems]);
      results.bookmarksRestored += newItems.length;
    }
  }

  const vocabList = Array.isArray(archiveData.vocabulary)
    ? archiveData.vocabulary
    : Array.isArray(archiveData.words)
    ? archiveData.words
    : [];
  if (vocabStore && vocabList.length > 0) {
    for (const v of vocabList) {
      if (!v?.word && !v?.id) continue;
      const id = String(v.id || v.word).toLowerCase().trim();
      const existing = (await vocabStore.getItem(id)) || {};
      await vocabStore.setItem(id, { ...existing, ...v });
      results.vocabularyRestored++;
    }
  }

  const sessionsList = Array.isArray(archiveData.sessions) ? archiveData.sessions : [];
  if (statsStore && sessionsList.length > 0) {
    for (const s of sessionsList) {
      if (!s?.date) continue;
      const existing = (await statsStore.getItem(s.date)) || {};
      await statsStore.setItem(s.date, { ...existing, ...s });
      results.sessionsRestored++;
    }
  }

  if (settingsStore && archiveData.settings && typeof archiveData.settings === 'object') {
    const { userProfile, ...restSettings } = archiveData.settings;
    if (Object.keys(restSettings).length > 0) {
      const existing = (await settingsStore.getItem('reader_settings')) || {};
      await settingsStore.setItem('reader_settings', { ...existing, ...restSettings });
    }
    if (userProfile && typeof userProfile === 'object') {
      await settingsStore.setItem('user_profile', userProfile);
      if (userProfile.name) {
        localStorage.setItem('flyleaf-user-name', userProfile.name);
      }
      if (userProfile.avatar) {
        localStorage.setItem('flyleaf-user-avatar', userProfile.avatar);
      }
    }
  }

  return results;
}
