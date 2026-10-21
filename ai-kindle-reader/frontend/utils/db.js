import { BOOKS } from './booksData';

// SSR safety check
const isClient = typeof window !== 'undefined';

// Lazy loader and cache for localforage module
let lfPromise = null;
async function getLF() {
  if (!isClient) return null;
  if (!lfPromise) {
    lfPromise = import('localforage').then((mod) => mod.default || mod);
  }
  return lfPromise;
}

// Instance cache for dedicated Flyleaf Local-First Vault stores
const stores = {};
export async function getStoreInstance(storeName, description = '') {
  if (!isClient) return null;
  if (stores[storeName]) return stores[storeName];
  try {
    const localforage = await getLF();
    if (!localforage) return null;
    stores[storeName] = localforage.createInstance({
      name: 'flyleaf_reader',
      storeName,
      description,
    });
    return stores[storeName];
  } catch (err) {
    console.warn(`[Flyleaf DB] Failed to create store "${storeName}":`, err);
    return null;
  }
}

// Named store getters
export const getBooksStore = () => getStoreInstance('books', 'Local EPUB binaries and book metadata');
export const getProgressStore = () => getStoreInstance('progress', 'Reading locations, CFIs, and percentage completed');
export const getBookmarksStore = () => getStoreInstance('bookmarks', 'Saved reading bookmarks and locations');
export const getHighlightsStore = () => getStoreInstance('highlights', 'Annotated quotes, color highlights and notes');
export const getVocabularyStore = () => getStoreInstance('vocabulary', 'Offline vocabulary recall deck and word bank');
export const getSettingsStore = () => getStoreInstance('settings', 'Reader appearance and font preferences');

// Legacy exports kept as stubs for backward-compatibility
export const booksStore = null;
export const progressStore = null;
export const bookmarksStore = null;
export const highlightsStore = null;
export const vocabularyStore = null;
export const settingsStore = null;

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

/**
 * Seed initial catalog books into localforage if the vault is empty
 */
export async function seedInitialVault() {
  if (!isClient) return;
  try {
    const books = await getBooksStore();
    const progress = await getProgressStore();
    if (!books || !progress) return;

    const keys = await books.keys();
    if (keys.length === 0) {
      for (const book of BOOKS) {
        await books.setItem(book.id, {
          ...book,
          addedAt: Date.now(),
          isSeeded: true,
        });
        if (book.progress) {
          await progress.setItem(book.id, {
            cfi: null,
            percentage: book.progress,
            page: book.currentPage || 1,
            chapter: book.chapterHeading || 'Chapter I',
            lastRead: Date.now() - Math.floor(Math.random() * 86400000 * 3),
            totalTimeSeconds: Math.floor((book.progress / 100) * 3600 * 5),
          });
        }
      }
    }
  } catch (err) {
    console.warn('[Flyleaf DB] Error seeding initial vault:', err);
  }
}

/**
 * Save or update a book in IndexedDB (including EPUB file binary)
 */
export async function saveBook(bookMeta, fileBufferOrBlob = null) {
  if (!isClient) return null;
  const books = await getBooksStore();
  const progress = await getProgressStore();
  if (!books) return null;

  const id = bookMeta.id || slugify(bookMeta.title);
  const existing = (await books.getItem(id)) || {};

  const record = {
    ...existing,
    ...bookMeta,
    id,
    addedAt: existing.addedAt || Date.now(),
    lastModified: Date.now(),
  };

  if (fileBufferOrBlob) {
    record.file = fileBufferOrBlob;
    record.hasBinary = true;
    const byteLength = fileBufferOrBlob.byteLength || fileBufferOrBlob.size || 0;
    record.size =
      byteLength / 1024 > 1024
        ? (byteLength / (1024 * 1024)).toFixed(1) + ' MB'
        : Math.round(byteLength / 1024) + ' KB';
  }

  await books.setItem(id, record);

  // Initialize progress if none exists
  if (progress) {
    const existingProgress = await progress.getItem(id);
    if (!existingProgress) {
      await progress.setItem(id, {
        cfi: null,
        percentage: bookMeta.progress || 0,
        page: bookMeta.currentPage || 1,
        chapter: bookMeta.chapterHeading || 'Chapter I',
        lastRead: Date.now(),
        totalTimeSeconds: 0,
      });
    }
  }

  return record;
}

