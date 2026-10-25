'use client';

import { useState, useEffect, useCallback } from 'react';
import { getStatsSummary, getAllBooks } from '@/utils/db';

export function useReadingStats() {
  const [stats, setStats] = useState(null);
  const [booksMap, setBooksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summary, storedBooks] = await Promise.all([
        getStatsSummary(),
        getAllBooks(),
      ]);

      const map = {};
      if (Array.isArray(storedBooks)) {
        storedBooks.forEach((b) => {
          map[b.id] = { ...(map[b.id] || {}), ...b };
          if (b.gutenbergId) {
            map[String(b.gutenbergId)] = map[b.id];
            map[`gutenberg_${b.gutenbergId}`] = map[b.id];
          }
        });
      }

      setBooksMap(map);
      setStats(summary);
    } catch (err) {
      console.warn('Error loading telemetry stats summary:', err);
      setError(err?.message || 'Failed to load reading statistics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const totalWeeklySeconds = (stats?.weeklyDays || []).reduce(
    (acc, cur) => acc + (cur.seconds || (cur.minutes || 0) * 60),
    0
  );

  const activeDaysCount = (stats?.heatmap || []).filter((d) => d.active).length;

  const monthLabels = [];
  let lastMonth = -1;
  if (Array.isArray(stats?.heatmap)) {
    for (let col = 0; col < 26; col++) {
      const day = stats.heatmap[col * 7];
      if (day && day.date) {
        const parts = day.date.split('-').map(Number);
        const m = parts[1];
        if (m !== lastMonth) {
          const monthName = new Date(parts[0], m - 1, 1).toLocaleDateString('en-US', {
            month: 'short',
          });
          monthLabels.push(monthName);
          lastMonth = m;
        }
      }
    }
  }

  const hasData =
    stats &&
    (stats.totalSeconds > 0 ||
      stats.totalPagesTurned > 0 ||
      stats.totalHighlights > 0 ||
      stats.finishedCount > 0);

  return {
    stats,
    booksMap,
    loading,
    error,
    totalWeeklySeconds,
    activeDaysCount,
    monthLabels,
    hasData,
    reload: loadStats,
  };
}
