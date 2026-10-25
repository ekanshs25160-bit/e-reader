import {
  isBrowser,
  metaStore,
  blobStore,
  vocabStore,
  statsStore,
  bookmarksStore,
  highlightsStore,
  progressStore,
  settingsStore,
  booksStore,
  vocabularyStore,
  initDB,
  recordWriteTimestamp,
  getLastSavedTimestamp,
  ensureStoresReady,
} from './db';
import { runStorageMigrations, CURRENT_SCHEMA_VERSION } from './migrations';
import {
  saveBook,
  getAllBooks,
  getBookMeta,
  getBook,
  getBookBlob,
  getBookFile,
  deleteBook,
  slugify,
} from './books';
import {
  saveReadingLocation,
  saveProgress,
  getReadingLocation,
  getProgress,
  getAllProgress,
} from './progress';
import { getBookmarks, addBookmark, removeBookmark } from './bookmarks';
import {
  getHighlights,
  getAllHighlights,
  addHighlight,
  removeHighlight,
} from './highlights';
import {
  saveVocabularyWord,
  getAllVocabulary,
  getAllVocabularyWords,
  deleteVocabularyWord,
  updateVocabularyCardReview,
} from './vocabulary';
import {
  localDateKey,
  logReadingSession,
  seedSampleReadingData,
  clearSeededReadingData,
} from './sessions';
import {
  getReaderSettings,
  saveReaderSettings,
  getSettings,
  saveSettings,
} from './settings';
import {
  exportVaultArchive,
  restoreVaultArchive,
  eraseEntireVault,
  getVaultStorageSummary,
} from './archive';
import {
  getStatsSummary,
  getAggregatedStats,
  getReadingStats,
} from '../stats/summary';

export {
  isBrowser,
  metaStore,
  blobStore,
  vocabStore,
  statsStore,
  bookmarksStore,
  highlightsStore,
  progressStore,
  settingsStore,
  booksStore,
  vocabularyStore,
  initDB,
  recordWriteTimestamp,
  getLastSavedTimestamp,
  ensureStoresReady,
  runStorageMigrations,
  CURRENT_SCHEMA_VERSION,
  saveBook,
  getAllBooks,
  getBookMeta,
  getBook,
  getBookBlob,
  getBookFile,
  deleteBook,
  slugify,
  saveReadingLocation,
  saveProgress,
  getReadingLocation,
  getProgress,
  getAllProgress,
  getBookmarks,
  addBookmark,
  removeBookmark,
  getHighlights,
  getAllHighlights,
  addHighlight,
  removeHighlight,
  saveVocabularyWord,
  getAllVocabulary,
  getAllVocabularyWords,
  deleteVocabularyWord,
  updateVocabularyCardReview,
  localDateKey,
  logReadingSession,
  seedSampleReadingData,
  clearSeededReadingData,
  getReaderSettings,
  saveReaderSettings,
  getSettings,
  saveSettings,
  exportVaultArchive,
  restoreVaultArchive,
  eraseEntireVault,
  getVaultStorageSummary,
  getStatsSummary,
  getAggregatedStats,
  getReadingStats,
};

if (isBrowser) {
  window.getStatsSummary = getStatsSummary;
  window.getReadingStats = getReadingStats;
  window.logReadingSession = logReadingSession;
  window.seedSampleReadingData = seedSampleReadingData;
  window.clearSeededReadingData = clearSeededReadingData;

  window.__db = {
    saveBook,
    getBookBlob,
    getBookMeta,
    saveReaderSettings,
    getReaderSettings,
    saveSettings,
    getSettings,
    getReadingLocation,
    saveReadingLocation,
    saveVocabularyWord,
    logReadingSession,
    getAllBooks,
    getBookmarks,
    getHighlights,
    getAllVocabulary,
  };

  runStorageMigrations().catch((err) =>
    console.warn('[Storage] Migration check warning:', err)
  );
}
