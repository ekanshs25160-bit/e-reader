'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useTheme } from '@/components/common/ThemeProvider';
import { getStatsSummary, getAllBooks } from '@/utils/db';
import { pluralize } from '@/lib/format';
import PageHeader from '@/components/ui/PageHeader';
import StatBlock from '@/components/ui/StatBlock';
import Cover from '@/components/ui/Cover';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

/**
 * Format raw seconds as "1h 4m" or "37m" (under an hour), never "0h 0m".
 */
function formatReadingTime(totalSeconds) {
  const sec = Number(totalSeconds) || 0;
  if (sec <= 0) return '0m';
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }
  return `${Math.max(1, minutes)}m`;
}

// Heatmap: 5 steps of the ink/bronze scale
const HEATMAP_SCALE = [
  'bg-hairline/50', // 0: inactive
  'bg-accent/20',   // 1: low
  'bg-accent/45',   // 2: medium
  'bg-accent/75',   // 3: high
  'bg-accent',      // 4: peak
];

export default function StatsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { userName, userAvatar } = useTheme();
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

  // Build month labels from the real 26-week heatmap data
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

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-background text-ink antialiased">
      <main className="max-w-[72rem] mx-auto px-4 sm:px-8 lg:px-12 pt-6 pb-32 space-y-8">
        {/* Page Header */}
        <PageHeader
          eyebrow="Reading Telemetry"
          title="Your Reading"
          description="Stored on this device. Synced only if you sign in."
        />

        {/* Back to Book link if reading recently */}
        {stats?.lastReadBook?.id && (
          <Link
            href={`/reader/${stats.lastReadBook.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] border border-hairline bg-surface rounded-full text-[13px] text-muted hover:text-ink hover:border-ink/40 transition-colors"
          >
            <span
              className="material-symbols-outlined text-[16px] text-accent"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              arrow_back
            </span>
            <span className="text-[10.5px] uppercase tracking-[0.12em] font-medium">Resume</span>
            <span className="font-serif italic text-ink truncate max-w-[240px]">
              {stats.lastReadBook.title || 'Book'}
            </span>
          </Link>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="border border-hairline bg-surface rounded-[12px] p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-64 rounded-[12px]" />
              <Skeleton className="h-64 rounded-[12px]" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-12 px-6 rounded-[12px] border border-hairline bg-surface text-center space-y-3 max-w-[32rem] mx-auto my-6">
            <span
              className="material-symbols-outlined text-muted text-[36px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              error_outline
            </span>
            <h3 className="font-serif text-[20px] text-ink font-normal">
              Unable to load statistics
            </h3>
            <p className="text-[13px] text-muted font-sans leading-relaxed">{error}</p>
            <div className="pt-2 flex justify-center">
              <Button variant="secondary" size="sm" onClick={loadStats} icon="refresh">
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && !hasData && (
          <div className="py-16 px-6 rounded-[12px] border border-hairline bg-surface text-center space-y-3 max-w-[32rem] mx-auto my-6">
            <span
              className="material-symbols-outlined text-muted text-[36px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              query_stats
            </span>
            <h3 className="font-serif text-[22px] text-ink font-normal">
              No reading recorded yet
            </h3>
            <p className="text-[14px] text-muted font-sans leading-relaxed">
              Read for a few minutes and your reading telemetry will appear here.
            </p>
            <div className="pt-2 flex justify-center">
              <Link href="/library">
                <Button variant="primary" size="sm" icon="auto_stories">
                  Start Reading
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Populated Content */}
        {!loading && !error && hasData && (
          <div className="space-y-8">
            {/* 4 StatBlocks with serif numbers */}
            <div className="grid grid-cols-2 md:grid-cols-4 border border-hairline bg-surface rounded-[12px] divide-y md:divide-y-0 md:divide-x divide-hairline">
              <StatBlock
                label="Time Read"
                value={formatReadingTime(stats.totalSeconds)}
                className="p-5 sm:p-6"
              />
              <StatBlock
                label="Days Running"
                value={stats.currentStreak}
                unit={pluralize(stats.currentStreak, 'day')}
                className="p-5 sm:p-6"
              />
              <StatBlock
                label="Finished"
                value={stats.finishedCount}
                unit={pluralize(stats.finishedCount, 'volume', 'volumes', false)}
                className="p-5 sm:p-6"
              />
              <StatBlock
                label="Highlights"
                value={stats.totalHighlights}
                unit={pluralize(stats.totalHighlights, 'passage', 'passages', false)}
                className="p-5 sm:p-6"
              />
            </div>

            {/* Middle Grid: This Week & Pace */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* This Week Reading Breakdown */}
              <section className="border border-hairline bg-surface rounded-[12px] p-5 sm:p-6 space-y-4">
                <div className="flex items-baseline justify-between border-b border-hairline pb-3">
                  <h2 className="font-serif text-[20px] text-ink font-normal">
                    This week
                  </h2>
                  <span className="text-[12px] text-muted font-sans tabular-nums">
                    {formatReadingTime(totalWeeklySeconds)} since Monday
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-2 pt-1">
                  {(stats.weeklyDays || []).map((day, idx) => {
                    const topBook = day.topBookId ? booksMap[day.topBookId] : null;
                    const topCover = topBook?.coverUrl || null;
                    const topTitle = topBook?.title || day.topBookId || 'Volume';
                    const daySeconds = day.seconds || (day.minutes || 0) * 60;
                    const isActive = day.active || daySeconds > 0;

                    return (
                      <div key={idx} className="flex flex-col items-center space-y-2">
                        <span
                          className={`text-[11px] font-sans uppercase tracking-[0.08em] ${
                            day.isToday ? 'text-ink font-semibold' : 'text-muted'
                          }`}
                        >
                          {day.label}
                        </span>

                        <div className="w-full aspect-[2/3] rounded-[4px] border border-hairline overflow-hidden bg-background flex items-center justify-center">
                          {isActive && topCover ? (
                            <img
                              src={topCover}
                              alt={topTitle}
                              className="w-full h-full object-cover"
                            />
                          ) : isActive ? (
                            <span
                              className="material-symbols-outlined text-[16px] text-accent"
                              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                            >
                              auto_stories
                            </span>
                          ) : (
                            <span className="w-1 h-1 rounded-full bg-hairline" />
                          )}
                        </div>

                        <span className="text-[10.5px] tabular-nums font-sans text-muted">
                          {isActive ? formatReadingTime(daySeconds) : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Pace & Consistency Section with 2px Line Bars */}
              <section className="border border-hairline bg-surface rounded-[12px] p-5 sm:p-6 space-y-4">
                <div className="flex items-baseline justify-between border-b border-hairline pb-3">
                  <h2 className="font-serif text-[20px] text-ink font-normal">Pace</h2>
                  <span className="text-[12px] text-muted font-sans">
                    Daily consistency &amp; velocity
                  </span>
                </div>

                {/* 30-Day mini sparkline: bars are 2px lines */}
                {stats.last30Days && stats.last30Days.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-end justify-between gap-1 h-14 px-2 pb-1 border border-hairline rounded-[8px] bg-background">
                      {(() => {
                        const max30Sec = Math.max(
                          1,
                          ...stats.last30Days.map((d) => d.seconds || 0)
                        );
                        return stats.last30Days.map((d, i) => {
                          const hPct =
                            d.seconds > 0
                              ? Math.max(15, Math.round((d.seconds / max30Sec) * 100))
                              : 8;
                          return (
                            <div
                              key={d.date || i}
                              title={`${d.date}: ${formatReadingTime(d.seconds)}`}
                              className="flex-1 flex flex-col justify-end items-center h-full"
                            >
                              {/* 2px line bar */}
                              <div
                                style={{ height: `${hPct}%` }}
                                className={`w-[2px] rounded-full transition-all ${
                                  d.active ? 'bg-accent' : 'bg-hairline'
                                }`}
                              />
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <div className="flex justify-between items-center text-[10.5px] font-sans text-muted px-1">
                      <span>30 days ago</span>
                      <span>Today</span>
                    </div>
                  </div>
                )}

                {/* Pace Details Grid */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="border border-hairline rounded-[8px] p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-muted font-sans font-medium block">
                      Last 30 Days
                    </span>
                    <span className="font-serif text-[18px] text-ink font-normal tabular-nums block">
                      {formatReadingTime(
                        (stats.last30Days || []).reduce(
                          (acc, d) => acc + (d.seconds || 0),
                          0
                        )
                      )}
                    </span>
                    <span className="text-[11px] text-muted font-sans block">
                      {(stats.last30Days || []).filter((d) => d.active).length} active days
                    </span>
                  </div>

                  <div className="border border-hairline rounded-[8px] p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-muted font-sans font-medium block">
                      Typical Day
                    </span>
                    <span className="font-serif text-[18px] text-ink font-normal tabular-nums block">
                      {stats.typicalDaySeconds > 0
                        ? formatReadingTime(stats.typicalDaySeconds)
                        : '—'}
                    </span>
                    <span className="text-[11px] text-muted font-sans block">
                      median session
                    </span>
                  </div>

                  <div className="border border-hairline rounded-[8px] p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-muted font-sans font-medium block">
                      Best Day
                    </span>
                    <span className="font-serif text-[18px] text-ink font-normal tabular-nums block">
                      {stats.bestDay ? formatReadingTime(stats.bestDay.seconds) : '—'}
                    </span>
                    <span className="text-[11px] text-muted font-sans block">
                      {stats.bestDay
                        ? new Date(stats.bestDay.date + 'T00:00:00').toLocaleDateString(
                            'en-US',
                            { month: 'short', day: 'numeric' }
                          )
                        : 'record'}
                    </span>
                  </div>

                  <div className="border border-hairline rounded-[8px] p-3 space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-muted font-sans font-medium block">
                      Longest Run
                    </span>
                    <span className="font-serif text-[18px] text-ink font-normal tabular-nums block">
                      {stats.longestStreak || 0}
                    </span>
                    <span className="text-[11px] text-muted font-sans block">
                      consecutive days
                    </span>
                  </div>
                </div>
              </section>
            </div>

            {/* 26-Week Heatmap Calendar (5 steps of the ink/bronze scale) */}
            <section className="border border-hairline bg-surface rounded-[12px] p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between border-b border-hairline pb-3 gap-1">
                <h2 className="font-serif text-[20px] text-ink font-normal">
                  The last six months
                </h2>
                <span className="text-[12px] text-muted font-sans">
                  {pluralize(activeDaysCount, 'day')} with a book · longest run{' '}
                  {pluralize(stats.longestStreak || 0, 'day')}
                </span>
              </div>

              <div className="overflow-x-auto pt-1 pb-1">
                <div className="min-w-[580px] space-y-2">
                  {/* Month Labels */}
                  <div className="flex text-[10.5px] font-sans text-muted pl-5 justify-between pr-2">
                    {monthLabels.map((m, idx) => (
                      <span key={idx}>{m}</span>
                    ))}
                  </div>

                  <div className="flex gap-2 items-start">
                    <div className="flex flex-col gap-1.5 text-[9.5px] font-sans text-muted pr-1">
                      <span>M</span>
                      <span>W</span>
                      <span>F</span>
                    </div>

                    {/* 7 rows x 26 columns grid with 5 steps of the ink/bronze scale */}
                    <div className="grid grid-flow-col grid-rows-7 gap-1.5 flex-1">
                      {(stats.heatmap || []).map((day, i) => {
                        const level = day.level || (day.active ? 1 : 0);
                        const bgClass =
                          HEATMAP_SCALE[Math.max(0, Math.min(4, level))] ||
                          HEATMAP_SCALE[0];
                        return (
                          <div
                            key={day.date || i}
                            title={`${day.date}: ${formatReadingTime(day.seconds)} (${pluralize(
                              day.pages || 0,
                              'page'
                            )})`}
                            className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${bgClass}`}
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Heatmap Legend (5 steps) */}
                  <div className="flex items-center justify-end gap-1.5 text-[10.5px] text-muted font-sans pt-2">
                    <span>Less</span>
                    {HEATMAP_SCALE.map((bg, idx) => (
                      <span
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-[2px] ${bg}`}
                      />
                    ))}
                    <span>More</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Where The Time Went: Bars are 2px lines */}
            {stats.perBook && stats.perBook.length > 0 && (
              <section className="border border-hairline bg-surface rounded-[12px] p-5 sm:p-6 space-y-4">
                <div className="flex items-baseline justify-between border-b border-hairline pb-3">
                  <h2 className="font-serif text-[20px] text-ink font-normal">
                    Where the time went
                  </h2>
                  <span className="text-[12px] text-muted font-sans">
                    Ranked by duration
                  </span>
                </div>

                <div className="space-y-4 pt-1">
                  {stats.perBook.map((item, idx) => {
                    const bookInfo = booksMap[item.bookId] || {};
                    const title = bookInfo.title || item.title || item.bookId;
                    const author = bookInfo.author || item.author || '';
                    const coverUrl = bookInfo.coverUrl || item.coverUrl;
                    const topSec = stats.perBook[0]?.seconds || 1;
                    const percent = Math.max(
                      3,
                      Math.min(100, Math.round((item.seconds / topSec) * 100))
                    );

                    return (
                      <Link
                        key={item.bookId || idx}
                        href={`/reader/${item.bookId}`}
                        className="group flex items-center gap-3.5 p-2 rounded-[8px] hover:border hover:border-hairline transition-colors"
                      >
                        <div className="w-10 aspect-[2/3] shrink-0">
                          <Cover
                            coverUrl={coverUrl}
                            title={title}
                            author={author}
                            size="sm"
                          />
                        </div>

                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-baseline justify-between gap-2">
                            <div className="min-w-0">
                              <h4 className="font-serif text-[15px] text-ink font-normal truncate group-hover:underline">
                                {title}
                              </h4>
                              {author && (
                                <p className="text-[11px] text-muted font-sans truncate">
                                  {author}
                                </p>
                              )}
                            </div>
                            <span className="text-[12px] tabular-nums font-sans text-muted shrink-0">
                              {formatReadingTime(item.seconds)}
                            </span>
                          </div>

                          {/* Bar is a 2px line */}
                          <div className="w-full bg-hairline rounded-full h-[2px] overflow-hidden">
                            <div
                              className="bg-accent h-[2px] rounded-full transition-all duration-300"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
