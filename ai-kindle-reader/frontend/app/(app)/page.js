'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { getAllBooks, getReadingStats, getAllVocabularyWords } from '@/utils/db';
import { BOOKS } from '@/utils/booksData';
import BookCover from '@/components/BookCover';

export default function HomePage() {
  const router = useRouter();
  const { userName, openImportModal } = useTheme();

  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [vocabWords, setVocabWords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeDashboard() {
      try {
        const [vaultBooks, readingTelemetry, savedVocab] = await Promise.all([
          getAllBooks(),
          getReadingStats(),
          getAllVocabularyWords(),
        ]);

        if (isMounted) {
          // Fallback to static BOOKS if IndexedDB is entirely empty
          const loadedBooks =
            vaultBooks && vaultBooks.length > 0 ? vaultBooks : BOOKS;
          setBooks(loadedBooks);
          setStats(readingTelemetry);
          setVocabWords(savedVocab || []);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[Home Dashboard] Failed loading vault data:', err);
        if (isMounted) {
          setBooks(BOOKS);
          setLoading(false);
        }
      }
    }

    loadHomeDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // #1 most recently opened book from getAllBooks()
  const heroBook = books[0] || BOOKS[0];
  const heroProgress =
    heroBook?.progressPercentage !== undefined
      ? heroBook.progressPercentage
      : heroBook?.progress !== undefined
      ? heroBook.progress
      : 42;

  const otherBooks = books.slice(1, 4);

  // Recent AI vocabulary words (last 3-4 entries)
  const recentLookups =
    vocabWords.length > 0
      ? vocabWords.slice(0, 3)
      : [
          {
            id: 'monomania',
            word: 'monomania',
            phonetic: '/ˌmɒn.əˈmeɪ.ni.ə/',
            partOfSpeech: 'noun',
            definitions: ['An exaggerated or obsessive enthusiasm for or preoccupation with one thing.'],
            bookTitle: 'Pride and Prejudice',
          },
          {
            id: 'interiority',
            word: 'interiority',
            phonetic: '/ɪnˌtɪə.riˈɒr.ə.ti/',
            partOfSpeech: 'noun',
            definitions: ['The inner life or psychological substance of a character.'],
            bookTitle: 'Piranesi',
          },
          {
            id: 'stratification',
            word: 'stratification',
            phonetic: '/ˌstræt.ɪ.fɪˈkeɪ.ʃən/',
            partOfSpeech: 'noun',
            definitions: ['The arrangement or classification of something into different groups or social layers.'],
            bookTitle: 'Jane Eyre',
          },
        ];

  return (
    <div className="min-h-dvh bg-surface text-on-surface antialiased selection:bg-secondary-container/40 selection:text-secondary">
      <div className="w-full relative flex-col bg-gradient-to-b from-[#DCE9F5] dark:from-[#1c2438] via-surface-bright to-surface pb-32 md:pb-12">
        {/* Mobile Top Navigation Bar */}
        <div className="md:hidden bg-surface/85 dark:bg-inverse-surface/85 backdrop-blur-md text-primary dark:text-inverse-primary docked full-width top-0 sticky z-40 shadow-xs flex justify-between items-center w-full px-5 py-3">
          <Link href="/settings" className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full overflow-hidden border border-black/10 shadow-xs">
              <img
                alt="Flyleaf profile avatar"
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida/AEtjO1UM82GOerrlrIjTHN3MQ0coHeRBhe1Xnxz6SbqF7RFCOrdzEQrw0OascZ9JCl8ESF16dK7SzVI6RfEoiagVAts-TGRT__BTx4cJzDY37szTssh_N_uopDZCcPTnF7UI_ErGXSGpdyvq6BPsvEv3-HA76moihGHwcapgFent3mVDcOt_LNSzeY3cb7ws7pqgw8No44XAT4hsjDwFGXIKHm2okxv1coDeJcX-qt1IDWHsQtGkcpWXxcy4XA"
              />
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
              Still awake, {userName}
            </h1>
            <p className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1.5 mt-0.5">
              <Link href="/library" className="hover:text-primary transition-colors">
                {books.length} volumes in vault
              </Link>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <Link href="/vocabulary" className="hover:text-primary transition-colors">
                {vocabWords.length} lexicon cards
              </Link>
            </p>
          </div>
          <Link
            href="/settings"
            title="Profile & Settings"
            className="hidden md:flex relative w-11 h-11 rounded-full ring-2 ring-surface-container-lowest shadow-sm overflow-hidden shrink-0 hover:scale-105 transition-transform"
          >
            <img
              alt="Reader profile portrait"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida/AEtjO1UM82GOerrlrIjTHN3MQ0coHeRBhe1Xnxz6SbqF7RFCOrdzEQrw0OascZ9JCl8ESF16dK7SzVI6RfEoiagVAts-TGRT__BTx4cJzDY37szTssh_N_uopDZCcPTnF7UI_ErGXSGpdyvq6BPsvEv3-HA76moihGHwcapgFent3mVDcOt_LNSzeY3cb7ws7pqgw8No44XAT4hsjDwFGXIKHm2okxv1coDeJcX-qt1IDWHsQtGkcpWXxcy4XA"
            />
          </Link>
        </section>

        {/* Main Dashboard Content */}
        <main className="px-5 md:px-8 space-y-5 pt-2 max-w-4xl mx-auto">
          {/* 1. HERO VIEW: Currently Reading & Quick Resume */}
          <section className="bg-surface-container-lowest/95 backdrop-blur-md rounded-3xl p-5 md:p-6 soft-editorial-shadow border border-black/5 relative overflow-hidden transition-all duration-300">
            {/* Bookmark ribbon accent */}
            <div className="absolute -top-1 right-8 w-4 h-7 bg-secondary rounded-b-sm shadow-xs opacity-90"></div>

            <div className="flex items-center justify-between mb-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed/50 text-secondary border border-secondary/20">
                <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                <span className="font-label-sm text-[11px] tracking-widest font-semibold uppercase">
                  Currently Reading · Quick Resume
                </span>
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
              <div
                onClick={() => router.push(`/reader/${heroBook.id}`)}
                className="relative shrink-0 w-32 sm:w-36 aspect-[2/3] cursor-pointer group"
              >
                <BookCover
                  coverUrl={heroBook.coverUrl}
                  title={heroBook.title}
                  author={heroBook.author}
                  year={heroBook.year}
                  aspect="aspect-[2/3]"
                  priority={true}
                />
              </div>

              {/* Book Metadata & Reading Status */}
              <div className="flex flex-col flex-1 min-w-0 w-full justify-between self-stretch py-1">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-label-sm text-caption uppercase tracking-wider text-secondary font-semibold">
                      {heroBook.author || 'Unknown Author'}
                    </span>
                    {heroBook.category && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-label-sm bg-surface-container text-on-surface-variant">
                        {heroBook.category}
                      </span>
                    )}
                  </div>
                  <h2
                    onClick={() => router.push(`/reader/${heroBook.id}`)}
                    className="font-headline-lg text-headline-md sm:text-headline-lg text-primary font-medium leading-tight mb-2 cursor-pointer hover:underline"
                  >
                    {heroBook.title}
                  </h2>
                  <p className="font-body-ui text-caption text-on-surface-variant mb-4 line-clamp-2">
                    {heroBook.chapterHeading ||
                      heroBook.synopsis ||
                      `Continue your immersive session in ${heroBook.title}. Synced with local IndexedDB storage.`}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-baseline font-label-md text-label-md">
                      <span className="text-on-surface font-semibold">
                        {heroProgress}% completed
                      </span>
                      <span className="text-on-surface-variant text-caption">
                        {heroBook.currentPage
                          ? `Page ${heroBook.currentPage} of ${heroBook.pages || 350}`
                          : `${heroBook.pages || 350} pages`}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#E2EBF1] dark:bg-surface-container-highest overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full transition-all duration-500 shadow-xs"
                        style={{ width: `${Math.max(4, heroProgress)}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Prominent "Continue Reading (42%)" CTA */}
                  <Link
                    href={`/reader/${heroBook.id}`}
                    className="w-full bg-primary text-on-primary py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2.5 shadow-md hover:bg-primary-container active:scale-[0.98] transition-all duration-150"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      auto_stories
                    </span>
                    <span className="font-body-ui-bold text-[15px] tracking-wide">
                      Continue Reading ({heroProgress}%)
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 2. COMPACT DAILY READING STREAK WIDGET */}
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
                  <span>{stats?.currentStreak || 6}</span>
                  <span className="text-[16px]">🔥</span>
                </div>
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                  Days Streak
                </div>
              </div>
              <div className="px-2">
                <div className="font-headline-sm text-headline-sm text-primary font-medium">
                  {stats ? `${stats.weeklyHours || 1}h ${stats.weeklyMinutes || 24}m` : '1h 24m'}
                </div>
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                  This Week
                </div>
              </div>
              <div className="px-2">
                <div className="font-headline-sm text-headline-sm text-primary font-medium">
                  {stats ? `${stats.totalHours || 87}h` : '87h'}
                </div>
                <div className="font-label-sm text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                  All Time
                </div>
              </div>
            </div>

            {/* 7-Day Visual Activity Dots */}
            <div className="flex items-center justify-between px-2 pt-1">
              {(stats?.weeklyDays || [
                { label: 'M', active: true, minutes: 24 },
                { label: 'T', active: true, minutes: 18 },
                { label: 'W', active: true, minutes: 20 },
                { label: 'T', active: true, minutes: 15 },
                { label: 'F', active: true, minutes: 25 },
                { label: 'S', active: true, minutes: 30 },
                { label: 'S', active: false, minutes: 0 },
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

          {/* 3. RECENT AI VOCABULARY LOOKUPS */}
          <section className="bg-surface-container-lowest/90 backdrop-blur-md rounded-2xl p-5 soft-editorial-shadow border border-black/5">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-secondary/10 text-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">style</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-[17px] text-primary font-medium">
                    Recent AI Vocabulary Lookups
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
                      <span className="font-label-sm text-[10px] uppercase px-1.5 py-0.2 bg-surface-container-high rounded text-on-surface-variant">
                        {w.partOfSpeech || 'term'}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-outline block mb-1.5">
                      {w.phonetic || '/—/'}
                    </span>
                    <p className="font-body-ui text-[12.5px] leading-snug text-on-surface-variant line-clamp-2">
                      {w.definitions?.[0] || 'Saved literary definition'}
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

          {/* 4. OTHER VOLUMES ON YOUR DESK */}
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
                      href={`/reader/${b.id}`}
                      className="p-3 rounded-xl bg-surface-container-low/50 border border-outline-variant/20 hover:border-outline-variant/40 hover:bg-surface-container transition-all flex items-center gap-3 group"
                    >
                      <div className="w-12 aspect-[2/3] shrink-0">
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
                        <p className="font-caption text-[11px] text-on-surface-variant truncate">
                          {b.author}
                        </p>
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
