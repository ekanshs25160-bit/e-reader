import localforage from 'localforage';

const isBrowser = typeof window !== 'undefined';

// ==========================================
// 1. INITIALIZE ISOLATED INDEXEDDB STORES
// ==========================================
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

// Aliases
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

/**
 * Generate a URL-safe ID from title or fallback
 */
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

// ==========================================
// 2. BOOK & EPUB BINARY OPERATIONS
// ==========================================

/**
 * Save a book's metadata and its binary .epub Blob to IndexedDB
 */
export async function saveBook(bookIdOrMeta, metadataOrBlob, maybeBlob) {
  if (!isBrowser || !metaStore) return null;

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

  // 1. Store raw binary EPUB in blob store ONLY
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

  // Strip binary from metadata
  delete bookRecord.file;

  await metaStore.setItem(id, bookRecord);
  return bookRecord;
}

/**
 * Retrieve all saved books (metadata only — fast for /library and /)
 * Returns empty array if no books are saved yet.
 */
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

/**
 * Retrieve metadata for a single book
 */
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

/**
 * Retrieve the binary .epub Blob/ArrayBuffer for epub.js
 */
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

/**
 * Delete a book's metadata and binary blob from IndexedDB
 */
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
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error deleting book:', err);
    return false;
  }
}

// ==========================================
// 3. READING LOCATION & CFI BOOKMARK OPERATIONS
// ==========================================

export async function saveReadingLocation(
  bookId,
  cfiString,
  percentage,
  chapterTitle = null,
  currentPage = null,
  totalPages = null
) {
  if (!isBrowser || !metaStore) return null;
  try {
    const id = String(bookId);
    const existing = (await metaStore.getItem(id)) || {};

    const rawPct =
      typeof percentage === 'number'
        ? percentage <= 1 && percentage > 0
          ? Math.round(percentage * 100)
          : Math.round(percentage)
        : Number(percentage) || 0;
    const progressPercentage = Math.min(100, Math.max(0, rawPct));

    const updated = {
      ...existing,
      id,
      lastReadCfi: cfiString || existing.lastReadCfi || null,
      progressPercentage,
      progress: progressPercentage,
      currentChapter:
        chapterTitle || existing.currentChapter || existing.chapterHeading || 'Reading',
      currentPage: currentPage || existing.currentPage || 1,
      totalPages: totalPages || existing.totalPages || 1,
      lastReadTimestamp: Date.now(),
      status:
        progressPercentage >= 100
          ? 'finished'
          : progressPercentage > 0
          ? 'reading'
          : existing.status || 'to-read',
    };

    await metaStore.setItem(id, updated);

    if (progressStore) {
      const curProg = (await progressStore.getItem(id)) || {};
      await progressStore.setItem(id, {
        ...curProg,
        cfi: cfiString,
        percentage: progressPercentage,
        chapter: chapterTitle || existing.currentChapter,
        currentPage,
        totalPages,
        lastRead: Date.now(),
      });
    }

    return updated;
  } catch (err) {
    console.error('[KindleAIReader DB] Error saving reading location:', err);
    return null;
  }
}

export async function saveProgress(bookId, progressData) {
  if (!isBrowser) return null;
  const cfi = progressData?.cfi || null;
  const percentage =
    progressData?.percentage !== undefined ? progressData.percentage : 0;
  const chapter = progressData?.chapter || null;
  const currentPage = progressData?.page || null;
  const totalPages = progressData?.totalPages || null;
  return saveReadingLocation(bookId, cfi, percentage, chapter, currentPage, totalPages);
}

export async function getReadingLocation(bookId) {
  if (!isBrowser) return { cfi: null, percentage: 0, chapter: '', page: 1, totalPages: 1 };
  try {
    const id = String(bookId);
    const record = (await metaStore?.getItem(id)) || {};
    return {
      cfi: record.lastReadCfi || null,
      percentage: record.progressPercentage || record.progress || 0,
      chapter: record.currentChapter || record.chapterHeading || '',
      page: record.currentPage || 1,
      totalPages: record.totalPages || 1,
      lastRead: record.lastReadTimestamp || null,
    };
  } catch (err) {
    console.warn('[KindleAIReader DB] Error reading location:', err);
    return { cfi: null, percentage: 0, chapter: '', page: 1, totalPages: 1 };
  }
}

export const getProgress = getReadingLocation;

export async function getAllProgress() {
  if (!isBrowser || !progressStore) return [];
  try {
    const list = [];
    await progressStore.iterate((value, key) => {
      list.push({ bookId: key, ...value });
    });
    return list;
  } catch (err) {
    console.warn('[KindleAIReader DB] Error reading all progress:', err);
    return [];
  }
}

// ==========================================
// 4. BOOKMARKS & HIGHLIGHTS API
// ==========================================

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
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error removing bookmark:', err);
    return false;
  }
}

