import { isBrowser, metaStore, progressStore, recordWriteTimestamp } from './db';

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
