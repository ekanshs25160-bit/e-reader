'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBookById, BOOKS } from '@/utils/booksData';
import {
  getBook,
  getBookFile,
  saveProgress,
  getProgress,
  addBookmark,
  removeBookmark,
  getBookmarks,
  saveVocabularyWord,
  logReadingSession,
} from '@/utils/db';
import { useTheme } from '@/components/common/ThemeProvider';
import ReaderCanvas from '@/components/ReaderCanvas';
import AiDrawer from '@/components/AiDrawer';
import SettingsMenu, { PALETTES, TYPEFACES } from '@/components/SettingsMenu';

const HIGHLIGHT_COLORS = [
  { id: 'ochre', bg: 'bg-[#F3D382]', highlightClass: 'bg-[#F3D382]/60 border-[#b87d4b]' },
  { id: 'rose', bg: 'bg-[#F8B4B4]', highlightClass: 'bg-[#F8B4B4]/60 border-rose-500' },
  { id: 'sky', bg: 'bg-[#A7D2FB]', highlightClass: 'bg-[#A7D2FB]/60 border-sky-600' },
  { id: 'sage', bg: 'bg-[#B7DEBD]', highlightClass: 'bg-[#B7DEBD]/60 border-emerald-600' },
];

const DEFAULT_CHAPTERS = [
  { num: 'CHAPTER I.', title: 'First Impressions & Opening Scene', page: 3 },
  { num: 'CHAPTER II.', title: 'Evening Visit & Social Obligation', page: 18 },
  { num: 'CHAPTER III.', title: 'The Assembly Room Conversation', page: 34 },
  { num: 'CHAPTER IV.', title: 'Private Reflections in the Study', page: 56 },
  { num: 'CHAPTER V.', title: 'Letters & Morning Walk', page: 78 },
];

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { showToast, isNight } = useTheme();
  const readerCanvasRef = useRef(null);

  // Initialize with static fallback so SSR and first paint are immediate
  const initialBook =
    BOOKS.find(
      (b) =>
        b.id === String(params?.id || '').toLowerCase() ||
        b.gutenbergId === String(params?.id || '')
    ) || getBookById('pride-and-prejudice');

  const [book, setBook] = useState(initialBook);
  const [bookBinary, setBookBinary] = useState(null);
  const [currentCfi, setCurrentCfi] = useState(null);
  const [chapters, setChapters] = useState(DEFAULT_CHAPTERS);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  const [bookmarked, setBookmarked] = useState(false);
  const [currentBookmarkId, setCurrentBookmarkId] = useState(null);
  const [popoverOpen, setPopoverOpen] = useState(true);
  const [highlightColor, setHighlightColor] = useState('ochre');
  const [underlined, setUnderlined] = useState(false);

  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiTab, setAiTab] = useState('subtext');
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [scrubberOpen, setScrubberOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');

  const [currentPage, setCurrentPage] = useState(book.currentPage || 3);
  const [activeChapter, setActiveChapter] = useState(DEFAULT_CHAPTERS[0]);
  const sessionSecondsRef = useRef(0);
  const pagesFlippedRef = useRef(0);
  const [dynamicLookup, setDynamicLookup] = useState(null);

  // Live Reading Telemetry Session Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        sessionSecondsRef.current += 1;
      }
    }, 1000);

    const flushTimer = setInterval(() => {
      if (sessionSecondsRef.current >= 5) {
        logReadingSession({
          bookId: book.id,
          bookTitle: book.title,
          durationSeconds: sessionSecondsRef.current,
          pagesFlipped: pagesFlippedRef.current,
        });
        sessionSecondsRef.current = 0;
        pagesFlippedRef.current = 0;
      }
    }, 45000);

    return () => {
      clearInterval(timer);
      clearInterval(flushTimer);
      if (sessionSecondsRef.current >= 2) {
        logReadingSession({
          bookId: book.id,
          bookTitle: book.title,
          durationSeconds: sessionSecondsRef.current,
          pagesFlipped: pagesFlippedRef.current,
        });
      }
    };
  }, [book.id, book.title]);

  const [readerSettings, setReaderSettings] = useState({
    palette: isNight ? 'night' : 'paper',
    fontSize: 18.5,
    typeface: 'literata',
    align: 'justify',
    lineHeight: '1.75',
    margins: 'normal',
    ambientSound: 'off',
  });

  // Load book metadata, binary EPUB file, and previous progress from IndexedDB
  useEffect(() => {
    let isMounted = true;
    const bookId = String(params?.id || '').toLowerCase();

    async function loadFromVault() {
      try {
        const dbBook = await getBook(bookId);
        if (dbBook && isMounted) {
          setBook((prev) => ({
            ...prev,
            ...dbBook,
            pages: dbBook.pages || prev.pages || 100,
            highlightedWord: dbBook.highlightedWord || prev.highlightedWord,
            paragraphs: dbBook.paragraphs || prev.paragraphs || [],
          }));
        }

        const file = await getBookFile(bookId);
        if (file && isMounted) {
          setBookBinary(file);
        }

        const progress = await getProgress(bookId);
        if (progress && isMounted) {
          if (progress.page) setCurrentPage(progress.page);
          if (progress.cfi) setCurrentCfi(progress.cfi);
          if (progress.chapter) {
            setActiveChapter((ch) => ({ ...ch, title: progress.chapter }));
          }
        }

        const savedBookmarks = await getBookmarks(bookId);
        if (savedBookmarks?.length && isMounted) {
          const match = savedBookmarks.find(
            (b) => b.page === (progress?.page || 1) || (progress?.cfi && b.cfi === progress.cfi)
          );
          if (match) {
            setBookmarked(true);
            setCurrentBookmarkId(match.id);
          }
        }
      } catch (err) {
        console.warn('[Flyleaf Reader] Error fetching from IndexedDB vault:', err);
      }
    }

    loadFromVault();
    return () => {
      isMounted = false;
    };
  }, [params?.id]);

  const activePalette = PALETTES.find((p) => p.id === readerSettings.palette) || PALETTES[0];
  const activeTypeface = TYPEFACES.find((t) => t.id === readerSettings.typeface) || TYPEFACES[0];
  const activeHighlight =
    HIGHLIGHT_COLORS.find((c) => c.id === highlightColor) || HIGHLIGHT_COLORS[0];

  const totalPages = book.pages || 100;
  const progressPct = Math.max(1, Math.min(100, Math.round((currentPage / totalPages) * 100)));

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/library');
    }
  };

  const openAiWithTab = (tab) => {
    setAiTab(tab);
    setAiDrawerOpen(true);
  };

  // Callback when EPUB reader relocates / turns page
  const handleLocationChange = useCallback(
    async ({ cfi, percentage, chapter }) => {
      if (cfi) setCurrentCfi(cfi);
      if (percentage !== undefined && percentage !== null) {
        const estPage = Math.max(1, Math.min(totalPages, Math.round((percentage / 100) * totalPages)));
        setCurrentPage(estPage);
      }
      if (chapter) {
        setActiveChapter((prev) => ({
          ...prev,
          title: typeof chapter === 'string' ? chapter : chapter.label || prev.title,
        }));
      }
      await saveProgress(book.id, {
        cfi,
        percentage,
        page: currentPage,
        chapter: typeof chapter === 'string' ? chapter : chapter?.label || activeChapter.title,
      });
    },
    [book.id, totalPages, currentPage, activeChapter.title]
  );

  // Callback when EPUB navigation spine is parsed
  const handleReaderReady = useCallback((readyData) => {
    if (readyData?.navigation?.toc?.length) {
      const generatedChapters = readyData.navigation.toc.map((item, idx) => ({
        num: `SECTION ${idx + 1}`,
        title: item.label ? item.label.trim() : `Section ${idx + 1}`,
        href: item.href,
        page: idx + 1,
      }));
      setChapters(generatedChapters);
      if (generatedChapters[0]) {
        setActiveChapter(generatedChapters[0]);
      }
    }
  }, []);

  // Callback when text is selected inside the EPUB canvas
  const handleTextSelected = useCallback(async (text, cfiRange) => {
    if (text) {
      setSelectedSnippet({ text, cfiRange });
      const clean = text.replace(/^[“"']+|[”"'.?!,;:\s]+$/g, '').trim();
      if (clean && clean.split(/\s+/).length <= 3) {
        try {
          const res = await fetch(
            `http://localhost:8000/api/lookup/define?word=${encodeURIComponent(clean.toLowerCase())}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data?.data) {
              setDynamicLookup(data.data);
            }
          }
        } catch {
          setDynamicLookup(null);
        }
      } else {
        setDynamicLookup(null);
      }
    }
  }, []);

  // Navigation handlers with telemetry tracking
  const handlePrevPage = () => {
    pagesFlippedRef.current += 1;
    if (bookBinary && readerCanvasRef.current) {
      readerCanvasRef.current.prev();
    } else {
      setCurrentPage((p) => Math.max(1, p - 1));
    }
  };

  const handleNextPage = () => {
    pagesFlippedRef.current += 1;
    if (bookBinary && readerCanvasRef.current) {
      readerCanvasRef.current.next();
    } else {
      setCurrentPage((p) => Math.min(totalPages, p + 1));
    }
  };

  const handleScrubberChange = (val) => {
    const pageNum = Number(val);
    setCurrentPage(pageNum);
    if (bookBinary && readerCanvasRef.current && totalPages > 0) {
      const pct = Math.round((pageNum / totalPages) * 100);
      readerCanvasRef.current.goToPercentage(pct);
    }
    saveProgress(book.id, {
      page: pageNum,
      percentage: Math.round((pageNum / totalPages) * 100),
      cfi: currentCfi,
    });
  };

  // Bookmark toggle
  const handleToggleBookmark = async () => {
    if (!bookmarked) {
      const newBm = await addBookmark(book.id, {
        page: currentPage,
        cfi: currentCfi,
        title: activeChapter.title,
        excerpt: selectedSnippet?.text || book.highlightedWord?.quote || '',
      });
      setBookmarked(true);
      setCurrentBookmarkId(newBm?.id || null);
      showToast(`Bookmarked page ${currentPage}`);
    } else {
      if (currentBookmarkId) {
        await removeBookmark(book.id, currentBookmarkId);
      }
      setBookmarked(false);
      setCurrentBookmarkId(null);
      showToast('Bookmark removed');
    }
  };

  return (
    <div
      className="min-h-dvh antialiased selection:bg-secondary-fixed selection:text-on-secondary-fixed transition-colors duration-200"
      style={{
        backgroundColor: activePalette.readerBg,
        color: activePalette.readerText,
      }}
    >
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-30 flex justify-between items-center px-gutter h-14 bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md border-b border-outline-variant/30 dark:border-outline-variant/10 shadow-sm transition-all duration-200">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="w-9 h-9 rounded-full flex items-center justify-center text-primary dark:text-inverse-primary hover:bg-surface-container-high/50 dark:hover:bg-surface-variant/30 active:scale-95 transition-transform duration-150"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>

        <button
          type="button"
          onClick={() => setTocOpen(true)}
          className="flex items-center px-3.5 py-1 rounded-full bg-surface-container-low/70 border border-outline-variant/20 shadow-xs hover:bg-surface-container transition-colors max-w-[65%]"
        >
          <span className="font-headline-sm text-label-md text-primary dark:text-inverse-primary tracking-normal font-medium truncate">
            {book.title}
          </span>
          <span className="mx-1.5 text-outline-variant text-[10px] shrink-0">•</span>
          <span className="font-label-md text-caption text-on-surface-variant truncate">
            {book.author}
          </span>
        </button>

        <button
          type="button"
          onClick={handleToggleBookmark}
          aria-label="Bookmark this page"
          className="w-9 h-9 rounded-full flex items-center justify-center text-primary dark:text-inverse-primary hover:bg-surface-container-high/50 dark:hover:bg-surface-variant/30 active:scale-95 transition-transform duration-150"
        >
          <span
            className={`material-symbols-outlined ${bookmarked ? 'text-secondary' : ''}`}
            style={bookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
          >
            bookmark
          </span>
        </button>
      </header>

      {/* Find within text overlay */}
      {findOpen && (
        <div className="fixed top-14 inset-x-0 z-30 bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/30 px-4 py-2 flex items-center justify-center">
          <div className="w-full max-w-md flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-outline">search</span>
            <input
              type="text"
              value={findQuery}
              onChange={(e) => setFindQuery(e.target.value)}
              placeholder={`Find in ${book.title}...`}
              autoFocus
              className="flex-1 bg-transparent border-0 text-sm text-on-surface focus:ring-0 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setFindOpen(false);
                setFindQuery('');
              }}
              className="text-caption text-secondary font-medium px-2 py-0.5 rounded hover:bg-surface-container"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Main Reading Canvas & Focus Area */}
      <main
        className={`w-full mx-auto pt-20 pb-24 px-6 sm:px-8 select-text transition-all ${
          readerSettings.margins === 'compact'
            ? 'max-w-[76ch] md:max-w-[48rem]'
            : readerSettings.margins === 'wide'
            ? 'max-w-[58ch] md:max-w-[34rem]'
            : 'max-w-[68ch] md:max-w-[40rem] lg:max-w-[44rem]'
        }`}
      >
        <ReaderCanvas
          ref={readerCanvasRef}
          file={bookBinary}
          initialCfi={currentCfi}
          settings={readerSettings}
          onLocationChange={handleLocationChange}
          onTextSelected={handleTextSelected}
          onReady={handleReaderReady}
          fallbackContent={book}
        >
          {/* Fallback typography and interactive lexicon card for built-in sample classics */}
          <header className="text-center my-10 space-y-2">
            <div className="inline-flex items-center justify-center">
              <span className="text-secondary/70 font-label-sm tracking-widest text-caption uppercase">
                {book.chapterLabel || 'Chapter'}
              </span>
            </div>
            <h1
              className="font-headline-lg text-headline-lg tracking-tight font-normal"
              style={{ color: activePalette.readerText }}
            >
              {activeChapter.num}
            </h1>
            <div className="w-12 h-px bg-outline-variant/40 mx-auto mt-4"></div>
          </header>

          <article
            className="relative"
            style={{
              fontFamily: activeTypeface.family,
              fontSize: `${readerSettings.fontSize}px`,
              lineHeight: readerSettings.lineHeight,
              textAlign: readerSettings.align,
              color: activePalette.readerText,
            }}
          >
            {book.highlightedWord && (
              <p className="book-paragraph-first mb-5">
                <span className="float-left text-5xl font-headline-lg leading-none pt-1 pr-3 font-normal">
                  I
                </span>
                t is a truth universally{' '}
                <span
                  onClick={() => setPopoverOpen((v) => !v)}
                  title="Click to toggle lexicon & highlight card"
                  className={`cursor-pointer relative inline-block ${activeHighlight.highlightClass} rounded-sm px-1 py-0.5 mx-0.5 font-medium border-b-2 shadow-xs ${
                    underlined ? 'underline decoration-2' : ''
                  }`}
                >
                  <span className="absolute -top-1.5 -left-1.5 w-2.5 h-2.5 bg-secondary rounded-full flex items-center justify-center ring-2 ring-surface"></span>
                  {book.highlightedWord.word}
                  <span className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-secondary rounded-full flex items-center justify-center ring-2 ring-surface"></span>
                </span>
                , that a single man in possession of a good fortune, must be in want of a wife.
              </p>
            )}

            {popoverOpen && book.highlightedWord && (
              <section className="my-6 mb-8 mx-auto max-w-sm rounded-xl bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/30 editorial-shadow transition-all duration-200 overflow-hidden relative z-20 text-left text-on-surface font-body-ui">
                <div className="w-3 h-3 bg-surface-container-lowest border-t border-l border-outline-variant/30 transform rotate-45 mx-auto -mt-1.5 shadow-sm"></div>
                <div className="px-4 py-3 border-b border-outline-variant/20 bg-surface-container-low/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline space-x-2">
                      <span className="font-headline-md text-headline-sm text-primary font-medium tracking-tight">
                        {book.highlightedWord.word}
                      </span>
                      <span className="font-label-sm text-caption text-on-surface-variant font-mono">
                        {book.highlightedWord.phonetic}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          showToast(`Pronouncing "${book.highlightedWord.word}"`)
                        }
                        aria-label="Listen to pronunciation"
                        className="text-on-surface-variant hover:text-primary transition-colors p-0.5 rounded-full inline-flex items-center"
                      >
                        <span className="material-symbols-outlined text-[16px]">volume_up</span>
                      </button>
                    </div>
                    <span className="inline-flex px-2 py-0.5 rounded-full font-label-sm text-[10px] tracking-wide bg-surface-container-high text-on-surface-variant uppercase">
                      {book.highlightedWord.partOfSpeech}
                    </span>
                  </div>
                  <ol className="mt-2.5 space-y-1.5 text-caption font-body-ui text-on-surface-variant list-decimal list-inside leading-snug">
                    {book.highlightedWord.definitions?.map((def, i) => (
                      <li key={i}>{def}</li>
                    ))}
                  </ol>
                </div>

                <div className="px-4 py-3 border-b border-outline-variant/20 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-label-sm text-caption text-on-surface-variant tracking-wider uppercase text-[10px]">
                      Highlight
                    </span>
                    <div className="flex items-center space-x-2 ml-1">
                      {HIGHLIGHT_COLORS.map((c) => {
                        const active = highlightColor === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setHighlightColor(c.id)}
                            aria-label={`${c.id} Highlight`}
                            className={`w-6 h-6 rounded-full ${c.bg} ${
                              active
                                ? 'border-2 border-primary'
                                : 'border border-black/10 hover:ring-2 hover:ring-outline-variant/50'
                            } flex items-center justify-center shadow-xs active:scale-95 transition-transform`}
                          >
                            {active && (
                              <span className="material-symbols-outlined text-[14px] text-primary font-bold">
                                check
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUnderlined((u) => !u)}
                    aria-label="Underline text"
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border active:scale-95 transition-all ${
                      underlined
                        ? 'bg-primary text-on-primary border-primary'
                        : 'bg-surface-container hover:bg-surface-container-high text-on-surface border-outline-variant/30'
                    }`}
                  >
                    <span className="font-headline-sm text-label-md underline font-semibold leading-none">
                      U
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-5 divide-x divide-outline-variant/20 text-center bg-surface-container-lowest py-1.5">
                  <button
                    type="button"
                    onClick={async () => {
                      await saveVocabularyWord(book.highlightedWord);
                      showToast(`Saved "${book.highlightedWord.word}" to Vocabulary Deck`);
                    }}
                    className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-primary active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">sticky_note_2</span>
                    <span className="font-label-sm text-[10px] mt-0.5">Keep</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator?.clipboard) {
                        navigator.clipboard.writeText(book.highlightedWord.quote);
                      }
                      showToast('Passage copied to clipboard');
                    }}
                    className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-primary active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">content_copy</span>
                    <span className="font-label-sm text-[10px] mt-0.5">Copy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAiWithTab('subtext')}
                    className="flex flex-col items-center justify-center py-1 text-secondary hover:text-on-secondary-container active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                    <span className="font-label-sm text-[10px] mt-0.5 font-medium">Explain</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openAiWithTab('author')}
                    className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-primary active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">history_edu</span>
                    <span className="font-label-sm text-[10px] mt-0.5">Context</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFindOpen((f) => !f)}
                    className="flex flex-col items-center justify-center py-1 text-on-surface-variant hover:text-primary active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span className="font-label-sm text-[10px] mt-0.5">Find</span>
                  </button>
                </div>
              </section>
            )}

            {book.paragraphs?.map((para, idx) => (
              <p key={idx} className="book-paragraph mb-4">
                {para}
              </p>
            ))}
          </article>
        </ReaderCanvas>

        {/* Reader bottom page navigation buttons & progress */}
        <div className="mt-8 pt-4 pb-2 border-t border-outline-variant/20 flex flex-col items-center justify-center space-y-2 text-center">
          <div className="flex items-center gap-4 mb-1">
            <button
              type="button"
              onClick={handlePrevPage}
              className="px-3 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-caption font-label-sm flex items-center gap-1 border border-outline-variant/30 transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[14px]">chevron_left</span>
              <span>Prev Page</span>
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              className="px-3 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant text-caption font-label-sm flex items-center gap-1 border border-outline-variant/30 transition-colors active:scale-95"
            >
              <span>Next Page</span>
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>
          <div className="w-full max-w-xs bg-surface-container-high rounded-full h-1 overflow-hidden">
            <div
              className="bg-secondary h-1 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
          <span className="font-label-sm text-[10px] tracking-widest text-on-surface-variant uppercase">
            {activeChapter.title ? activeChapter.title : `${progressPct}% completed`}
          </span>
        </div>
      </main>

      {/* Floating snippet action banner when user highlights text in EPUB */}
      {selectedSnippet && (
        <div className="fixed bottom-20 inset-x-0 z-40 px-4 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="pointer-events-auto bg-surface-container-highest/95 backdrop-blur-md border border-outline-variant/40 rounded-2xl shadow-xl px-4 py-2.5 flex flex-col sm:flex-row items-center gap-3 text-sm max-w-lg">
            <div className="flex items-center gap-2 truncate">
              <span className="font-headline-sm font-semibold text-primary truncate max-w-[140px]">
                {dynamicLookup?.word || selectedSnippet.text}
              </span>
              {dynamicLookup?.phonetic && (
                <span className="font-mono text-[11px] text-outline truncate hidden sm:inline">
                  {dynamicLookup.phonetic}
                </span>
              )}
              {dynamicLookup?.definition?.[0] && (
                <span className="font-caption text-[12px] text-on-surface-variant truncate max-w-[160px] italic">
                  &ldquo;{dynamicLookup.definition[0]}&rdquo;
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={async () => {
                  const term = dynamicLookup?.word || selectedSnippet.text.slice(0, 40);
                  const def = dynamicLookup?.definition?.[0] || `Excerpt from ${book.title}`;
                  await saveVocabularyWord({
                    word: term,
                    phonetic: dynamicLookup?.phonetic || '',
                    partOfSpeech: dynamicLookup?.partsOfSpeech?.[0] || 'EXCERPT',
                    definitions: dynamicLookup?.definition || [def],
                    quote: selectedSnippet.text,
                    bookTitle: book.title,
                    bookId: book.id,
                  });
                  showToast(`+ Saved "${term}" to Vocabulary Deck`);
                  setSelectedSnippet(null);
                  setDynamicLookup(null);
                }}
                className="flex items-center gap-1 text-primary font-medium hover:underline text-xs bg-primary-container/20 px-2.5 py-1 rounded-full border border-primary/20"
              >
                <span className="material-symbols-outlined text-[15px]">bookmark_add</span>
                <span>+ Save Word</span>
              </button>

              <button
                type="button"
                onClick={() => openAiWithTab(dynamicLookup ? 'define' : 'subtext')}
                className="flex items-center gap-1 text-secondary font-medium hover:underline text-xs"
              >
                <span className="material-symbols-outlined text-[15px]">auto_awesome</span>
                <span>Explain</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (navigator?.clipboard) {
                    navigator.clipboard.writeText(selectedSnippet.text);
                  }
                  showToast('Passage copied');
                  setSelectedSnippet(null);
                  setDynamicLookup(null);
                }}
                className="flex items-center gap-1 text-on-surface-variant hover:text-primary text-xs"
              >
                <span className="material-symbols-outlined text-[15px]">content_copy</span>
                <span>Copy</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedSnippet(null);
                  setDynamicLookup(null);
                }}
                className="text-outline hover:text-on-surface p-0.5 rounded-full"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scrubber Slider Modal */}
      {scrubberOpen && (
        <div className="fixed bottom-16 inset-x-0 z-30 bg-surface/95 backdrop-blur-md border-t border-outline-variant/30 px-6 py-3 flex items-center justify-center shadow-lg">
          <div className="w-full max-w-md flex items-center gap-3">
            <span className="font-label-sm text-caption text-on-surface-variant w-12">p. 1</span>
            <input
              type="range"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => handleScrubberChange(e.target.value)}
              className="flex-1 custom-range"
            />
            <span className="font-label-sm text-caption text-primary font-semibold w-16 text-right">
              p. {currentPage}
            </span>
          </div>
        </div>
      )}

      {/* Bottom Sticky Action Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-30 flex justify-between items-center px-gutter h-16 bg-surface/90 dark:bg-surface-container/90 backdrop-blur-md border-t border-outline-variant/30 dark:border-outline-variant/10 shadow-sm">
        <button
          type="button"
          onClick={() => setTocOpen(true)}
          className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg"
        >
          <span className="material-symbols-outlined">menu_book</span>
          <span className="font-label-sm text-label-sm mt-0.5">Contents</span>
        </button>

        <button
          type="button"
          onClick={() => setScrubberOpen((s) => !s)}
          className="flex flex-col items-center justify-center text-primary dark:text-inverse-primary font-medium hover:bg-surface-container-high/50 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg"
        >
          <div className="flex items-center space-x-1.5">
            <span className="material-symbols-outlined text-[16px] text-secondary">article</span>
            <span className="font-label-sm text-[11px] tracking-wider font-semibold">
              PAGE {currentPage} OF {totalPages} · {progressPct}%
            </span>
          </div>
          <div className="w-24 bg-surface-container-high h-1 rounded-full mt-1 overflow-hidden">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openAiWithTab('subtext')}
            className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-high/50 active:scale-95 transition-transform duration-150 py-1 px-2.5 rounded-lg"
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            <span className="font-label-sm text-label-sm mt-0.5">AI Margin</span>
          </button>
          <button
            type="button"
            onClick={() => setAppearanceOpen(true)}
            className="flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg"
          >
            <span className="material-symbols-outlined">format_size</span>
            <span className="font-label-sm text-label-sm mt-0.5">Appearance</span>
          </button>
        </div>
      </nav>

      {/* Table of Contents Modal */}
      {tocOpen && (
        <div
          onClick={() => setTocOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end md:items-center justify-center p-0 md:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface text-on-surface rounded-t-3xl md:rounded-3xl border border-outline-variant/40 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary">
                  Table of Contents
                </h3>
                <p className="font-caption text-caption text-on-surface-variant truncate max-w-[280px]">
                  {book.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTocOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="divide-y divide-outline-variant/20 overflow-y-auto flex-1 pr-1">
              {chapters.map((ch, idx) => (
                <button
                  key={ch.href || ch.num || idx}
                  type="button"
                  onClick={() => {
                    setActiveChapter(ch);
                    if (bookBinary && readerCanvasRef.current && ch.href) {
                      readerCanvasRef.current.goToCfi(ch.href);
                    } else if (ch.page) {
                      setCurrentPage(ch.page);
                    }
                    setTocOpen(false);
                  }}
                  className={`w-full py-3 px-2 flex items-center justify-between text-left rounded-lg hover:bg-surface-container-low transition-colors ${
                    activeChapter.title === ch.title ? 'text-secondary font-semibold' : 'text-on-surface'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="font-label-sm text-label-sm block">{ch.num}</span>
                    <span className="font-headline-sm text-[15px] truncate block">{ch.title}</span>
                  </div>
                  {ch.page && (
                    <span className="font-caption text-caption text-outline shrink-0">
                      p. {ch.page}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Margin Drawer */}
      <AiDrawer
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        quote={selectedSnippet?.text || book.highlightedWord?.quote || ''}
        initialTab={aiTab}
        bookTitle={book.title}
        bookId={book.id}
        onShowToast={showToast}
      />

      {/* Typography & Appearance Modal */}
      <SettingsMenu
        open={appearanceOpen}
        onClose={() => setAppearanceOpen(false)}
        settings={readerSettings}
        onChangeSettings={setReaderSettings}
      />
    </div>
  );
}
