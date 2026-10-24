'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import {
  getAllBooks,
  getStatsSummary,
  getAllVocabularyWords,
  getAllHighlights,
} from '@/utils/db';
import BookCover from '@/components/BookCover';
import { pluralize } from '@/lib/format';

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
 * Time-of-day greeting based on user's local hour:
 * 00:00 - 04:59: "Still awake, "
 * 05:00 - 11:59: "Good morning, "
 * 12:00 - 16:59: "Good afternoon, "
 * 17:00 - 23:59: "Good evening, "
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
  const { userName, userAvatar, openImportModal } = useTheme();

  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [vocabWords, setVocabWords] = useState([]);
  const [fellOutItem, setFellOutItem] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHomeDashboard() {
      try {
        const [vaultBooks, readingTelemetry, savedVocab, savedHighlights] =
          await Promise.all([
            getAllBooks(),
            getStatsSummary(),
            getAllVocabularyWords(),
            getAllHighlights(),
          ]);

        if (active) {
          const loadedBooks = (vaultBooks || []).map((b) => ({
            ...b,
            hasBinary: Boolean(b.hasBinary),
          }));

          setBooks(loadedBooks);
          setStats(readingTelemetry);
          setVocabWords(savedVocab || []);

          // Build dictionary for fast title lookup
          const bookTitleMap = {};
          loadedBooks.forEach((b) => {
            bookTitleMap[b.id] = b.title;
          });

          // "Look what fell out": Pick ONE random item from highlights or vocabulary once per visit
          const pool = [];
          if (Array.isArray(savedHighlights)) {
            savedHighlights.forEach((h) => {
              if (h?.text) {
                pool.push({
                  type: 'highlight',
                  id: h.id,
                  text: h.text,
                  chapter: h.chapter,
                  bookId: h.bookId,
                  bookTitle: bookTitleMap[h.bookId] || h.chapter || 'Saved Passage',
                });
              }
            });
          }
          if (Array.isArray(savedVocab)) {
            savedVocab.forEach((v) => {
              if (v?.word) {
                pool.push({
                  type: 'vocab',
                  id: v.id || v.word,
                  word: v.word,
                  phonetic: v.phonetic,
                  partOfSpeech: v.partOfSpeech,
                  definition: v.definition || v.definitions?.[0],
                  contextSentence: v.contextSentence,
                  bookId: v.bookId,
                  bookTitle: v.bookTitle || bookTitleMap[v.bookId] || 'Vocabulary Deck',
                });
              }
            });
          }

          if (pool.length > 0) {
            const randomIndex = Math.floor(Math.random() * pool.length);
            setFellOutItem(pool[randomIndex]);
          } else {
            setFellOutItem(null);
          }

          setLoading(false);
        }
      } catch (err) {
        console.warn('[Home Dashboard] Failed loading vault data:', err);
        if (active) {
          setBooks([]);
          setLoading(false);
        }
      }
    }

    loadHomeDashboard();

    return () => {
      active = false;
    };
  }, []);

  const greeting = getTimeGreeting();

  // Books sorted by lastReadTimestamp descending
  const sortedBooks = [...books].sort(
    (a, b) => (b.lastReadTimestamp || 0) - (a.lastReadTimestamp || 0)
  );

  // Books with status "reading"
  const readingBooks = sortedBooks.filter(
    (b) =>
      b.status === 'reading' ||
      ((b.progressPercentage || b.progress) > 0 &&
        (b.progressPercentage || b.progress) < 100)
  );

  // Carousel pool: prefer reading books, fall back to sortedBooks
  const carouselBooks = readingBooks.length > 0 ? readingBooks : sortedBooks;
  const currentHero = carouselBooks[heroIndex] || carouselBooks[0] || null;

  const heroProgress =
    currentHero?.progressPercentage !== undefined
      ? currentHero.progressPercentage
      : currentHero?.progress !== undefined
      ? currentHero.progress
      : 0;

  const otherBooks = sortedBooks
    .filter((b) => b.id !== currentHero?.id)
    .slice(0, 3);

  // Stats strip metrics
  const thisWeekSeconds = (stats?.weeklyDays || []).reduce(
    (acc, cur) => acc + (cur.seconds || (cur.minutes || 0) * 60),
    0
  );
  const currentStreak = stats?.currentStreak || 0;
  const totalSeconds = stats?.totalSeconds || 0;

  // Real vocabulary only (last 3 items)
  const recentLookups = vocabWords.slice(0, 3);

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-surface text-on-surface antialiased selection:bg-secondary-container/40 selection:text-secondary">
      <div className="w-full relative flex-col bg-gradient-to-b from-[#DCE9F5] dark:from-[#1c2438] via-surface-bright to-surface pb-32 md:pb-12">
        {/* Mobile Top Navigation Bar */}
        <div className="md:hidden bg-surface/85 dark:bg-inverse-surface/85 backdrop-blur-md text-primary dark:text-inverse-primary docked full-width top-0 sticky z-40 shadow-xs flex justify-between items-center w-full px-5 py-3">
          <Link href="/settings" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-outline-variant/30 shadow-xs bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-xs">
              {userAvatar ? (
                <img
                  alt={userName}
                  className="w-full h-full object-cover"
                  src={userAvatar}
                />
              ) : (
                <span>{(userName || 'R').slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="font-headline-md text-headline-md text-primary dark:text-inverse-primary font-medium tracking-tight">
              Flyleaf
            </span>
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => router.push('/library')}
              aria-label="Open Library"
              className="p-2 rounded-full hover:bg-surface-container-high/50 dark:hover:bg-surface-container/20 transition-colors flex items-center justify-center text-primary dark:text-inverse-primary"
            >
              <span className="material-symbols-outlined text-[22px]">auto_stories</span>
            </button>
            <button
              type="button"
              onClick={openImportModal}
              aria-label="Add Book"
              className="p-2 rounded-full hover:bg-surface-container-high/50 dark:hover:bg-surface-container/20 transition-colors flex items-center justify-center text-primary dark:text-inverse-primary"
            >
              <span className="material-symbols-outlined text-[22px]">add</span>
            </button>
          </div>
        </div>

        {/* Personalized Welcome Header */}
        <section className="px-5 md:px-8 pt-5 pb-3 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-[11px] tracking-widest text-secondary font-semibold uppercase">
              Sanctuary Reader
            </span>
            <h1 className="font-headline-md text-headline-md text-primary tracking-tight font-medium mt-0.5">
              {greeting}{userName || 'Reader'}
            </h1>
            <p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <Link href="/library" className="hover:text-primary transition-colors">
                {pluralize(books.length, 'volume')} in vault
              </Link>
              {vocabWords.length > 0 && (
                <>
                  <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                  <Link href="/vocabulary" className="hover:text-primary transition-colors">
                    {pluralize(vocabWords.length, 'lexicon card')}
                  </Link>
                </>
              )}
            </p>
          </div>
          <Link
            href="/settings"
            title="Profile & Settings"
            className="hidden md:flex relative w-11 h-11 rounded-full ring-2 ring-surface-container-lowest shadow-sm overflow-hidden shrink-0 bg-secondary-container text-on-secondary-container items-center justify-center font-bold text-sm hover:scale-105 transition-transform"
          >
            {userAvatar ? (
              <img
                alt={userName}
                className="w-full h-full object-cover"
                src={userAvatar}
              />
            ) : (
              <span>{(userName || 'R').slice(0, 2).toUpperCase()}</span>
            )}
          </Link>
        </section>

        {/* Loading Skeleton */}
        {loading && (
          <main className="px-5 md:px-8 space-y-5 pt-2 max-w-4xl mx-auto animate-pulse">
            <div className="bg-surface-container-lowest/80 rounded-3xl p-6 h-64 border border-black/5 flex flex-col justify-between">
              <div className="h-4 w-32 bg-surface-container-high rounded" />
              <div className="flex gap-4">
                <div className="w-32 aspect-[2/3] bg-surface-container-high rounded-md" />
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-3/4 bg-surface-container-high rounded" />
                  <div className="h-4 w-1/2 bg-surface-container-high rounded" />
                  <div className="h-10 w-full bg-surface-container-high rounded-xl mt-6" />
                </div>
              </div>
            </div>
            <div className="h-28 bg-surface-container-lowest/80 rounded-2xl border border-black/5" />
          </main>
        )}

        {/* Empty State when no books exist */}
        {!loading && books.length === 0 && (
          <main className="px-5 md:px-8 space-y-5 pt-4 max-w-4xl mx-auto">
            <section className="bg-surface-container-lowest/95 backdrop-blur-md rounded-3xl p-8 md:p-12 soft-editorial-shadow border border-black/5 text-center flex flex-col items-center justify-center my-6">
              <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center mb-5">
                <span className="material-symbols-outlined text-[32px]">auto_stories</span>
              </div>

              <span className="font-label-sm text-[11px] tracking-widest text-secondary font-semibold uppercase mb-1">
                Local-First Sanctuary
              </span>

              <h2 className="font-headline-lg text-headline-md sm:text-headline-lg text-primary font-medium tracking-tight mb-2">
                Welcome to Flyleaf
              </h2>

              <p className="font-body-ui text-body-ui text-on-surface-variant max-w-md leading-relaxed mb-8">
                Your quiet, private reading vault. Books, reading telemetry, and vocabulary stay entirely on this device.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm justify-center">
                <Link
                  href="/browse"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-primary text-on-primary font-body-ui-bold text-[14px] flex items-center justify-center gap-2 shadow-md hover:bg-primary-container active:scale-[0.98] transition-all"
                >
                  <span className="material-symbols-outlined text-[20px]">explore</span>
                  <span>Browse The Commons</span>
                </Link>

                <button
                  type="button"
                  onClick={openImportModal}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high active:scale-[0.98] transition-all font-body-ui-bold text-[14px] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[20px]">upload_file</span>
                  <span>Import an EPUB</span>
                </button>
              </div>
            </section>
          </main>
        )}

        {/* Populated Dashboard Content */}
        {!loading && books.length > 0 && currentHero && (
          <main className="px-5 md:px-8 space-y-5 pt-2 max-w-4xl mx-auto">
            {/* 1. HERO VIEW: Most Recently Read Book & Quick Resume */}
            <section className="bg-surface-container-lowest/95 backdrop-blur-md rounded-3xl p-5 md:p-6 soft-editorial-shadow border border-black/5 relative overflow-hidden transition-all duration-300">
              <div className="absolute -top-1 right-8 w-4 h-7 bg-secondary rounded-b-sm shadow-xs opacity-90"></div>

              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed/50 text-secondary border border-secondary/20">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    <span className="font-label-sm text-[11px] tracking-widest font-semibold uppercase">
                      Currently Reading
                    </span>
                  </div>

                  {/* Carousel Counter */}
                  <div className="inline-flex items-center gap-1 bg-surface-container-low px-2 py-0.5 rounded-full border border-outline-variant/30 text-[11px] font-label-sm text-on-surface-variant font-medium">
                    {carouselBooks.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setHeroIndex((i) =>
                            i > 0 ? i - 1 : carouselBooks.length - 1
                          )
                        }
                        className="hover:text-primary transition px-0.5"
                        title="Previous reading book"
                      >
                        ‹
                      </button>
                    )}
                    <span>
                      {heroIndex + 1}/{carouselBooks.length}
                    </span>
                    {carouselBooks.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setHeroIndex((i) =>
                            i < carouselBooks.length - 1 ? i + 1 : 0
                          )
                        }
                        className="hover:text-primary transition px-0.5"
                        title="Next reading book"
                      >
                        ›
                      </button>
                    )}
                  </div>
                </div>

                <Link
                  href="/library"
                  className="text-caption font-body-ui-bold text-on-surface-variant hover:text-primary transition-colors flex items-center gap-0.5"
                >
                  <span>Shelf View</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
              </div>

              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                {/* Cover Card */}
                <Link
                  href={`/reader/${encodeURIComponent(currentHero.id)}`}
                  className="relative shrink-0 w-32 sm:w-36 aspect-[2/3] cursor-pointer group block"
                >
                  {currentHero.hasBinary === false && (
                    <div className="absolute top-2 left-2 z-20 inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-sm border border-amber-500/40 text-[10px] font-label-sm text-amber-300 shadow-sm pointer-events-none">
                      <span className="material-symbols-outlined text-[12px]">cloud_off</span>
                      <span>Not downloaded</span>
                    </div>
                  )}
                  <BookCover
                    coverUrl={currentHero.coverUrl}
                    title={currentHero.title}
                    author={currentHero.author}
                    year={currentHero.year}
                    aspect="aspect-[2/3]"
                    priority={true}
                  />
                </Link>

                {/* Book Metadata & Reading Status */}
                <div className="flex flex-col flex-1 min-w-0 w-full justify-between self-stretch py-1">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-label-sm text-caption uppercase tracking-wider text-secondary font-semibold">
                        {currentHero.author || 'Unknown Author'}
                      </span>
                      {currentHero.hasBinary === false && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-label-sm bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                          <span className="material-symbols-outlined text-[12px]">cloud_off</span>
                          <span>Not downloaded</span>
                        </span>
                      )}
                      {currentHero.category && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-label-sm bg-surface-container text-on-surface-variant">
                          {currentHero.category}
                        </span>
                      )}
                    </div>
                    <Link href={`/reader/${encodeURIComponent(currentHero.id)}`}>
                      <h2 className="font-headline-lg text-headline-md sm:text-headline-lg text-primary font-medium leading-tight mb-2 hover:underline cursor-pointer">
                        {currentHero.title}
                      </h2>
                    </Link>
                    <p className="font-body-ui text-caption text-on-surface-variant mb-4 line-clamp-2">
                      {currentHero.currentChapter ||
                        currentHero.chapterHeading ||
                        currentHero.synopsis ||
                        `Continue reading ${currentHero.title}. Saved locally in vault.`}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline font-label-md text-label-md">
                        <span className="text-on-surface font-semibold">
                          {heroProgress}% completed
                        </span>
                        <span className="text-on-surface-variant text-caption">
                          {currentHero.currentPage
                            ? `Page ${currentHero.currentPage} of ${
                                currentHero.totalPages || currentHero.pages || '—'
                              }`
                            : pluralize(currentHero.totalPages || currentHero.pages || 0, 'page')}
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#E2EBF1] dark:bg-surface-container-highest overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full transition-all duration-500 shadow-xs"
                          style={{ width: `${Math.max(4, heroProgress)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Resume Reading CTA */}
                    <Link
                      href={`/reader/${currentHero.id}`}
                      className="w-full bg-primary text-on-primary py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-md hover:bg-primary-container active:scale-[0.98] transition-all duration-150"
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        auto_stories
                      </span>
                      <span className="font-body-ui-bold text-[15px] tracking-wide">
                        Resume Reading ({heroProgress}%)
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. STATS STRIP (from getStatsSummary) */}
            <section
              onClick={() => router.push('/stats')}
              className="bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-4 soft-editorial-shadow border border-black/5 cursor-pointer hover:border-outline-variant/40 transition-all"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">
                    local_fire_department
                  </span>
                  <span className="font-label-sm text-label-sm text-primary tracking-wider font-semibold uppercase">
                    Daily Streak &amp; Momentum
                  </span>
                </div>
                <span className="text-caption font-body-ui-bold text-secondary hover:underline flex items-center gap-0.5">
                  <span>Detailed Stats</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>

              <div className="grid grid-cols-3 divide-x divide-outline-variant/30 text-center py-2 bg-surface-container-low/50 rounded-xl mb-3">
                <div className="px-2">
                  <div className="font-headline-sm text-headline-sm text-primary font-medium flex items-center justify-center gap-1">
                    <span>{currentStreak}</span>
                    <span className="text-[16px]">🔥</span>
                  </div>
                  <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                    Days Streak
                  </div>
                </div>
                <div className="px-2">
                  <div className="font-headline-sm text-headline-sm text-primary font-medium">
                    {formatReadingTime(thisWeekSeconds)}
                  </div>
                  <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                    This Week
                  </div>
                </div>
                <div className="px-2">
                  <div className="font-headline-sm text-headline-sm text-primary font-medium">
                    {formatReadingTime(totalSeconds)}
                  </div>
                  <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                    All Time
                  </div>
                </div>
              </div>

              {/* 7-Day Visual Activity Dots */}
              <div className="flex items-center justify-between px-2 pt-1">
                {(stats?.weeklyDays || [
                  { label: 'M', active: false },
                  { label: 'T', active: false },
                  { label: 'W', active: false },
                  { label: 'T', active: false },
                  { label: 'F', active: false },
                  { label: 'S', active: false },
                  { label: 'S', active: false },
                ]).map((day, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-label-sm font-semibold transition-all ${
                        day.active
                          ? 'bg-secondary text-on-secondary shadow-xs ring-2 ring-secondary/20'
                          : 'bg-surface-container text-on-surface-variant/50'
                      }`}
                    >
                      {day.active ? '✓' : day.label}
                    </div>
                    <span className="text-[10px] font-caption text-on-surface-variant">
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. "LOOK WHAT FELL OUT" (Hidden if none) */}
            {fellOutItem && (
              <section className="bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-5 soft-editorial-shadow border border-black/5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-500">
                      bookmarks
                    </span>
                    <span className="font-label-sm text-label-sm text-primary tracking-wider font-semibold uppercase">
                      Look what fell out
                    </span>
                  </div>
                  {fellOutItem.type === 'vocab' ? (
                    <Link
                      href="/vocabulary"
                      className="text-caption font-body-ui-bold text-secondary hover:underline flex items-center gap-0.5"
                    >
                      <span>Vocabulary</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  ) : (
                    fellOutItem.bookId && (
                      <Link
                        href={`/reader/${fellOutItem.bookId}`}
                        className="text-caption font-body-ui-bold text-secondary hover:underline flex items-center gap-0.5"
                      >
                        <span>Open Book</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    )
                  )}
                </div>

                {fellOutItem.type === 'highlight' ? (
                  <div className="space-y-2">
                    <p className="font-serif italic text-[15px] sm:text-base text-on-surface leading-relaxed border-l-2 border-secondary/60 pl-3">
                      “{fellOutItem.text}”
                    </p>
                    <p className="font-caption text-caption text-on-surface-variant pl-3">
                      — {fellOutItem.chapter ? `${fellOutItem.chapter} · ` : ''}
                      {fellOutItem.bookTitle}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-headline-sm text-headline-sm text-primary font-semibold">
                        {fellOutItem.word}
                      </span>
                      {fellOutItem.phonetic && (
                        <span className="font-mono text-caption text-outline">
                          {fellOutItem.phonetic}
                        </span>
                      )}
                      {fellOutItem.partOfSpeech && (
                        <span className="font-label-sm text-[10px] uppercase px-1.5 py-0.5 bg-surface-container-high rounded text-on-surface-variant">
                          {fellOutItem.partOfSpeech}
                        </span>
                      )}
                    </div>
                    {fellOutItem.definition && (
                      <p className="font-body-ui text-caption text-on-surface-variant leading-relaxed">
                        {fellOutItem.definition}
                      </p>
                    )}
                    {fellOutItem.contextSentence && (
                      <p className="font-serif italic text-caption text-on-surface/80 pt-1 border-t border-outline-variant/20">
                        “{fellOutItem.contextSentence}”
                      </p>
                    )}
                    <p className="font-caption text-[11px] text-secondary pt-0.5">
                      Saved from {fellOutItem.bookTitle}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* 4. RECENT VOCABULARY (Real vocabulary only, hidden if none) */}
            {recentLookups.length > 0 && (
              <section className="bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-5 soft-editorial-shadow border border-black/5">
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-secondary/10 text-secondary flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">style</span>
                    </div>
                    <div>
                      <h3 className="font-headline-sm text-[17px] text-primary font-medium">
                        Recent Vocabulary Lookups
                      </h3>
                      <p className="font-caption text-[11px] text-on-surface-variant">
                        Saved from your reading sessions with definitions &amp; context
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/vocabulary"
                    className="text-caption font-body-ui-bold text-secondary hover:underline flex items-center gap-0.5 shrink-0"
                  >
                    <span>Deck ({vocabWords.length})</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recentLookups.map((w) => (
                    <div
                      key={w.id || w.word}
                      onClick={() => router.push('/vocabulary')}
                      className="p-3.5 rounded-xl bg-surface-container-low/70 border border-outline-variant/30 hover:border-secondary/40 hover:bg-surface-container cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="font-headline-sm text-[16px] text-primary font-semibold">
                            {w.word}
                          </span>
                          <span className="font-label-sm text-[10px] uppercase px-1.5 py-0.5 bg-surface-container-high rounded text-on-surface-variant">
                            {w.partOfSpeech || 'term'}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-outline block mb-1.5">
                          {w.phonetic || '/—/'}
                        </span>
                        <p className="font-body-ui text-[12.5px] leading-snug text-on-surface-variant line-clamp-2">
                          {w.definition || w.definitions?.[0] || 'Saved literary definition'}
                        </p>
                      </div>
                      {w.bookTitle && (
                        <div className="mt-2.5 pt-2 border-t border-outline-variant/20 flex items-center justify-between text-[11px] font-caption text-secondary">
                          <span className="truncate max-w-[140px]">{w.bookTitle}</span>
                          <span className="material-symbols-outlined text-[13px]">school</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-3.5 pt-3 border-t border-outline-variant/20 flex items-center justify-between">
                  <span className="font-caption text-[11px] text-on-surface-variant">
                    Highlight any word in the reader to auto-lookup and save
                  </span>
                  <Link
                    href="/vocabulary"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 text-caption font-body-ui-bold transition-colors"
                  >
                    <span className="material-symbols-outlined text-[15px]">quiz</span>
                    <span>Quiz Deck</span>
                  </Link>
                </div>
              </section>
            )}

            {/* 5. OTHER VOLUMES ON YOUR DESK */}
            {otherBooks.length > 0 && (
              <section className="bg-surface-container-lowest/80 backdrop-blur-md rounded-2xl p-5 soft-editorial-shadow border border-black/5">
                <div className="flex items-center justify-between mb-3.5">
                  <h3 className="font-headline-sm text-[17px] text-primary font-medium">
                    Also On Your Desk
                  </h3>
                  <Link
                    href="/library"
                    className="text-caption font-body-ui-bold text-secondary hover:underline flex items-center gap-0.5"
                  >
                    <span>All ({books.length})</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {otherBooks.map((b) => {
                    const pct =
                      b.progressPercentage !== undefined
                        ? b.progressPercentage
                        : b.progress !== undefined
                        ? b.progress
                        : 0;
                    return (
                      <Link
                        key={b.id}
                        href={`/reader/${encodeURIComponent(b.id)}`}
                        className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container transition-all flex items-center gap-3 group"
                      >
                        <div className="relative w-12 aspect-[2/3] shrink-0">
                          {b.hasBinary === false && (
                            <div
                              className="absolute top-1 left-1 z-20 w-4 h-4 rounded-full bg-black/85 border border-amber-500/50 flex items-center justify-center text-amber-300 pointer-events-none"
                              title="Not downloaded"
                            >
                              <span className="material-symbols-outlined text-[10px]">cloud_off</span>
                            </div>
                          )}
                          <BookCover
                            coverUrl={b.coverUrl}
                            title={b.title}
                            author={b.author}
                            year={b.year}
                            aspect="aspect-[2/3]"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-headline-sm text-[14px] text-primary font-medium truncate group-hover:underline">
                            {b.title}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="font-caption text-[11px] text-on-surface-variant truncate">
                              {b.author}
                            </p>
                            {b.hasBinary === false && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-[9px] font-label-sm text-amber-600 dark:text-amber-400 shrink-0">
                                <span className="material-symbols-outlined text-[10px]">cloud_off</span>
                                <span>Not downloaded</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-16 h-1 rounded-full bg-surface-container-high overflow-hidden">
                              <div
                                className="h-full bg-secondary rounded-full"
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-label-sm text-secondary font-semibold">
                              {pct}%
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </main>
        )}

        {/* Floating Add Book Button */}
        <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40">
          <button
            type="button"
            onClick={openImportModal}
            aria-label="Import EPUB Book"
            title="Import EPUB or TXT file"
            className="w-12 h-12 rounded-full bg-primary text-on-primary shadow-lg shadow-primary/25 flex items-center justify-center hover:bg-primary-container active:scale-95 transition-all subtle-paper-border"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