export async function getHighlights(bookId) {
  if (!isBrowser || !highlightsStore) return [];
  try {
    return (await highlightsStore.getItem(String(bookId))) || [];
  } catch {
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
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error removing highlight:', err);
    return false;
  }
}

// ==========================================
// 5. VOCABULARY DECK & WORD BANK API
// ==========================================

export async function saveVocabularyWord({
  word,
  phonetic = '',
  partOfSpeech = 'word',
  definition = '',
  aiExplanation = '',
  contextSentence = '',
  bookId = null,
  bookTitle = 'Saved Book',
  ...rest
}) {
  if (!isBrowser || !vocabStore || !word) return null;
  try {
    const id = String(word).toLowerCase().trim();
    const existing = (await vocabStore.getItem(id)) || {};

    const defString = Array.isArray(definition)
      ? definition[0]
      : typeof definition === 'string'
      ? definition
      : '';

    const entry = {
      ...existing,
      id,
      word: String(word).trim(),
      phonetic: phonetic || existing.phonetic || '',
      partOfSpeech: partOfSpeech || existing.partOfSpeech || 'word',
      definition: defString || existing.definition || '',
      definitions: Array.isArray(definition)
        ? definition
        : [defString || existing.definition || ''],
      aiExplanation: aiExplanation || existing.aiExplanation || '',
      contextSentence: contextSentence || existing.contextSentence || '',
      quote: contextSentence || existing.quote || '',
      bookId: bookId || existing.bookId || null,
      bookTitle: bookTitle || existing.bookTitle || 'Saved Book',
      mastered: existing.mastered || false,
      reviewCount: existing.reviewCount || 0,
      rememberedCount: existing.rememberedCount || 0,
      nextReviewDate: existing.nextReviewDate || Date.now() + 86400000,
      savedAt: existing.savedAt || Date.now(),
      createdAt: existing.createdAt || Date.now(),
      ...rest,
    };
    await vocabStore.setItem(id, entry);
    return entry;
  } catch (err) {
    console.error('[KindleAIReader DB] Error saving vocabulary word:', err);
    return null;
  }
}

export async function getAllVocabulary() {
  if (!isBrowser || !vocabStore) return [];
  try {
    const words = [];
    await vocabStore.iterate((val) => {
      words.push(val);
    });
    return words.sort(
      (a, b) => (b.savedAt || b.createdAt || 0) - (a.savedAt || a.createdAt || 0)
    );
  } catch (err) {
    console.warn('[KindleAIReader DB] Error fetching vocabulary:', err);
    return [];
  }
}

export const getAllVocabularyWords = getAllVocabulary;

export async function deleteVocabularyWord(wordId) {
  if (!isBrowser || !vocabStore) return false;
  try {
    await vocabStore.removeItem(String(wordId).toLowerCase().trim());
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error deleting vocabulary word:', err);
    return false;
  }
}

export async function updateVocabularyCardReview(wordId, wasRemembered) {
  if (!isBrowser || !vocabStore) return null;
  try {
    const id = String(wordId).toLowerCase().trim();
    const card = await vocabStore.getItem(id);
    if (!card) return null;

    const reviewCount = (card.reviewCount || 0) + 1;
    const rememberedCount = (card.rememberedCount || 0) + (wasRemembered ? 1 : 0);
    const intervalDays = wasRemembered ? Math.min(30, Math.pow(2, rememberedCount)) : 1;
    const nextReviewDate = Date.now() + intervalDays * 86400000;

    const updated = {
      ...card,
      reviewCount,
      rememberedCount,
      lastReviewed: Date.now(),
      nextReviewDate,
      mastered: rememberedCount >= 3,
    };
    await vocabStore.setItem(id, updated);
    return updated;
  } catch (err) {
    console.error('[KindleAIReader DB] Error updating card review:', err);
    return null;
  }
}

// ==========================================
// 6. TELEMETRY & READING STATS API
// ==========================================

export async function logReadingSession(minutesOrOptions = 1, pagesRead = 1) {
  if (!isBrowser || !statsStore) return null;
  try {
    let minutes = 1;
    let pages = 1;
    let bookId = null;

    if (typeof minutesOrOptions === 'object' && minutesOrOptions !== null) {
      const durationSec = minutesOrOptions.durationSeconds || 0;
      minutes = Math.max(1, Math.round(durationSec / 60));
      pages = minutesOrOptions.pagesFlipped || 0;
      bookId = minutesOrOptions.bookId || null;
    } else {
      minutes = Number(minutesOrOptions) || 1;
      pages = Number(pagesRead) || 1;
    }

    const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = (await statsStore.getItem(todayKey)) || {
      date: todayKey,
      minutesRead: 0,
      pagesFlipped: 0,
      booksOpened: [],
    };

    const booksOpened = Array.isArray(existing.booksOpened)
      ? [...existing.booksOpened]
      : [];
    if (bookId && !booksOpened.includes(bookId)) {
      booksOpened.push(bookId);
    }

    const updated = {
      date: todayKey,
      minutesRead: (existing.minutesRead || existing.minutes || 0) + minutes,
      pagesFlipped: (existing.pagesFlipped || existing.pages || 0) + pages,
      booksOpened,
      minutes: (existing.minutesRead || existing.minutes || 0) + minutes,
      pages: (existing.pagesFlipped || existing.pages || 0) + pages,
      lastActive: Date.now(),
    };

    await statsStore.setItem(todayKey, updated);
    return updated;
  } catch (err) {
    console.error('[KindleAIReader DB] Error logging reading session:', err);
    return null;
  }
}

