'use client';

import Link from 'next/link';
import { formatReadingTime, HEATMAP_SCALE } from '../lib/stats-helpers';
import { pluralize } from '@/lib/format';
import { Cover } from '@/components/ui';

export function ReadingHeatmap({ stats, booksMap, activeDaysCount, monthLabels }) {
  return (
    <div className="space-y-8">
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
                      src={coverUrl}
                      title={title}
                      author={author}
                      size="sm"
                      aspect="aspect-[2/3]"
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
  );
}

export default ReadingHeatmap;
