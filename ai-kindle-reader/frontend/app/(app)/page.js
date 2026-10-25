'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import {
  getAllBooks,
  getStatsSummary,
  getAllVocabularyWords,
  getAllHighlights,
} from '@/utils/db';
import { pluralize } from '@/lib/format';
import {
  PageHeader,
  SectionHeader,
  Card,
  StatBlock,
  Button,
  ProgressLine,
  EmptyState,
  Skeleton,
  Cover,
} from '@/components/ui';

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

/**
 * Time-of-day greeting based on user's local hour.
 */
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) return 'Still awake, ';
  if (hour >= 5 && hour < 12) return 'Good morning, ';
  if (hour >= 12 && hour < 17) return 'Good afternoon, ';
  return 'Good evening, ';
}

export default function HomePage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { userName, openImportModal } = useTheme();

  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [vocabWords, setVocabWords] = useState([]);
  const [fellOutItem, setFellOutItem] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHomeDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vaultBooks, readingTelemetry, savedVocab, savedHighlights] =
        await Promise.all([
          getAllBooks(),
          getStatsSummary(),
          getAllVocabularyWords(),
          getAllHighlights(),
        ]);

      const loadedBooks = (vaultBooks || []).map((b) => ({
        ...b,
        hasBinary: Boolean(b.hasBinary),
      }));

      setBooks(loadedBooks);
      setStats(readingTelemetry);
      setVocabWords(savedVocab || []);

      // "Look what fell out": Pick one item from highlights or vocabulary
      const pool = [];
      if (Array.isArray(savedHighlights)) {
        savedHighlights.forEach((h) => {
          if (h?.text) {
            pool.push({
              type: 'highlight',
              id: h.id,
              text: h.text,
              bookTitle: h.bookTitle,
              date: h.createdAt,
            });
          }
        });
      }
      if (Array.isArray(savedVocab)) {
        savedVocab.forEach((v) => {
          if (v?.word) {
            pool.push({
              type: 'word',
              id: v.id,
              word: v.word,
              definition: v.definition,
              sentence: v.contextSentence,
              bookTitle: v.bookTitle,
              date: v.dateAdded,
            });
          }
        });
      }

      if (pool.length > 0) {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setFellOutItem(picked);
      }
    } catch (err) {
      console.error('Failed to load home dashboard:', err);
      setError('Could not access your offline reading vault.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeDashboard();
  }, [loadHomeDashboard]);

  // Sort books by last read descending
  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const timeA = a.lastRead ? new Date(a.lastRead).getTime() : 0;
      const timeB = b.lastRead ? new Date(b.lastRead).getTime() : 0;
      return timeB - timeA;
    });
  }, [books]);

  // Carousel of in-progress or recently read books
  const carouselBooks = useMemo(() => {
    const reading = sortedBooks.filter((b) => b.status === 'reading' || (b.progress && b.progress > 0));
    return reading.length > 0 ? reading : sortedBooks.slice(0, 3);
  }, [sortedBooks]);

  const currentHero = carouselBooks[heroIndex] || sortedBooks[0] || null;

  // Other volumes for "Recently Added" cover row
  const otherBooks = useMemo(() => {
    return sortedBooks.filter((b) => b.id !== currentHero?.id).slice(0, 3);
  }, [sortedBooks, currentHero]);

  // Derived reading metrics
  const totalSeconds = stats?.totalSeconds || 0;
  const currentStreak = stats?.currentStreak || 0;
  const totalPagesRead = stats?.totalPagesRead || 0;

  const heroProgress = useMemo(() => {
    if (!currentHero) return 0;
    if (typeof currentHero.progressPercentage === 'number') return currentHero.progressPercentage;
    if (typeof currentHero.progress === 'number') return Math.round(currentHero.progress);
    if (currentHero.currentPage && currentHero.totalPages) {
      return Math.round((currentHero.currentPage / currentHero.totalPages) * 100);
    }
    return 0;
  }, [currentHero]);

  const heroPageLabel = useMemo(() => {
    if (!currentHero) return undefined;
    if (currentHero.currentPage && currentHero.totalPages) {
      return `Page ${currentHero.currentPage} of ${currentHero.totalPages}`;
    }
    return `${heroProgress}% complete`;
  }, [currentHero, heroProgress]);

  if (!isMounted) {
    return <div className="w-full min-h-dvh bg-background" />;
  }

  const greeting = getTimeGreeting();

  return (
    <div className="space-y-8">
      {/* Editorial Page Header */}
      <PageHeader
        eyebrow="SANCTUARY VAULT"
        title={`${greeting}${userName || 'Reader'}`}
        description={`${pluralize(books.length, 'volume')} preserved on this device.`}
        action={
          <Button
            variant="secondary"
            onClick={openImportModal}
            icon="add"
          >
            Import EPUB
          </Button>
        }
      />

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-7 space-y-6">
            <Skeleton variant="card" height="300px" />
            <Skeleton variant="card" height="110px" />
          </div>
          <div className="lg:col-span-5 space-y-6">
            <Skeleton variant="card" height="240px" />
            <Skeleton variant="card" height="170px" />
          </div>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon="error"
          title="Unable to open vault"
          description={error}
          action={
            <Button variant="primary" onClick={loadHomeDashboard}>
              Retry
            </Button>
          }
        />
      )}

      {/* Empty State when no books exist */}
      {!loading && !error && books.length === 0 && (
        <EmptyState
          icon="auto_stories"
          title="Your desk is clear"
          description="Import an EPUB or explore curated public domain classics stored directly on this device."
          action={
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
              <Button
                variant="primary"
                onClick={() => router.push('/browse')}
                icon="explore"
                className="w-full sm:w-auto"
              >
                Browse The Commons
              </Button>
              <Button
                variant="secondary"
                onClick={openImportModal}
                icon="upload_file"
                className="w-full sm:w-auto"
              >
                Import EPUB
              </Button>
            </div>
          }
        />
      )}

      {/* Populated Home: Two Columns on >=1024px */}
      {!loading && !error && books.length > 0 && currentHero && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Hero Continue Reading + Stats */}
          <div className="lg:col-span-7 space-y-8">
            {/* Continue Reading Card */}
            <Card className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-hairline flex-wrap gap-2">
                <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
                  Currently Reading
                </span>

                {/* Carousel Counter if multiple reading books */}
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

              <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-start">
                {/* Book Cover */}
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

                {/* Book Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                  <div>
                    <h2 className="font-serif text-[22px] sm:text-[26px] text-ink font-normal leading-snug line-clamp-2 mb-1.5">
                      {currentHero.title}
                    </h2>
                    <p className="font-sans text-[14.5px] text-muted mb-5 truncate">
                      {currentHero.author || 'Unknown Author'}
                    </p>

                    {/* Bronze Progress Line */}
                    <div className="mb-6">
                      <ProgressLine
                        value={heroProgress}
                        showPercentage
                        label={heroPageLabel}
                      />
                    </div>
                  </div>

                  {/* Primary "Resume" Pill */}
                  <div className="pt-2">
                    <Link
                      href={`/reader/${encodeURIComponent(currentHero.id)}`}
                      className="inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-full"
                    >
                      <Button variant="primary" icon="menu_book">
                        Resume reading
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>

            {/* Reading Stats: Three StatBlocks Separated by Hairlines */}
            <Card className="p-6">
              <div className="grid grid-cols-3 divide-x divide-hairline">
                <div className="pr-4 sm:pr-6">
                  <StatBlock
                    value={formatReadingTime(totalSeconds)}
                    label="Time read"
                  />
                </div>
                <div className="px-4 sm:px-6">
                  <StatBlock
                    value={String(totalPagesRead)}
                    label="Pages read"
                    unit="pages"
                  />
                </div>
                <div className="pl-4 sm:pl-6">
                  <StatBlock
                    value={String(currentStreak)}
                    label="Day streak"
                    unit="days"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column: Recent Volumes Cover Row & Marginalia */}
          <div className="lg:col-span-5 space-y-8">
            {/* Recently Added Covers */}
            <div className="space-y-4">
              <SectionHeader
                title="Recent volumes"
                action={
                  <Link
                    href="/library"
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                  >
                    <Button variant="ghost" size="sm">
                      Shelf view
                    </Button>
                  </Link>
                }
              />

              {otherBooks.length > 0 ? (
                <div className="grid grid-cols-3 gap-3.5">
                  {otherBooks.map((b) => (
                    <Link
                      key={b.id}
                      href={`/book/${encodeURIComponent(b.id)}`}
                      className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[10px]"
                      aria-label={`${b.title} by ${b.author}`}
                    >
                      <Cover
                        src={b.coverUrl}
                        title={b.title}
                        author={b.author}
                        aspect="aspect-[2/3]"
                      />
                      <p className="font-serif text-[13px] text-ink mt-2 line-clamp-1 group-hover:text-accent transition-colors">
                        {b.title}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.12em] text-muted truncate mt-0.5">
                        {b.author || 'Author'}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="p-5 text-center">
                  <p className="font-serif text-[14.5px] text-muted">
                    No other volumes in vault yet.
                  </p>
                </Card>
              )}
            </div>

            {/* Marginalia & Lexicon Card */}
            {fellOutItem && (
              <Card className="p-6 space-y-3">
                <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block">
                  {fellOutItem.type === 'word' ? 'Lexicon Card' : 'From Your Marginalia'}
                </span>

                {fellOutItem.type === 'word' ? (
                  <div>
                    <h3 className="font-serif text-[18px] text-ink font-normal mb-1">
                      {fellOutItem.word}
                    </h3>
                    <p className="font-sans text-[13.5px] text-muted leading-relaxed">
                      {fellOutItem.definition}
                    </p>
                  </div>
                ) : (
                  <div>
                    <blockquote className="font-serif italic text-ink text-[15px] leading-relaxed mb-2">
                      “{fellOutItem.text}”
                    </blockquote>
                    <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-muted">
                      — {fellOutItem.bookTitle || 'Recent Reading'}
                    </p>
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
