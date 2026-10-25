import localforage from 'localforage';

export const isBrowser = typeof window !== 'undefined';

export const metaStore = isBrowser
  ? localforage.createInstance({
      name: 'KindleAIReaderDB',
      storeName: 'books_meta',
      description: 'Lightweight book metadata and reading progress',
    })
  : null;

export const blobStore = isBrowser
  ? localforage.createInstance({
      name: 'KindleAIReaderDB',
      storeName: 'books_blobs',
      description: 'Binary EPUB files for offline reading',
    })
  : null;

export const vocabStore = isBrowser
  ? localforage.createInstance({
      name: 'KindleAIReaderDB',
      storeName: 'vocabulary',
      description: 'Saved vocabulary lookups and AI definitions',
    })
  : null;

export const statsStore = isBrowser
  ? localforage.createInstance({
      name: 'KindleAIReaderDB',
      storeName: 'reading_stats',
      description: 'Daily reading streaks and session telemetry',
    })
  : null;

export const bookmarksStore = isBrowser
  ? localforage.createInstance({
      name: 'KindleAIReaderDB',
      storeName: 'bookmarks',
      description: 'Saved reading bookmarks and locations',
    })
  : null;

export const highlightsStore = isBrowser
  ? localforage.createInstance({
      name: 'KindleAIReaderDB',
      storeName: 'highlights',
      description: 'Annotated quotes, color highlights and notes',
    })
  : null;

export const progressStore = isBrowser
  ? localforage.createInstance({
      name: 'KindleAIReaderDB',
      storeName: 'reading_progress',
      description: 'Reading locations, CFIs, and percentage completed',
    })
  : null;

export const settingsStore = isBrowser
  ? localforage.createInstance({
      name: 'KindleAIReaderDB',
      storeName: 'reader_settings',
      description: 'Reader appearance and typography preferences',
    })
  : null;

export const booksStore = metaStore;
export const vocabularyStore = vocabStore;

export function initDB() {
  if (!isBrowser) return null;
  return {
    metaStore,
    blobStore,
    vocabStore,
    statsStore,
    bookmarksStore,
    highlightsStore,
    progressStore,
    settingsStore,
  };
}

export function recordWriteTimestamp() {
  if (isBrowser) {
    try {
      localStorage.setItem('flyleaf_last_write_timestamp', String(Date.now()));
    } catch {}
  }
}

export function getLastSavedTimestamp() {
  if (!isBrowser) return null;
  try {
    const val = localStorage.getItem('flyleaf_last_write_timestamp');
    if (val) return Number(val);
  } catch {}
  return null;
}

export async function ensureStoresReady() {
  if (!isBrowser) return;
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
  await Promise.all(
    stores.map((s) => (s?.ready ? s.ready().catch(() => {}) : Promise.resolve()))
  );
}
