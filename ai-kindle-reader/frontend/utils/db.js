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
  recordWriteTimestamp();
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
    recordWriteTimestamp();
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

    recordWriteTimestamp();
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
  cfi = null,
  chapter = '',
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
      cfi: cfi || rest.cfiRange || existing.cfi || null,
      chapter: chapter || existing.chapter || '',
      mastered: existing.mastered || false,
      reviewCount: existing.reviewCount || 0,
      rememberedCount: existing.rememberedCount || 0,
      nextReviewDate: rest.nextReviewDate ?? existing.nextReviewDate ?? Date.now(),
      savedAt: existing.savedAt || Date.now(),
      createdAt: existing.createdAt || Date.now(),
      ...rest,
    };
    await vocabStore.setItem(id, entry);
    recordWriteTimestamp();
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
    recordWriteTimestamp();
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
    recordWriteTimestamp();
    return updated;
  } catch (err) {
    console.error('[KindleAIReader DB] Error updating card review:', err);
    return null;
  }
}

// ==========================================
// 6. TELEMETRY & READING STATS API
// ==========================================

/**
 * Return YYYY-MM-DD string in the user's local timezone.
 * Avoids UTC day-shift bugs caused by Date.toISOString().
 */
export function localDateKey(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function logReadingSession(paramsOrSeconds = 0, maybePages = 0) {
  if (!isBrowser || !statsStore) return null;
  try {
    let bookId = null;
    let seconds = 0;
    let pages = 0;

    if (typeof paramsOrSeconds === 'object' && paramsOrSeconds !== null) {
      bookId = paramsOrSeconds.bookId ? String(paramsOrSeconds.bookId) : null;
      seconds =
        Number(
          paramsOrSeconds.seconds ?? paramsOrSeconds.durationSeconds ?? 0
        ) || 0;
      pages =
        Number(
          paramsOrSeconds.pages ??
            paramsOrSeconds.pagesFlipped ??
            paramsOrSeconds.pagesRead ??
            0
        ) || 0;
    } else {
      seconds = Number(paramsOrSeconds) || 0;
      pages = Number(maybePages) || 0;
    }

    if (seconds <= 0 && pages <= 0) return null;

    const todayKey = localDateKey(new Date());
    const existing = (await statsStore.getItem(todayKey)) || {};

    const existingSeconds =
      Number(
        existing.seconds !== undefined
          ? existing.seconds
          : (existing.minutesRead || existing.minutes || 0) * 60
      ) || 0;
    const existingPages =
      Number(
        existing.pages !== undefined
          ? existing.pages
          : existing.pagesFlipped || 0
      ) || 0;
    const existingSessions = Number(existing.sessions || 0);

    const perBook = { ...(existing.perBook || {}) };
    if (bookId) {
      const prev = perBook[bookId] || { seconds: 0, pages: 0 };
      perBook[bookId] = {
        seconds: (prev.seconds || 0) + seconds,
        pages: (prev.pages || 0) + pages,
      };
    }

    const booksOpened = Array.isArray(existing.booksOpened)
      ? [...existing.booksOpened]
      : [];
    if (bookId && !booksOpened.includes(bookId)) {
      booksOpened.push(bookId);
    }

    const totalSeconds = existingSeconds + seconds;
    const totalPages = existingPages + pages;

    const updated = {
      date: todayKey,
      seconds: totalSeconds,
      pages: totalPages,
      sessions: existingSessions + 1,
      perBook,
      // Backward compatibility fields
      minutesRead: Math.floor(totalSeconds / 60),
      minutes: Math.floor(totalSeconds / 60),
      pagesFlipped: totalPages,
      booksOpened,
      lastActive: Date.now(),
    };

    await statsStore.setItem(todayKey, updated);
    recordWriteTimestamp();
    return updated;
  } catch (err) {
    console.error('[KindleAIReader DB] Error logging reading session:', err);
    return null;
  }
}

export async function getStatsSummary() {
  const emptySummary = {
    totalSeconds: 0,
    currentStreak: 0,
    longestStreak: 0,
    finishedCount: 0,
    totalHighlights: 0,
    totalPagesTurned: 0,
    weeklyDays: [],
    heatmap: [],
    perBook: [],
    last30Days: [],
    typicalDaySeconds: 0,
    bestDay: null,
    lastReadBook: null,
  };

  if (!isBrowser || !statsStore) return emptySummary;

  try {
    const dailyRecords = [];
    await statsStore.iterate((val, key) => {
      const date = val?.date || key;
      const seconds =
        Number(
          val?.seconds !== undefined
            ? val.seconds
            : (val?.minutesRead || val?.minutes || 0) * 60
        ) || 0;
      const pages =
        Number(
          val?.pages !== undefined ? val.pages : val?.pagesFlipped || 0
        ) || 0;

      dailyRecords.push({
        ...val,
        date,
        seconds,
        pages,
      });
    });

    dailyRecords.sort((a, b) => a.date.localeCompare(b.date));

    let totalSeconds = 0;
    let totalPagesTurned = 0;
    for (const r of dailyRecords) {
      totalSeconds += r.seconds;
      totalPagesTurned += r.pages;
    }

    let finishedCount = 0;
    let lastReadBook = null;
    let latestTimestamp = 0;
    if (metaStore) {
      await metaStore.iterate((b) => {
        if (
          b.status === 'finished' ||
          (b.progressPercentage && b.progressPercentage >= 100)
        ) {
          finishedCount++;
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

    // Streaks calculation (active day = seconds > 0 || pages > 0)
    const activeDatesSet = new Set(
      dailyRecords
        .filter((r) => r.seconds > 0 || r.pages > 0)
        .map((r) => r.date)
    );

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayKey = localDateKey(todayLocal);

    let checkDate = new Date(todayLocal);
    if (!activeDatesSet.has(todayKey)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    let currentStreak = 0;
    while (true) {
      const dStr = localDateKey(checkDate);
      if (activeDatesSet.has(dStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Longest streak
    const activeDatesSorted = Array.from(activeDatesSet).sort();
    let longestStreak = 0;
    let run = 0;
    let prevActiveD = null;

    for (const dateStr of activeDatesSorted) {
      const parts = dateStr.split('-').map(Number);
      const currD = new Date(parts[0], parts[1] - 1, parts[2]);

      if (!prevActiveD) {
        run = 1;
      } else {
        const diffDays = Math.round((currD.getTime() - prevActiveD.getTime()) / 86400000);
        if (diffDays === 1) {
          run++;
        } else if (diffDays > 1) {
          run = 1;
        }
      }
      if (run > longestStreak) {
        longestStreak = run;
      }
      prevActiveD = currD;
    }

    // Weekly 7-day breakdown (Monday - Sunday of current week)
    const currentDayOfWeek = (todayLocal.getDay() + 6) % 7; // 0 = Mon, ..., 6 = Sun
    const monday = new Date(todayLocal);
    monday.setDate(todayLocal.getDate() - currentDayOfWeek);

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const weeklyDays = dayLabels.map((lbl, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = localDateKey(d);

      const record = dailyRecords.find((r) => r.date === dateStr);
      const seconds = record ? record.seconds : 0;
      const pages = record ? record.pages : 0;
      const minutes = Math.floor(seconds / 60);
      const isToday = idx === currentDayOfWeek;

      let topBookId = null;
      let maxSec = -1;
      if (record?.perBook && typeof record.perBook === 'object') {
        for (const [bId, data] of Object.entries(record.perBook)) {
          const s = Number(data?.seconds || 0);
          if (s > maxSec) {
            maxSec = s;
            topBookId = bId;
          }
        }
      }

      return {
        label: lbl,
        dayNum: idx,
        dateStr,
        seconds,
        minutes,
        pages,
        active: seconds > 0 || pages > 0,
        isToday,
        topBookId,
      };
    });

    // 26-week Heatmap (182 days ending on Sunday of current week)
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const heatmap = [];
    for (let i = 181; i >= 0; i--) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() - i);
      const dateStr = localDateKey(d);

      const record = dailyRecords.find((r) => r.date === dateStr);
      const seconds = record ? record.seconds : 0;
      const pages = record ? record.pages : 0;

      let level = 0;
      if (seconds >= 3600) level = 4;
      else if (seconds >= 1800) level = 3;
      else if (seconds >= 600) level = 2;
      else if (seconds > 0 || pages > 0) level = 1;

      heatmap.push({
        date: dateStr,
        seconds,
        pages,
        active: seconds > 0 || pages > 0,
        level,
      });
    }

    // Last 30 days
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(todayLocal);
      d.setDate(todayLocal.getDate() - i);
      const dateStr = localDateKey(d);

      const record = dailyRecords.find((r) => r.date === dateStr);
      const seconds = record ? record.seconds : 0;
      const pages = record ? record.pages : 0;

      last30Days.push({
        date: dateStr,
        seconds,
        pages,
        active: seconds > 0 || pages > 0,
      });
    }

    // Per-book breakdown
    const perBookMap = {};
    for (const r of dailyRecords) {
      if (r.perBook && typeof r.perBook === 'object') {
        for (const [bId, data] of Object.entries(r.perBook)) {
          if (!perBookMap[bId]) {
            perBookMap[bId] = {
              bookId: bId,
              title: bId,
              seconds: 0,
              pages: 0,
            };
          }
          perBookMap[bId].seconds += Number(data?.seconds || 0);
          perBookMap[bId].pages += Number(data?.pages || 0);
        }
      }
    }

    if (metaStore) {
      for (const bId of Object.keys(perBookMap)) {
        try {
          const meta = await metaStore.getItem(bId);
          if (meta?.title) {
            perBookMap[bId].title = meta.title;
            perBookMap[bId].author = meta.author || '';
            perBookMap[bId].coverUrl = meta.coverUrl || null;
          }
        } catch {}
      }
    }

    const perBook = Object.values(perBookMap).sort((a, b) => b.seconds - a.seconds);

    // Typical Day Seconds (median of active reading days)
    const activeSecondsList = dailyRecords
      .map((r) => r.seconds)
      .filter((s) => s > 0)
      .sort((a, b) => a - b);

    let typicalDaySeconds = 0;
    if (activeSecondsList.length > 0) {
      const mid = Math.floor(activeSecondsList.length / 2);
      typicalDaySeconds =
        activeSecondsList.length % 2 !== 0
          ? activeSecondsList[mid]
          : Math.round((activeSecondsList[mid - 1] + activeSecondsList[mid]) / 2);
    }

    // Best Day
    let bestDay = null;
    for (const r of dailyRecords) {
      if (r.seconds > 0 && (!bestDay || r.seconds > bestDay.seconds)) {
        bestDay = {
          date: r.date,
          seconds: r.seconds,
          pages: r.pages,
        };
      }
    }

    return {
      totalSeconds,
      currentStreak,
      longestStreak,
      finishedCount,
      totalHighlights,
      totalPagesTurned,
      weeklyDays,
      heatmap,
      perBook,
      last30Days,
      typicalDaySeconds,
      bestDay,
      lastReadBook,
    };
  } catch (err) {
    console.warn('[KindleAIReader DB] Error building stats summary:', err);
    return emptySummary;
  }
}

export async function getAggregatedStats() {
  const summary = await getStatsSummary();
  const totalMinutesRead = Math.floor(summary.totalSeconds / 60);

  return {
    ...summary,
    totalHours: Math.floor(summary.totalSeconds / 3600),
    totalMinutes: totalMinutesRead % 60,
    totalMinutesRead,
    totalPagesRead: summary.totalPagesTurned,
    finishedVolumes: summary.finishedCount,
    totalSessions: summary.heatmap.filter((d) => d.active).length,
  };
}

export const getReadingStats = getAggregatedStats;

export async function seedSampleReadingData() {
  if (!isBrowser || !statsStore) return 0;
  const sampleBooks = [
    { id: '2701', title: 'Moby Dick' },
    { id: '345', title: 'Dracula' },
    { id: '2680', title: 'Meditations' },
    { id: '84', title: 'Frankenstein' },
  ];

  let seededCount = 0;
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 89; i >= 0; i--) {
    const d = new Date(todayLocal);
    d.setDate(todayLocal.getDate() - i);
    const dateKey = localDateKey(d);

    // ~75% chance of reading on any given day
    const isDayActive = i % 7 !== 3 && (i * 11) % 10 < 8;
    if (isDayActive) {
      const seconds = Math.floor(720 + Math.random() * 2500); // 12 - 53 mins
      const pages = Math.floor(8 + Math.random() * 35);
      const chosenBook = sampleBooks[i % sampleBooks.length];

      const record = {
        date: dateKey,
        seconds,
        pages,
        sessions: Math.floor(1 + Math.random() * 3),
        perBook: {
          [chosenBook.id]: {
            seconds,
            pages,
          },
        },
        minutes: Math.floor(seconds / 60),
        minutesRead: Math.floor(seconds / 60),
        pagesFlipped: pages,
        booksOpened: [chosenBook.id],
        lastActive: d.getTime() + 19 * 3600000,
      };

      await statsStore.setItem(dateKey, record);
      seededCount++;
    }
  }

  return seededCount;
}

export async function clearSeededReadingData() {
  if (!isBrowser || !statsStore) return false;
  try {
    await statsStore.clear();
    return true;
  } catch (err) {
    console.error('[KindleAIReader DB] Error clearing reading stats:', err);
    return false;
  }
}

if (isBrowser) {
  window.getStatsSummary = getStatsSummary;
  window.getReadingStats = getReadingStats;
  window.logReadingSession = logReadingSession;
  window.seedSampleReadingData = seedSampleReadingData;
  window.clearSeededReadingData = clearSeededReadingData;
}

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
    recordWriteTimestamp();
    return settings;
  } catch (err) {
    console.error('[KindleAIReader DB] Error saving reader settings:', err);
    return null;
  }
}

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      const base64 = typeof dataUrl === 'string' && dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function base64ToBlob(base64, mimeType = 'application/epub+zip') {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

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

  const results = {
    booksRestored: 0,
    highlightsRestored: 0,
    bookmarksRestored: 0,
    vocabularyRestored: 0,
    sessionsRestored: 0,
  };

  // 1. Restore Books Metadata
  const books = Array.isArray(archiveData.books) ? archiveData.books : [];
  if (metaStore && books.length > 0) {
    for (const b of books) {
      if (!b?.id) continue;
      const existing = (await metaStore.getItem(String(b.id))) || {};
      await metaStore.setItem(String(b.id), { ...existing, ...b });
      results.booksRestored++;
    }
  }

  // 2. Restore Binaries if present
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

  // 3. Restore Progress
  const progressList = Array.isArray(archiveData.progress) ? archiveData.progress : [];
  if (progressStore && progressList.length > 0) {
    for (const p of progressList) {
      if (!p?.bookId) continue;
      const { bookId, ...progData } = p;
      const existing = (await progressStore.getItem(String(bookId))) || {};
      await progressStore.setItem(String(bookId), { ...existing, ...progData });
    }
  }

  // 4. Restore Highlights
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

  // 5. Restore Bookmarks
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

  // 6. Restore Vocabulary
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

  // 7. Restore Sessions / Reading Stats
  const sessionsList = Array.isArray(archiveData.sessions) ? archiveData.sessions : [];
  if (statsStore && sessionsList.length > 0) {
    for (const s of sessionsList) {
      if (!s?.date) continue;
      const existing = (await statsStore.getItem(s.date)) || {};
      await statsStore.setItem(s.date, { ...existing, ...s });
      results.sessionsRestored++;
    }
  }

  // 8. Restore Settings
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

  // Fallback to summing blob sizes if navigator.storage returned 0
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
