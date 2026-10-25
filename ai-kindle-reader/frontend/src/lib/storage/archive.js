import {
  isBrowser,
  metaStore,
  blobStore,
  progressStore,
  highlightsStore,
  bookmarksStore,
  vocabStore,
  statsStore,
  settingsStore,
  recordWriteTimestamp,
  getLastSavedTimestamp,
} from './db';
import { getAllBooks } from './books';
import { getAllHighlights } from './highlights';
import { getAllVocabularyWords } from './vocabulary';
import { blobToBase64, base64ToBlob } from './archive-helpers';
import { restoreArchiveData } from './archive-restore';

export { blobToBase64, base64ToBlob };

export async function exportVaultArchive({ includeBinaries = false } = {}) {
  if (!isBrowser) return null;
  try {
    const books = [];
    if (metaStore) {
      await metaStore.iterate((val) => {
        const { file, ...cleanMeta } = val;
        books.push(cleanMeta);
      });
    }

    const progress = [];
    if (progressStore) {
      await progressStore.iterate((val, key) => {
        progress.push({ bookId: key, ...val });
      });
    }

    const highlights = [];
    if (highlightsStore) {
      await highlightsStore.iterate((list, key) => {
        highlights.push({ bookId: key, items: Array.isArray(list) ? list : [] });
      });
    }

    const bookmarks = [];
    if (bookmarksStore) {
      await bookmarksStore.iterate((list, key) => {
        bookmarks.push({ bookId: key, items: Array.isArray(list) ? list : [] });
      });
    }

    const vocabulary = [];
    if (vocabStore) {
      await vocabStore.iterate((val) => {
        vocabulary.push(val);
      });
    }

    const sessions = [];
    if (statsStore) {
      await statsStore.iterate((val, key) => {
        sessions.push({ date: key, ...val });
      });
    }

    const settings = settingsStore ? await settingsStore.getItem('reader_settings') : null;
    const userProfile = settingsStore ? await settingsStore.getItem('user_profile') : null;

    let binaries = undefined;
    if (includeBinaries && blobStore) {
      binaries = {};
      for (const b of books) {
        try {
          const blob = await blobStore.getItem(b.id);
          if (blob) {
            binaries[b.id] = await blobToBase64(blob);
          }
        } catch (err) {
          console.warn(`Failed to export binary for ${b.id}:`, err);
        }
      }
    }

    return {
      version: '2.0.0',
      app: 'Flyleaf E-Reader Archive',
      exportedAt: new Date().toISOString(),
      books,
      progress,
      highlights,
      bookmarks,
      vocabulary,
      sessions,
      settings: { ...(settings || {}), userProfile },
      binaries,
    };
  } catch (err) {
    console.error('[KindleAIReader DB] Error exporting archive:', err);
    return null;
  }
}

export async function restoreVaultArchive(archiveData) {
  if (!isBrowser || !archiveData || typeof archiveData !== 'object') {
    throw new Error('Invalid archive file. The JSON does not match the Flyleaf backup format.');
  }

  const results = await restoreArchiveData(archiveData);
  recordWriteTimestamp();
  return results;
}

export async function eraseEntireVault() {
  if (!isBrowser) return false;
  try {
    const stores = [
      metaStore,
      blobStore,
      vocabStore,
      statsStore,
      bookmarksStore,
      highlightsStore,
      progressStore,
      settingsStore,
    ];
    await Promise.all(stores.map((s) => s?.clear?.()));

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('flyleaf-theme');
      localStorage.removeItem('flyleaf-user-name');
      localStorage.removeItem('flyleaf-user-avatar');
      localStorage.removeItem('flyleaf_last_write_timestamp');
    }
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error erasing vault:', err);
    throw err;
  }
}

export async function getVaultStorageSummary() {
  if (!isBrowser) {
    return {
      booksCount: 0,
      highlightsCount: 0,
      vocabularyCount: 0,
      storageBytes: 0,
      storageFormatted: '0 MB',
      lastSaved: null,
      lastSavedFormatted: 'Never',
    };
  }

  const [allBooks, allHighlights, allWords] = await Promise.all([
    getAllBooks(),
    getAllHighlights(),
    getAllVocabularyWords(),
  ]);

  let storageBytes = 0;
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      if (estimate && typeof estimate.usage === 'number' && estimate.usage > 0) {
        storageBytes = estimate.usage;
      }
    } catch (err) {
      console.warn('Storage estimate failed:', err);
    }
  }

  if (storageBytes === 0 && blobStore) {
    try {
      await blobStore.iterate((val) => {
        if (val && typeof val.size === 'number') {
          storageBytes += val.size;
        } else if (val && val.byteLength) {
          storageBytes += val.byteLength;
        }
      });
    } catch {}
  }

  let storageFormatted = '0 MB';
  if (storageBytes >= 1024 * 1024) {
    storageFormatted = `${(storageBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else if (storageBytes >= 1024) {
    storageFormatted = `${Math.round(storageBytes / 1024)} KB`;
  } else if (storageBytes > 0) {
    storageFormatted = `${storageBytes} B`;
  }

  const lastSaved = getLastSavedTimestamp();
  let lastSavedFormatted = 'No writes yet';
  if (lastSaved) {
    const diffMs = Date.now() - lastSaved;
    if (diffMs < 60000) {
      lastSavedFormatted = 'Just now';
    } else if (diffMs < 3600000) {
      const mins = Math.floor(diffMs / 60000);
      lastSavedFormatted = `${mins} min${mins === 1 ? '' : 's'} ago`;
    } else {
      const d = new Date(lastSaved);
      lastSavedFormatted = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }

  return {
    booksCount: allBooks.length,
    highlightsCount: allHighlights.length,
    vocabularyCount: allWords.length,
    storageBytes,
    storageFormatted,
    lastSaved,
    lastSavedFormatted,
  };
}