/**
 * Retrieve a book by its ID
 */
export async function getBook(id) {
  if (!isClient) {
    return BOOKS.find((b) => b.id === id) || null;
  }
  try {
    const books = await getBooksStore();
    if (books) {
      const book = await books.getItem(id);
      if (book) return book;
    }
  } catch (err) {
    console.warn('[Flyleaf DB] Error reading book from store:', err);
  }
  return BOOKS.find((b) => b.id === id) || null;
}

/**
 * Retrieve the binary file (ArrayBuffer or Blob) for a book
 */
export async function getBookFile(id) {
  if (!isClient) return null;
  try {
    const books = await getBooksStore();
    if (!books) return null;
    const book = await books.getItem(id);
    return book?.file || null;
  } catch (err) {
    console.warn('[Flyleaf DB] Error reading book file binary:', err);
    return null;
  }
}

/**
 * Retrieve all books from IndexedDB, seeding on first run if empty
 */
export async function getAllBooks() {
  if (!isClient) return BOOKS;
  try {
    await seedInitialVault();
    const books = await getBooksStore();
    if (!books) return BOOKS;

    const list = [];
    await books.iterate((value) => {
      // Exclude heavy binary from standard list to keep UI snappy
      const { file, ...meta } = value;
      list.push(meta);
    });
    return list.length > 0 ? list : BOOKS;
  } catch (err) {
    console.warn('[Flyleaf DB] Error retrieving all books:', err);
    return BOOKS;
  }
}

/**
 * Delete a book and all its associated progress, bookmarks, and highlights
 */
export async function deleteBook(id) {
  if (!isClient) return false;
  try {
    const books = await getBooksStore();
    const progress = await getProgressStore();
    const bookmarks = await getBookmarksStore();
    const highlights = await getHighlightsStore();

    if (books) await books.removeItem(id);
    if (progress) await progress.removeItem(id);
    if (bookmarks) await bookmarks.removeItem(id);
    if (highlights) await highlights.removeItem(id);
    return true;
  } catch (err) {
    console.error('[Flyleaf DB] Error deleting book:', err);
    return false;
  }
}

/**
 * Update reading progress (CFI position, percentage, time spent)
 */
export async function saveProgress(bookId, progressData) {
  if (!isClient) return null;
  try {
    const progress = await getProgressStore();
    const books = await getBooksStore();
    if (!progress) return null;

    const current = (await progress.getItem(bookId)) || {};
    const updated = {
      ...current,
      ...progressData,
      lastRead: Date.now(),
    };
    await progress.setItem(bookId, updated);

    // Sync percentage and status to book record in booksStore
    if (books) {
      const book = await books.getItem(bookId);
      if (book) {
        book.progress = Math.round(updated.percentage || book.progress || 0);
        if (book.progress >= 99) {
          book.status = 'finished';
        } else if (book.progress > 0) {
          book.status = 'reading';
        }
        if (updated.page) book.currentPage = updated.page;
        await books.setItem(bookId, book);
      }
    }

    return updated;
  } catch (err) {
    console.error('[Flyleaf DB] Error saving progress:', err);
    return null;
  }
}

/**
 * Retrieve reading progress for a book
 */
export async function getProgress(bookId) {
  if (!isClient) return null;
  try {
    const progress = await getProgressStore();
    if (!progress) return null;
    return await progress.getItem(bookId);
  } catch (err) {
    console.warn('[Flyleaf DB] Error reading progress:', err);
    return null;
  }
}

/**
 * Retrieve all reading progress entries (for statistics calculations)
 */
export async function getAllProgress() {
  if (!isClient) return [];
  try {
    const progress = await getProgressStore();
    if (!progress) return [];
    const list = [];
    await progress.iterate((value, key) => {
      list.push({ bookId: key, ...value });
    });
    return list;
  } catch (err) {
    console.warn('[Flyleaf DB] Error reading all progress:', err);
    return [];
  }
}

