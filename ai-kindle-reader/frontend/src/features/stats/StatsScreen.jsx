'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useReadingStats } from './hooks/useReadingStats';
import { StatsOverviewCards } from './components/StatsOverviewCards';
import { ReadingActivityChart } from './components/ReadingActivityChart';
import { ReadingHeatmap } from './components/ReadingHeatmap';
import { PageHeader, Button, Skeleton } from '@/components/ui';

export function StatsScreen() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    stats,
    booksMap,
    loading,
    error,
    totalWeeklySeconds,
    activeDaysCount,
    monthLabels,
    hasData,
    reload,
  } = useReadingStats();

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="READING ANALYTICS"
        title="Your reading"
        description="Stored on this device. Synced only if you sign in."
      />

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
            <Button variant="secondary" size="sm" onClick={reload} icon="refresh">
              Retry
            </Button>
          </div>
        </div>
      )}

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

      {!loading && !error && hasData && (
        <div className="space-y-8">
          <StatsOverviewCards stats={stats} />
          <ReadingActivityChart
            stats={stats}
            booksMap={booksMap}
            totalWeeklySeconds={totalWeeklySeconds}
          />
          <ReadingHeatmap
            stats={stats}
            booksMap={booksMap}
            activeDaysCount={activeDaysCount}
            monthLabels={monthLabels}
          />
        </div>
      )}
    </div>
  );
}

export default StatsScreen;
