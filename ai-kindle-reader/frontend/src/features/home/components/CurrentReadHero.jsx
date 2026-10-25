'use client';

import Link from 'next/link';
import { formatReadingTime } from '../lib/home-helpers';
import { Card, Button, ProgressLine, Cover, StatBlock } from '@/components/ui';

export function CurrentReadHero({
  currentHero,
  carouselBooks,
  heroIndex,
  setHeroIndex,
  heroProgress,
  heroPageLabel,
  totalSeconds,
  totalPagesRead,
  currentStreak,
}) {
  return (
    <div className="space-y-8">
      <Card className="p-5 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-hairline flex-wrap gap-2">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
            Currently Reading
          </span>

          {carouselBooks.length > 1 && (
            <div className="inline-flex items-center gap-1 border border-hairline rounded-full px-2 py-0.5 text-[11px] text-muted">
              <button
                type="button"
                onClick={() =>
                  setHeroIndex((i) =>
                    i > 0 ? i - 1 : carouselBooks.length - 1
                  )
                }
                className="min-h-[44px] min-w-[36px] flex items-center justify-center hover:text-ink transition font-bold"
                aria-label="Previous reading volume"
              >
                ‹
              </button>
              <span className="tabular-nums font-sans">
                {heroIndex + 1} / {carouselBooks.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setHeroIndex((i) =>
                    i < carouselBooks.length - 1 ? i + 1 : 0
                  )
                }
                className="min-h-[44px] min-w-[36px] flex items-center justify-center hover:text-ink transition font-bold"
                aria-label="Next reading volume"
              >
                ›
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start min-w-0">
          <Link
            href={`/reader/${encodeURIComponent(currentHero.id)}`}
            className="w-32 sm:w-36 aspect-[2/3] shrink-0 block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[10px]"
            aria-label={`Read ${currentHero.title}`}
          >
            <Cover
              src={currentHero.coverUrl}
              title={currentHero.title}
              author={currentHero.author}
              aspect="aspect-[2/3]"
            />
          </Link>

          <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
            <div className="min-w-0">
              <h2 className="font-serif text-[22px] sm:text-[26px] text-ink font-normal leading-snug line-clamp-3 mb-1.5 break-words">
                {currentHero.title}
              </h2>
              <p className="font-sans text-[14.5px] text-muted mb-5 truncate">
                {currentHero.author || 'Unknown Author'}
              </p>

              <div className="mb-6">
                <ProgressLine
                  value={heroProgress}
                  showPercentage
                  label={heroPageLabel}
                />
              </div>
            </div>

            <div className="pt-2">
              <Link
                href={`/reader/${encodeURIComponent(currentHero.id)}`}
                className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
              >
                <Button variant="primary" icon="menu_book" className="whitespace-nowrap">
                  Resume reading
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6 lg:p-8">
        <div className="grid grid-cols-3 divide-x divide-hairline">
          <div className="pr-3 sm:pr-4 lg:pr-6 min-w-0">
            <StatBlock
              value={formatReadingTime(totalSeconds)}
              label="Time read"
            />
          </div>
          <div className="px-3 sm:px-4 lg:px-6 min-w-0">
            <StatBlock
              value={String(totalPagesRead)}
              label="Pages read"
              unit="pages"
            />
          </div>
          <div className="pl-3 sm:pl-4 lg:pl-6 min-w-0">
            <StatBlock
              value={String(currentStreak)}
              label="Day streak"
              unit="days"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

export default CurrentReadHero;
