import { isBrowser, statsStore, metaStore, highlightsStore } from '../storage/db';
import {
  computeStreaks,
  computeMedian,
  buildWeeklyDays,
  buildHeatmap,
  buildLast30Days,
} from './calc';

export * from './calc';

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
        Number(val?.pages !== undefined ? val.pages : val?.pagesFlipped || 0) || 0;

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

    const activeDates = dailyRecords
      .filter((r) => r.seconds > 0 || r.pages > 0)
      .map((r) => r.date);

    const now = new Date();
    const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const { currentStreak, longestStreak } = computeStreaks(activeDates, todayLocal);
    const weeklyDays = buildWeeklyDays(dailyRecords, todayLocal);
    const heatmap = buildHeatmap(dailyRecords, todayLocal);
    const last30Days = buildLast30Days(dailyRecords, todayLocal);

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

    const activeSecondsList = dailyRecords
      .map((r) => r.seconds)
      .filter((s) => s > 0);

    const typicalDaySeconds = computeMedian(activeSecondsList);

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