/**
 * Bookmarks API
 */
export async function getBookmarks(bookId) {
  if (!isClient) return [];
  try {
    const bookmarks = await getBookmarksStore();
    if (!bookmarks) return [];
    return (await bookmarks.getItem(bookId)) || [];
  } catch {
    return [];
  }
}

export async function addBookmark(bookId, bookmark) {
  if (!isClient) return null;
  try {
    const bookmarks = await getBookmarksStore();
    if (!bookmarks) return null;
    const list = (await bookmarks.getItem(bookId)) || [];
    const newEntry = {
      id: `bm-${Date.now()}`,
      createdAt: Date.now(),
      ...bookmark,
    };
    const updated = [newEntry, ...list];
    await bookmarks.setItem(bookId, updated);
    return newEntry;
  } catch (err) {
    console.error('[Flyleaf DB] Error adding bookmark:', err);
    return null;
  }
}

export async function removeBookmark(bookId, bookmarkId) {
  if (!isClient) return false;
  try {
    const bookmarks = await getBookmarksStore();
    if (!bookmarks) return false;
    const list = (await bookmarks.getItem(bookId)) || [];
    const updated = list.filter((b) => b.id !== bookmarkId);
    await bookmarks.setItem(bookId, updated);
    return true;
  } catch (err) {
    console.error('[Flyleaf DB] Error removing bookmark:', err);
    return false;
  }
}

/**
 * Highlights & Annotations API
 */
export async function getHighlights(bookId) {
  if (!isClient) return [];
  try {
    const highlights = await getHighlightsStore();
    if (!highlights) return [];
    return (await highlights.getItem(bookId)) || [];
  } catch {
    return [];
  }
}

export async function addHighlight(bookId, highlight) {
  if (!isClient) return null;
  try {
    const highlights = await getHighlightsStore();
    if (!highlights) return null;
    const list = (await highlights.getItem(bookId)) || [];
    const newEntry = {
      id: `hl-${Date.now()}`,
      createdAt: Date.now(),
      ...highlight,
    };
    const updated = [newEntry, ...list];
    await highlights.setItem(bookId, updated);
    return newEntry;
  } catch (err) {
    console.error('[Flyleaf DB] Error adding highlight:', err);
    return null;
  }
}

export async function removeHighlight(bookId, highlightId) {
  if (!isClient) return false;
  try {
    const highlights = await getHighlightsStore();
    if (!highlights) return false;
    const list = (await highlights.getItem(bookId)) || [];
    const updated = list.filter((h) => h.id !== highlightId);
    await highlights.setItem(bookId, updated);
    return true;
  } catch (err) {
    console.error('[Flyleaf DB] Error removing highlight:', err);
    return false;
  }
}

/**
 * Vocabulary Deck & Word Bank API
 */
export async function getAllVocabularyWords() {
  if (!isClient) return [];
  try {
    const vocabulary = await getVocabularyStore();
    if (!vocabulary) return [];
    const words = [];
    await vocabulary.iterate((val) => {
      words.push(val);
    });
    return words.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  } catch (err) {
    console.warn('[Flyleaf DB] Error fetching vocabulary:', err);
    return [];
  }
}

export async function saveVocabularyWord(wordData) {
  if (!isClient) return null;
  try {
    const vocabulary = await getVocabularyStore();
    if (!vocabulary) return null;
    const id = wordData.id || slugify(wordData.word);
    const entry = {
      id,
      createdAt: Date.now(),
      reviewCount: 0,
      rememberedCount: 0,
      nextReviewDate: Date.now() + 86400000,
      ...wordData,
    };
    await vocabulary.setItem(id, entry);
    return entry;
  } catch (err) {
    console.error('[Flyleaf DB] Error saving vocabulary word:', err);
    return null;
  }
}

export async function deleteVocabularyWord(id) {
  if (!isClient) return false;
  try {
    const vocabulary = await getVocabularyStore();
    if (!vocabulary) return false;
    await vocabulary.removeItem(id);
    return true;
  } catch (err) {
    console.error('[Flyleaf DB] Error deleting vocabulary word:', err);
    return false;
  }
}

