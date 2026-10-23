'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getStatsSummary, getAllBooks } from '@/utils/db';

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

export default function Page() {
  const [stats, setStats] = useState(null);
  const [booksMap, setBooksMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadStats() {
      setLoading(true);
      try {
        const [summary, storedBooks] = await Promise.all([
          getStatsSummary(),
          getAllBooks(),
        ]);

        if (!active) return;

        // Build book lookup dictionary from stored library books
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
      } finally {
        if (active) setLoading(false);
      }
    }

    loadStats();
    return () => {
      active = false;
    };
  }, []);

  const totalWeeklySeconds = (stats?.weeklyDays || []).reduce(
    (acc, cur) => acc + (cur.seconds || (cur.minutes || 0) * 60),
    0
  );

  const activeDaysCount = (stats?.heatmap || []).filter((d) => d.active).length;

  // Build dynamic month labels from the real 26-week heatmap data
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

  // Determine if there is any recorded reading data
  const hasData =
    stats &&
    (stats.totalSeconds > 0 ||
      stats.totalPagesTurned > 0 ||
      stats.totalHighlights > 0 ||
      stats.finishedCount > 0);

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container">
      <main className="w-full bg-background flex-col relative pb-28 md:pb-10">
        {/* Mobile Header Bar */}
        <header className="md:hidden bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-md text-primary dark:text-inverse-primary docked full-width top-0 sticky z-40 shadow-sm dark:shadow-none flex justify-between items-center w-full px-gutter py-space-sm border-b border-outline-variant/30">
          <Link href="/settings" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full overflow-hidden ring-1 ring-outline-variant/40 bg-surface-container-high flex items-center justify-center">
              <img
                className="w-full h-full object-cover"
                alt="Reader Portrait"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa2b_KB0Su7rUQgMiJyBfvSK82YsnkwTxuyKmNZkBGDJLzpcrZ3GZhnuvjZXBPoI9CQly_7XbiNQqsODYWNmECDYE5zOV0443CZI9yawG6fLDxAiGrjct8SNzCxp-er031SZl--_tbtPqzVXiKNeM_ORZ2hj2I2VRLog2nK7ztHGtAaE2VJnAruY0XdTDOxmiHQa5sCuqZO2Ew1sYYvOPr_KCr6UchtqD2Y4qIMyX8QYJx4-nTDxs8"
              />
            </div>
            <span className="font-headline-md text-headline-md text-primary dark:text-inverse-primary font-medium tracking-tight">
              Flyleaf
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/library"
              aria-label="Search"
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </Link>
          </div>
        </header>

        {/* Loading Skeleton */}
        {loading && (
          <div className="px-gutter md:px-8 pt-5 flex flex-col space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start animate-pulse">
            <div className="lg:col-span-2 space-y-2">
              <div className="h-8 w-44 bg-surface-container-high rounded-lg" />
              <div className="h-4 w-72 bg-surface-container-high/60 rounded-md" />
            </div>

            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 bg-surface-container-lowest/80 rounded-[16px] p-4 border border-black/[0.04] flex flex-col justify-between"
                >
                  <div className="h-3 w-16 bg-surface-container-high rounded" />
                  <div className="h-7 w-20 bg-surface-container-high rounded" />
                </div>
              ))}
            </div>

            <div className="h-56 bg-surface-container-lowest/80 rounded-[16px] p-4 border border-black/[0.04] space-y-4">
              <div className="h-4 w-28 bg-surface-container-high rounded" />
              <div className="grid grid-cols-7 gap-2 pt-2">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="aspect-[2/3] bg-surface-container-high rounded-md" />
                ))}
              </div>
            </div>

            <div className="h-56 bg-surface-container-lowest/80 rounded-[16px] p-4 border border-black/[0.04] space-y-4">
              <div className="h-4 w-36 bg-surface-container-high rounded" />
              <div className="h-32 bg-surface-container-high/50 rounded-lg" />
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!loading && (
          <div className="px-gutter md:px-8 pt-5 flex flex-col space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
            {/* Header section with optional Back to <book> link */}
            <section className="lg:col-span-2 flex flex-col space-y-3.5">
              <div className="flex flex-col space-y-1">
                <h1 className="font-headline-lg text-headline-lg text-primary font-normal tracking-tight">
                  Your reading
                </h1>
                <p className="font-caption text-caption text-on-surface-variant italic leading-relaxed">
                  Measured on this device, kept on this device. Nothing here has ever left it.
                </p>
              </div>

              {/* Back to <book> link: hidden if no last-read book */}
              {stats?.lastReadBook?.id && (
                <Link
                  className="group flex items-center justify-between px-3.5 py-2.5 bg-surface-container-lowest/80 backdrop-blur-sm border border-black/[0.08] dark:border-white/10 hover:border-black/[0.16] rounded-full shadow-[0_1px_3px_rgba(44,64,88,0.03)] active:scale-[0.98] transition-all duration-150"
                  href={`/reader/${stats.lastReadBook.id}`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <span className="material-symbols-outlined text-primary text-[18px] group-hover:-translate-x-0.5 transition-transform">
                      arrow_back
                    </span>
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-label-md text-label-md text-primary tracking-wide">
                        BACK TO
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface italic truncate">
                        {stats.lastReadBook.title || 'Book'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pl-2 text-on-surface-variant">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      menu_book
                    </span>
                  </div>
                </Link>
              )}
            </section>

            {/* Empty State when no reading has been recorded */}
            {!hasData && (
              <section className="lg:col-span-2 bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[24px] p-8 md:p-12 text-center shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col items-center justify-center my-4">
                <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[32px]">query_stats</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface font-medium mb-1.5">
                  No reading recorded yet
                </h2>
                <p className="font-body-ui text-body-ui text-on-surface-variant max-w-md leading-relaxed mb-6">
                  Read for a few minutes and your stats will appear here
                </p>
                <Link
                  href="/library"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-medium hover:opacity-90 active:scale-95 transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                  <span>Start Reading</span>
                </Link>
              </section>
            )}

            {/* Populated Telemetry Content */}
            {hasData && (
              <>
                {/* 4 Metric Telemetry Cards */}
                <section className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* TIME READ */}
                  <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
                    <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                      TIME READ
                    </span>
                    <div className="mt-2.5 flex items-baseline">
                      <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                        {stats.totalSeconds >= 3600 ? (
                          <>
                            {Math.floor(stats.totalSeconds / 3600)}
                            <span className="font-headline-sm text-headline-sm text-on-surface-variant ml-0.5">
                              h
                            </span>{' '}
                            {Math.floor((stats.totalSeconds % 3600) / 60) > 0 && (
                              <>
                                {Math.floor((stats.totalSeconds % 3600) / 60)}
                                <span className="font-headline-sm text-headline-sm text-on-surface-variant ml-0.5">
                                  m
                                </span>
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {Math.max(1, Math.floor(stats.totalSeconds / 60))}
                            <span className="font-headline-sm text-headline-sm text-on-surface-variant ml-0.5">
                              m
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* DAYS RUNNING */}
                  <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                        DAYS RUNNING
                      </span>
                      <span
                        className="material-symbols-outlined text-secondary text-[17px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        local_fire_department
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-baseline">
                      <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                        {stats.currentStreak}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant ml-1.5 italic">
                        {stats.currentStreak === 1 ? 'day streak' : 'days streak'}
                      </span>
                    </div>
                  </div>

                  {/* FINISHED */}
                  <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
                    <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                      FINISHED
                    </span>
                    <div className="mt-2.5 flex items-baseline">
                      <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                        {stats.finishedCount}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                        {stats.finishedCount === 1 ? 'volume' : 'volumes'}
                      </span>
                    </div>
                  </div>

                  {/* HIGHLIGHTS */}
                  <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 flex flex-col justify-between shadow-[0_2px_8px_rgba(44,64,88,0.03)] hover:shadow-md transition-shadow">
                    <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase">
                      HIGHLIGHTS
                    </span>
                    <div className="mt-2.5 flex items-baseline">
                      <span className="font-display-lg-mobile text-display-lg-mobile text-on-surface font-normal leading-none">
                        {stats.totalHighlights}
                      </span>
                      <span className="font-caption text-caption text-on-surface-variant ml-1.5">
                        {stats.totalHighlights === 1 ? 'passage' : 'passages'}
                      </span>
                    </div>
                  </div>
                </section>

                {/* This Week Reading Breakdown Chart */}
                <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-3.5">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                      This week
                    </h2>
                    <span className="font-caption text-caption text-on-surface-variant">
                      {formatReadingTime(totalWeeklySeconds)} since Monday
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-2 pt-1">
                    {(stats.weeklyDays || []).map((day, idx) => {
                      const topBook = day.topBookId ? booksMap[day.topBookId] : null;
                      const topCover = topBook?.coverUrl || null;
                      const topTitle = topBook?.title || day.topBookId || 'Book';
                      const daySeconds = day.seconds || (day.minutes || 0) * 60;
                      const isActive = day.active || daySeconds > 0;

                      return (
                        <div key={idx} className="flex flex-col items-center space-y-1.5">
                          <span
                            className={`font-label-sm text-label-sm ${
                              day.isToday ? 'text-secondary font-bold' : 'text-on-surface'
                            }`}
                          >
                            {day.label}
                          </span>
                          {isActive ? (
                            <div
                              className={`w-full aspect-[2/3] rounded-md overflow-hidden ring-1 shadow-sm relative group bg-surface-container ${
                                day.isToday ? 'ring-secondary ring-2' : 'ring-black/15'
                              }`}
                            >
                              {topCover ? (
                                <img
                                  className="w-full h-full object-cover"
                                  alt={topTitle}
                                  src={topCover}
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-secondary/15 p-1 text-center">
                                  <span className="material-symbols-outlined text-[16px] text-secondary">
                                    menu_book
                                  </span>
                                  <span className="text-[8px] font-medium text-secondary truncate max-w-full">
                                    {topTitle}
                                  </span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-full aspect-[2/3] rounded-md border border-dashed border-outline-variant/60 bg-surface-container-low/50 flex items-center justify-center opacity-60">
                              <span className="w-1.5 h-1.5 rounded-full bg-outline-variant/50"></span>
                            </div>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-label-sm ${
                              isActive
                                ? day.isToday
                                  ? 'bg-secondary-fixed text-on-secondary-fixed-variant font-bold'
                                  : 'bg-[#EEECE6] dark:bg-surface-container text-on-surface font-semibold'
                                : 'text-on-surface-variant opacity-60'
                            }`}
                          >
                            {isActive ? formatReadingTime(daySeconds) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Pace & Consistency Section */}
                <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-3.5">
                  <div className="flex items-baseline justify-between">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                      Pace
                    </h2>
                    <span className="font-caption text-caption text-on-surface-variant">
                      Daily consistency &amp; velocity
                    </span>
                  </div>

                  {/* 30-Day mini sparkline bar strip */}
                  {stats.last30Days && stats.last30Days.length > 0 && (
                    <div className="pt-1">
                      <div className="flex items-end justify-between gap-1 h-12 px-1 pb-1 bg-surface-container-low/40 rounded-xl border border-outline-variant/20">
                        {(() => {
                          const max30Sec = Math.max(
                            1,
                            ...stats.last30Days.map((d) => d.seconds || 0)
                          );
                          return stats.last30Days.map((d, i) => {
                            const hPct =
                              d.seconds > 0
                                ? Math.max(15, Math.round((d.seconds / max30Sec) * 100))
                                : 6;
                            return (
                              <div
                                key={d.date || i}
                                title={`${d.date}: ${formatReadingTime(d.seconds)}`}
                                className="flex-1 flex flex-col justify-end items-center h-full group"
                              >
                                <div
                                  style={{ height: `${hPct}%` }}
                                  className={`w-full rounded-xs transition-all ${
                                    d.active
                                      ? 'bg-secondary group-hover:bg-primary'
                                      : 'bg-surface-container-high'
                                  }`}
                                />
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-caption text-on-surface-variant px-1 pt-1">
                        <span>30 days ago</span>
                        <span>Today</span>
                      </div>
                    </div>
                  )}

                  {/* 4 Pace Metric Cards */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    {/* Last 30 Days */}
                    <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex flex-col justify-between">
                      <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                        LAST 30 DAYS
                      </span>
                      <div className="mt-1.5">
                        <span className="text-base font-medium text-on-surface">
                          {formatReadingTime(
                            (stats.last30Days || []).reduce(
                              (acc, d) => acc + (d.seconds || 0),
                              0
                            )
                          )}
                        </span>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {(stats.last30Days || []).filter((d) => d.active).length} active days
                        </p>
                      </div>
                    </div>

                    {/* Typical Day */}
                    <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex flex-col justify-between">
                      <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                        TYPICAL DAY
                      </span>
                      <div className="mt-1.5">
                        <span className="text-base font-medium text-on-surface">
                          {stats.typicalDaySeconds > 0
                            ? formatReadingTime(stats.typicalDaySeconds)
                            : '—'}
                        </span>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          median active session
                        </p>
                      </div>
                    </div>

                    {/* Best Day */}
                    <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex flex-col justify-between">
                      <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                        BEST DAY
                      </span>
                      <div className="mt-1.5">
                        <span className="text-base font-medium text-on-surface">
                          {stats.bestDay ? formatReadingTime(stats.bestDay.seconds) : '—'}
                        </span>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          {stats.bestDay
                            ? new Date(
                                stats.bestDay.date + 'T00:00:00'
                              ).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'record day'}
                        </p>
                      </div>
                    </div>

                    {/* Longest Run */}
                    <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex flex-col justify-between">
                      <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider">
                        LONGEST RUN
                      </span>
                      <div className="mt-1.5">
                        <span className="text-base font-medium text-on-surface">
                          {stats.longestStreak || 0}
                          <span className="text-xs font-normal text-on-surface-variant ml-1">
                            days
                          </span>
                        </span>
                        <p className="text-[11px] text-on-surface-variant mt-0.5">
                          consecutive streak
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pages Turned Total */}
                  <div className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 flex items-center justify-between">
                    <div>
                      <span className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider block">
                        PAGES TURNED
                      </span>
                      <span className="text-base font-medium text-on-surface">
                        {stats.totalPagesTurned.toLocaleString()}
                        <span className="text-xs font-normal text-on-surface-variant ml-1">
                          pages total
                        </span>
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[24px]">
                      auto_stories
                    </span>
                  </div>
                </section>

                {/* 26-Week Heatmap Calendar */}
                <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-3">
                  <div className="flex flex-col space-y-0.5">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                      The last six months
                    </h2>
                    <span className="font-caption text-caption text-on-surface-variant">
                      {activeDaysCount} {activeDaysCount === 1 ? 'day' : 'days'} with a book · longest run{' '}
                      {stats.longestStreak || 0} {stats.longestStreak === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <div className="overflow-x-auto pt-2 pb-1">
                    <div className="min-w-[310px] flex flex-col space-y-1.5">
                      {/* Dynamic Month Labels calculated from real data */}
                      <div className="flex text-[10px] font-caption text-on-surface-variant pl-4 justify-between pr-1">
                        {monthLabels.map((m, idx) => (
                          <span key={idx}>{m}</span>
                        ))}
                      </div>
                      <div className="flex gap-1.5 items-start">
                        <div className="flex flex-col gap-1 text-[9px] font-caption text-on-surface-variant pr-1">
                          <span>M</span>
                          <span>W</span>
                          <span>F</span>
                        </div>
                        {/* 7 rows x 26 columns grid with intensity levels */}
                        <div className="grid grid-flow-col grid-rows-7 gap-1 flex-1">
                          {(stats.heatmap || []).map((day, i) => {
                            const level = day.level || (day.active ? 1 : 0);
                            const bgClass =
                              level === 4
                                ? 'bg-secondary'
                                : level === 3
                                ? 'bg-secondary/75'
                                : level === 2
                                ? 'bg-secondary/50'
                                : level === 1
                                ? 'bg-secondary/25'
                                : 'bg-surface-container-high';
                            return (
                              <div
                                key={day.date || i}
                                title={`${day.date}: ${formatReadingTime(day.seconds)} (${
                                  day.pages || 0
                                } pages)`}
                                className={`w-2.5 h-2.5 rounded-[2px] transition-colors ${bgClass}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Where The Time Went: Ranked perBook with relative progress bars */}
                {stats.perBook && stats.perBook.length > 0 && (
                  <section className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(44,64,88,0.03)] flex flex-col space-y-3.5">
                    <div className="flex items-baseline justify-between">
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-medium">
                        Where the time went
                      </h2>
                      <span className="font-caption text-caption text-on-surface-variant">
                        Ranked by time read
                      </span>
                    </div>
                    <div className="space-y-3 pt-1">
                      {stats.perBook.map((item, idx) => {
                        const bookInfo = booksMap[item.bookId] || {};
                        const title = bookInfo.title || item.title || item.bookId;
                        const author = bookInfo.author || item.author || '';
                        const coverUrl = bookInfo.coverUrl || item.coverUrl;
                        const topSec = stats.perBook[0]?.seconds || 1;
                        const percent = Math.max(
                          4,
                          Math.min(100, Math.round((item.seconds / topSec) * 100))
                        );

                        return (
                          <Link
                            key={item.bookId || idx}
                            href={`/reader/${item.bookId}`}
                            className="group flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low/50 active:scale-[0.99] transition"
                          >
                            {/* Book Cover Thumbnail */}
                            <div className="w-10 h-14 rounded-md overflow-hidden bg-surface-container ring-1 ring-black/10 flex-shrink-0 shadow-xs relative">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt={title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-secondary/10 text-secondary">
                                  <span className="material-symbols-outlined text-[18px]">
                                    menu_book
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Book Info & Relative Bar */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <div className="truncate">
                                  <h4 className="text-sm font-medium text-on-surface truncate group-hover:text-primary transition-colors">
                                    {title}
                                  </h4>
                                  {author && (
                                    <p className="text-[11px] text-on-surface-variant truncate">
                                      {author}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                  <span className="text-xs font-semibold text-on-surface">
                                    {formatReadingTime(item.seconds)}
                                  </span>
                                  {item.pages > 0 && (
                                    <p className="text-[10px] text-on-surface-variant">
                                      {item.pages} {item.pages === 1 ? 'page' : 'pages'}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Progress bar relative to top book */}
                              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-secondary h-full rounded-full transition-all duration-500"
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
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