export async function getAggregatedStats() {
  const emptyStats = {
    totalHours: 0,
    totalMinutes: 0,
    totalMinutesRead: 0,
    totalPagesRead: 0,
    currentStreak: 0,
    finishedVolumes: 0,
    totalHighlights: 0,
    lastReadBook: null,
    weeklyDays: [],
    totalSessions: 0,
  };

  if (!isBrowser || !statsStore) return emptyStats;

  try {
    const dailyRecords = [];
    await statsStore.iterate((val) => {
      dailyRecords.push(val);
    });

    let totalMinutesRead = 0;
    let totalPagesRead = 0;
    dailyRecords.forEach((r) => {
      totalMinutesRead += r.minutesRead || r.minutes || 0;
      totalPagesRead += r.pagesFlipped || r.pages || 0;
    });

    let finishedVolumes = 0;
    let lastReadBook = null;
    let latestTimestamp = 0;

    if (metaStore) {
      await metaStore.iterate((b) => {
        if (
          b.status === 'finished' ||
          (b.progressPercentage && b.progressPercentage >= 100)
        ) {
          finishedVolumes++;
        }
        if (b.lastReadTimestamp && b.lastReadTimestamp > latestTimestamp) {
          latestTimestamp = b.lastReadTimestamp;
          lastReadBook = {
            id: b.id,
            title: b.title,
            author: b.author,
            progressPercentage: b.progressPercentage || 0,
            coverUrl: b.coverUrl,
          };
        }
      });
    }

    let totalHighlights = 0;
    if (highlightsStore) {
      await highlightsStore.iterate((list) => {
        if (Array.isArray(list)) totalHighlights += list.length;
      });
    }

    // Calculate current daily streak ending today or yesterday
    const now = new Date();
    let currentStreak = 0;
    let checkDate = new Date(now);

    const todayStr = checkDate.toISOString().split('T')[0];
    const readToday = dailyRecords.some(
      (r) => r.date === todayStr && (r.minutesRead > 0 || r.minutes > 0)
    );

    if (!readToday) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dStr = checkDate.toISOString().split('T')[0];
      const hasRecord = dailyRecords.some(
        (r) => r.date === dStr && ((r.minutesRead || r.minutes || 0) > 0)
      );
      if (hasRecord) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Weekly 7-day breakdown (Monday - Sunday of current week)
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const weeklyDays = dayLabels.map((lbl, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().split('T')[0];

      const record = dailyRecords.find((r) => r.date === dateStr);
      const minutes = record ? record.minutesRead || record.minutes || 0 : 0;
      const isToday = idx === currentDayOfWeek;

      return {
        label: lbl,
        dayNum: idx,
        dateStr,
        minutes,
        active: minutes > 0,
        isToday,
      };
    });

    const totalHours = Math.floor(totalMinutesRead / 60);
    const totalMinutes = totalMinutesRead % 60;

    return {
      totalHours,
      totalMinutes,
      totalMinutesRead,
      totalPagesRead,
      currentStreak,
      finishedVolumes,
      totalHighlights,
      lastReadBook,
      weeklyDays,
      totalSessions: dailyRecords.length,
    };
  } catch (err) {
    console.warn('[KindleAIReader DB] Error aggregating stats:', err);
    return emptyStats;
  }
}

export const getReadingStats = getAggregatedStats;

// ==========================================
// 7. READER SETTINGS & EXPORT ARCHIVE
// ==========================================

export async function getReaderSettings() {
  if (!isBrowser || !settingsStore) return null;
  try {
    return await settingsStore.getItem('reader_settings');
  } catch {
    return null;
  }
}

export async function saveReaderSettings(settings) {
  if (!isBrowser || !settingsStore) return null;
  try {
    await settingsStore.setItem('reader_settings', settings);
    return settings;
  } catch (err) {
    console.error('[KindleAIReader DB] Error saving reader settings:', err);
    return null;
  }
}

export async function exportVaultArchive() {
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

    const words = [];
    if (vocabStore) {
      await vocabStore.iterate((val) => {
        words.push(val);
      });
    }

    return {
      version: '2.0.0',
      app: 'KindleAIReader Local-First Vault',
      exportedAt: new Date().toISOString(),
      books,
      progress,
      words,
    };
  } catch (err) {
    console.error('[KindleAIReader DB] Error exporting archive:', err);
    return null;
  }
}