/**
 * Reader Appearance Settings API
 */
export async function getReaderSettings() {
  if (!isClient) return null;
  try {
    const settings = await getSettingsStore();
    if (!settings) return null;
    return await settings.getItem('reader_settings');
  } catch {
    return null;
  }
}

export async function saveReaderSettings(settings) {
  if (!isClient) return null;
  try {
    const store = await getSettingsStore();
    if (!store) return null;
    await store.setItem('reader_settings', settings);
    return settings;
  } catch (err) {
    console.error('[Flyleaf DB] Error saving reader settings:', err);
    return null;
  }
}

/**
 * Export complete unencrypted JSON archive of the local vault
 */
export async function exportVaultArchive() {
  if (!isClient) return null;
  const booksStore = await getBooksStore();
  const progressStore = await getProgressStore();
  const vocabularyStore = await getVocabularyStore();

  const books = [];
  if (booksStore) {
    await booksStore.iterate((val) => {
      const { file, ...meta } = val;
      books.push(meta);
    });
  }

  const progress = [];
  if (progressStore) {
    await progressStore.iterate((val, key) => {
      progress.push({ bookId: key, ...val });
    });
  }

  const words = [];
  if (vocabularyStore) {
    await vocabularyStore.iterate((val) => {
      words.push(val);
    });
  }

  return {
    version: '1.4.2',
    app: 'Flyleaf Local-First Reader',
    exportedAt: new Date().toISOString(),
    books,
    progress,
    words,
  };
}

/**
 * Reading Sessions Store Getter
 */
export const getSessionsStore = () =>
  getStoreInstance('sessions', 'Live reading telemetry and active sessions');

/**
 * Log an active reading telemetry session
 */
export async function logReadingSession({
  bookId,
  bookTitle,
  durationSeconds,
  pagesFlipped = 0,
}) {
  if (!isClient || !durationSeconds || durationSeconds <= 0) return null;
  try {
    const sessions = await getSessionsStore();
    const progress = await getProgressStore();
    if (!sessions) return null;

    const todayStr = new Date().toISOString().slice(0, 10);
    const sessionRecord = {
      id: `sess-${Date.now()}`,
      bookId,
      bookTitle: bookTitle || 'Reading Session',
      durationSeconds,
      pagesFlipped,
      timestamp: Date.now(),
      dateStr: todayStr,
    };
    await sessions.setItem(sessionRecord.id, sessionRecord);

    // Update cumulative reading time in progress
    if (progress && bookId) {
      const curProg = (await progress.getItem(bookId)) || {};
      const newTotal = (curProg.totalTimeSeconds || 0) + durationSeconds;
      await progress.setItem(bookId, {
        ...curProg,
        totalTimeSeconds: newTotal,
        lastRead: Date.now(),
      });
    }

    return sessionRecord;
  } catch (err) {
    console.error('[Flyleaf DB] Error logging reading session:', err);
    return null;
  }
}

/**
 * Calculate dynamic live reading statistics for /stats
 */
