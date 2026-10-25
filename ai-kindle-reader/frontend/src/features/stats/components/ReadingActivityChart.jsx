'use client';

import { formatReadingTime } from '../lib/stats-helpers';

export function ReadingActivityChart({ stats, booksMap, totalWeeklySeconds }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
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

      <section className="border border-hairline bg-surface rounded-[12px] p-5 sm:p-6 space-y-4">
        <div className="flex items-baseline justify-between border-b border-hairline pb-3">
          <h2 className="font-serif text-[20px] text-ink font-normal">Pace</h2>
          <span className="text-[12px] text-muted font-sans">
            Daily consistency &amp; velocity
          </span>
        </div>

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
  );
}

export default ReadingActivityChart;
