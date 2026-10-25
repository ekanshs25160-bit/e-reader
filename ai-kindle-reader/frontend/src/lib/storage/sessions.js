import { isBrowser, statsStore, recordWriteTimestamp } from './db';

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

    const isDayActive = i % 7 !== 3 && (i * 11) % 10 < 8;
    if (isDayActive) {
      const seconds = Math.floor(720 + Math.random() * 2500);
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