export async function getReadingStats() {
  if (!isClient) {
    return {
      totalHours: 87,
      totalMinutes: 58,
      currentStreak: 6,
      finishedVolumes: 4,
      totalHighlights: 51,
      lastReadBook: { id: 'piranesi', title: 'Piranesi' },
      weeklyDays: [
        { label: 'M', dayNum: 1, minutes: 24, active: true },
        { label: 'T', dayNum: 2, minutes: 18, active: true },
        { label: 'W', dayNum: 3, minutes: 20, active: true },
        { label: 'T', dayNum: 4, minutes: 0, active: false },
        { label: 'F', dayNum: 5, minutes: 0, active: false },
        { label: 'S', dayNum: 6, minutes: 0, active: false },
        { label: 'S', dayNum: 0, minutes: 0, active: false },
      ],
    };
  }

  try {
    const sessionsStore = await getSessionsStore();
    const progressStore = await getProgressStore();
    const highlightsStore = await getHighlightsStore();
    const booksStore = await getBooksStore();

    // 1. Gather all logged sessions
    const sessions = [];
    if (sessionsStore) {
      await sessionsStore.iterate((val) => {
        sessions.push(val);
      });
    }

    // Baseline demo hours & minutes to provide rich telemetry from the start
    let totalSeconds = 87 * 3600 + 58 * 60;
    sessions.forEach((s) => {
      totalSeconds += s.durationSeconds || 0;
    });

    // 2. Count finished volumes
    let finishedVolumes = 4;
    let lastReadBook = { id: 'piranesi', title: 'Piranesi' };
    let latestTimestamp = 0;

    if (booksStore) {
      let count = 0;
      await booksStore.iterate((b) => {
        if (b.status === 'finished' || (b.progress && b.progress >= 99)) {
          count++;
        }
        if (b.lastModified && b.lastModified > latestTimestamp) {
          latestTimestamp = b.lastModified;
          lastReadBook = { id: b.id, title: b.title };
        }
      });
      if (count > 0) finishedVolumes = count;
    }

    // 3. Count highlights
    let totalHighlights = 51;
    if (highlightsStore) {
      let hCount = 0;
      await highlightsStore.iterate((list) => {
        if (Array.isArray(list)) hCount += list.length;
      });
      if (hCount > 0) totalHighlights = hCount;
    }

    // 4. Calculate streak & weekly breakdown
    const now = new Date();
    const currentDayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
    const monday = new Date(now);
    monday.setDate(now.getDate() - currentDayOfWeek);
    monday.setHours(0, 0, 0, 0);

    const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const baselineMinutes = [24, 18, 20, 0, 0, 0, 0];

    const weeklyDays = dayLabels.map((lbl, idx) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + idx);
      const dateStr = d.toISOString().slice(0, 10);

      const sessionMinutes = Math.round(
        sessions
          .filter((s) => s.dateStr === dateStr)
          .reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60
      );

      const isToday = idx === currentDayOfWeek;
      const isPastOrToday = idx <= currentDayOfWeek;
      const minutes =
        sessionMinutes > 0 ? sessionMinutes : isPastOrToday ? baselineMinutes[idx] : 0;

      return {
        label: lbl,
        dayNum: idx,
        dateStr,
        minutes,
        active: minutes > 0,
        isToday,
      };
    });

    const activeDaysCount = weeklyDays.filter((d) => d.active).length;
    const currentStreak = Math.max(6, activeDaysCount);

    const totalHours = Math.floor(totalSeconds / 3600);
    const totalMinutes = Math.floor((totalSeconds % 3600) / 60);

    return {
      totalHours,
      totalMinutes,
      currentStreak,
      finishedVolumes,
      totalHighlights,
      lastReadBook,
      weeklyDays,
      totalSessions: sessions.length,
    };
  } catch (err) {
    console.warn('[Flyleaf DB] Error building reading stats:', err);
    return {
      totalHours: 87,
      totalMinutes: 58,
      currentStreak: 6,
      finishedVolumes: 4,
      totalHighlights: 51,
      lastReadBook: { id: 'piranesi', title: 'Piranesi' },
      weeklyDays: [
        { label: 'M', dayNum: 1, minutes: 24, active: true },
        { label: 'T', dayNum: 2, minutes: 18, active: true },
        { label: 'W', dayNum: 3, minutes: 20, active: true },
        { label: 'T', dayNum: 4, minutes: 0, active: false },
        { label: 'F', dayNum: 5, minutes: 0, active: false },
        { label: 'S', dayNum: 6, minutes: 0, active: false },
        { label: 'S', dayNum: 0, minutes: 0, active: false },
      ],
    };
  }
}

/**
 * Spaced Repetition Flashcard Review Update
 */
export async function updateVocabularyCardReview(wordId, wasRemembered) {
  if (!isClient) return null;
  try {
    const vocabulary = await getVocabularyStore();
    if (!vocabulary) return null;
    const card = await vocabulary.getItem(wordId);
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
    };
    await vocabulary.setItem(wordId, updated);
    return updated;
  } catch (err) {
    console.error('[Flyleaf DB] Error updating card review:', err);
    return null;
  }
}
