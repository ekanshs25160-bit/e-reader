'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { saveBook, getBookBlob, getAllBooks } from '@/utils/db';
import { searchBooks, browseBooks, downloadEpub } from '@/lib/api';
import BookCover from '@/components/BookCover';

const TOPICS = [
  'All Classics',
  'Philosophy',
  'Gothic Fiction',
  'Russian Lit',
  'Sci-Fi & Fantasy',
  'Poetry',
  'Essays',
];

// Helper to dynamically calculate spine dimensions based on title length
function getSpineDimensions(title) {
  const len = (title || '').length;
  if (len >= 18) {
    // Big title: e.g. "Crime and Punishment" (20 chars)
    // Spine is tall and wide enough to fit the full title, and fits comfortably in the shelf
    return {
      height: 'h-56 sm:h-60',
      width: 'w-12 sm:w-14',
      fontSize: 'text-[10px] sm:text-[10.5px]',
      tracking: 'tracking-tight',
    };
  } else if (len >= 14) {
    // Medium-long title
    return {
      height: 'h-48 sm:h-52',
      width: 'w-11 sm:w-12',
      fontSize: 'text-[10.5px] sm:text-[11px]',
      tracking: 'tracking-normal',
    };
  } else if (len >= 10) {
    // Medium title: e.g. "Frankenstein" (12 chars), "The Odyssey" (11 chars), "Meditations" (11 chars)
    return {
      height: 'h-44 sm:h-48',
      width: 'w-10 sm:w-11',
      fontSize: 'text-[11px]',
      tracking: 'tracking-normal',
    };
  } else if (len >= 8) {
    // Short title: e.g. "Moby Dick" (9 chars)
    return {
      height: 'h-36 sm:h-40',
      width: 'w-9 sm:w-10',
      fontSize: 'text-[11px]',
      tracking: 'tracking-normal',
    };
  } else {
    // Very short title: e.g. "Dracula" (7 chars)
    // Spine is compact and smaller
    return {
      height: 'h-32 sm:h-36',
      width: 'w-8 sm:w-9',
      fontSize: 'text-[11px]',
      tracking: 'tracking-wide',
    };
  }
}

const TRENDING_SPINES = [
  {
    id: 'crime-and-punishment',
    gutenbergId: '2554',
    height: 'h-56 sm:h-60',
    width: 'w-12 sm:w-14',
    bg: 'bg-[#1a2b3c]',
    topType: 'text',
    top: 'VIII',
    topColor: 'text-[#e0b878]',
    title: 'Crime and Punishment',
    titleColor: 'text-surface',
    fontSize: 'text-[10px] sm:text-[10.5px]',
    tracking: 'tracking-tight',
    author: 'Dostoevsky',
    authorColor: 'text-white/70',
  },
  {
    id: 'frankenstein',
    gutenbergId: '84',
    height: 'h-44 sm:h-48',
    width: 'w-10 sm:w-11',
    bg: 'bg-[#3a4d3f]',
    topType: 'icon',
    top: 'spa',
    topColor: 'text-[#a8c3af]',
    title: 'Frankenstein',
    titleColor: 'text-[#e6ede7]',
    fontSize: 'text-[11px]',
    tracking: 'tracking-normal',
    author: 'M. Shelley',
    authorColor: 'text-[#a8c3af]',
  },
  {
    id: 'odyssey',
    gutenbergId: '1727',
    height: 'h-44 sm:h-48',
    width: 'w-10 sm:w-11',
    bg: 'bg-[#8a4229]',
    topType: 'text-serif',
    top: 'Ω',
    topColor: 'text-[#ffd6b8]',
    title: 'The Odyssey',
    titleColor: 'text-[#fff0e6]',
    fontSize: 'text-[11px]',
    tracking: 'tracking-normal',
    author: 'Homer',
    authorColor: 'text-[#ffd6b8]',
  },
  {
    id: 'meditations',
    gutenbergId: '2680',
    height: 'h-40 sm:h-44',
    width: 'w-10 sm:w-10',
    bg: 'bg-[#7d5628]',
    topType: 'icon',
    top: 'star',
    topColor: 'text-[#ffe09e]',
    title: 'Meditations',
    titleColor: 'text-[#fff4df]',
    fontSize: 'text-[11px]',
    tracking: 'tracking-normal',
    author: 'Aurelius',
    authorColor: 'text-[#ffe09e]',
  },
  {
    id: 'moby-dick',
    gutenbergId: '2701',
    height: 'h-36 sm:h-40',
    width: 'w-9 sm:w-10',
    bg: 'bg-[#22454a]',
    topType: 'icon',
    top: 'sailing',
    topColor: 'text-[#84bcc4]',
    title: 'Moby Dick',
    titleColor: 'text-[#e0f1f3]',
    fontSize: 'text-[11px]',
    tracking: 'tracking-normal',
    author: 'Melville',
    authorColor: 'text-[#84bcc4]',
  },
  {
    id: 'dracula',
    gutenbergId: '345',
    height: 'h-32 sm:h-36',
    width: 'w-8 sm:w-9',
    bg: 'bg-[#4a1c24]',
    topType: 'icon',
    top: 'cruelty_free',
    topColor: 'text-[#e89ca9]',
    title: 'Dracula',
    titleColor: 'text-[#fbecee]',
    fontSize: 'text-[11px]',
    tracking: 'tracking-wide',
    author: 'B. Stoker',
    authorColor: 'text-[#e89ca9]',
  },
];



export default function Page() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { openImportModal, showToast } = useTheme();

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Classics');
  const [viewLayout, setViewLayout] = useState('list'); // 'list' | 'grid'

  // Vault Tracking State (populated from IndexedDB books with hasBinary === true)
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [downloadingIds, setDownloadingIds] = useState(() => new Set());

  // Search Results & States
  const [liveSearchResults, setLiveSearchResults] = useState(null);
  const [searchTotal, setSearchTotal] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchRetryKey, setSearchRetryKey] = useState(0);

  // Initialize savedIds from IndexedDB (books with hasBinary === true)
  useEffect(() => {
    let cancelled = false;
    async function loadSavedVaultBooks() {
      try {
        const books = await getAllBooks();
        if (cancelled) return;
        const validIds = new Set();
        for (const b of books) {
          if (b.hasBinary) {
            if (b.id) validIds.add(String(b.id));
            if (b.gutenbergId) {
              validIds.add(String(b.gutenbergId));
              validIds.add(`gutenberg_${b.gutenbergId}`);
            }
          }
        }
        setSavedIds(validIds);
      } catch (err) {
        console.warn('Failed to load saved books from vault:', err);
      }
    }
    loadSavedVaultBooks();
    return () => {
      cancelled = true;
    };
  }, []);

  // Live Gutenberg Catalog Search via Backend
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setLiveSearchResults(null);
      setSearchTotal(null);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setSearchError(null);

    const timer = setTimeout(async () => {
      try {
        const result = await searchBooks(trimmed);
        if (cancelled) return;

        const books = result?.books || [];
        const mapped = books.map((b) => ({
          id: `gutenberg_${b.id}`,
          gutenbergId: String(b.id),
          title: b.title,
          author: b.authors?.[0] || 'Classic Author',
          authors: b.authors || [],
          languages: Array.isArray(b.languages) ? b.languages : [],
          subjects: Array.isArray(b.subjects) ? b.subjects : [],
          downloadCount: b.downloadCount ?? null,
          copyright: b.copyright ?? null,
          meta: `Gutenberg #${b.id} · EPUB`,
          topic: 'Project Gutenberg',
          coverUrl: b.coverUrl || null,
          isStatic: false,
        }));

        setLiveSearchResults(mapped);
        setSearchTotal(typeof result?.total === 'number' ? result.total : mapped.length);
        setSearchError(null);
      } catch (err) {
        if (cancelled) return;
        console.warn('Search error:', err);
        setSearchError(err.message || 'Failed to search Project Gutenberg');
        setLiveSearchResults(null);
        setSearchTotal(null);
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, searchRetryKey]);

  // Live Browse Catalog by Topic from Gutenberg
  const [browseResults, setBrowseResults] = useState([]);
  const [isBrowsing, setIsBrowsing] = useState(true);
  const [browseError, setBrowseError] = useState(null);
  const [browseRetryKey, setBrowseRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsBrowsing(true);
    setBrowseError(null);

    async function loadBrowseBooks() {
      try {
        const topicParam = selectedTopic === 'All Classics' ? '' : selectedTopic;
        const res = await browseBooks({ topic: topicParam });
        if (cancelled) return;
        const books = res?.books || [];
        const mapped = books.map((b) => ({
          id: `gutenberg_${b.id}`,
          gutenbergId: String(b.id),
          title: b.title,
          author: b.authors?.[0] || 'Classic Author',
          authors: b.authors || [],
          languages: Array.isArray(b.languages) ? b.languages : [],
          subjects: Array.isArray(b.subjects) ? b.subjects : [],
          downloadCount: b.downloadCount ?? null,
          copyright: b.copyright ?? null,
          meta: `Gutenberg #${b.id} · EPUB`,
          topic: selectedTopic,
          coverUrl: b.coverUrl || null,
          isStatic: false,
        }));
        setBrowseResults(mapped);
      } catch (err) {
        if (cancelled) return;
        console.warn('Browse error:', err);
        setBrowseError(err.message || 'Failed to load public domain catalog');
      } finally {
        if (!cancelled) {
          setIsBrowsing(false);
        }
      }
    }

    loadBrowseBooks();

    return () => {
      cancelled = true;
    };
  }, [selectedTopic, browseRetryKey]);

  const isSearchMode = Boolean(searchQuery.trim());

  // Check if a book's binary is available in offline vault
  const isBookInVault = useCallback(
    (book) => {
      if (!book) return false;
      const idStr = String(book.id || '');
      if (savedIds.has(idStr)) return true;
      if (book.gutenbergId) {
        const gIdStr = String(book.gutenbergId);
        if (savedIds.has(gIdStr) || savedIds.has(`gutenberg_${gIdStr}`)) return true;
      }
      return false;
    },
    [savedIds]
  );

  // Download Project Gutenberg book via backend proxy and persist to localForage
  const handleDownloadGutenbergBook = async (e, book) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const gutenbergId = book.gutenbergId || (book.id && String(book.id).startsWith('gutenberg_') ? String(book.id).replace('gutenberg_', '') : null);

    if (!gutenbergId) {
      showToast('Download is unavailable for this title');
      return;
    }

    const bookKey = `gutenberg_${gutenbergId}`;

    // 3. If the book already has a stored binary (getBookBlob), skip the download and open it.
    try {
      const existingBlob = (await getBookBlob(bookKey)) || (book.id ? await getBookBlob(String(book.id)) : null);
      if (existingBlob) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.add(bookKey);
          if (book.id) next.add(String(book.id));
          next.add(String(gutenbergId));
          return next;
        });
        showToast(`Opening "${book.title}" from offline vault...`);
        router.push(`/reader/${bookKey}`);
        return;
      }
    } catch (err) {
      console.warn('Error checking existing book binary:', err);
    }

    setDownloadingIds((prev) => new Set(prev).add(book.id));
    showToast(`Downloading "${book.title}" EPUB binary...`);

    try {
      // 1. Fetch and validate the EPUB through the backend (throws ApiError on failure)
      const epubBlob = await downloadEpub(gutenbergId);

      const authorName = Array.isArray(book.authors)
        ? book.authors.join(', ')
        : book.author || 'Classic Author';

      const bookMeta = {
        id: bookKey,
        gutenbergId: String(gutenbergId),
        title: book.title,
        author: authorName,
        authors: Array.isArray(book.authors) ? book.authors : undefined,
        languages: book.languages,
        subjects: book.subjects,
        downloadCount: book.downloadCount,
        copyright: book.copyright,
        coverUrl: book.coverUrl || null,
        fileSize: epubBlob.size,
        progressPercentage: 0,
        progress: 0,
        status: 'to-read',
        category: 'The Commons',
        addedAt: Date.now(),
      };

      // 2. Save metadata + binary blob ONCE into localForage (IndexedDB) under 'gutenberg_<id>'
      await saveBook(bookKey, bookMeta, epubBlob);

      // Update in-memory savedIds so vault badge updates immediately
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.add(bookKey);
        if (book.id) next.add(String(book.id));
        next.add(String(gutenbergId));
        return next;
      });

      showToast(`Saved "${book.title}" to offline vault!`);

      // 3. Open directly in the Kindle Reader view
      router.push(`/reader/${bookKey}`);
    } catch (err) {
      // 1. On download failure: show an error toast with the real message, do NOT call saveBook, do NOT navigate.
      console.warn('EPUB download failed:', err);
      showToast(err.message || 'Download failed');
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(book.id);
        return next;
      });
    }
  };

  const handleDownloadBook = handleDownloadGutenbergBook;

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh min-h-full font-body-ui text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary-container bg-background pb-32">
      <div className="fixed top-0 left-0 md:left-20 lg:left-64 right-0 h-80 bg-gradient-to-b from-[#DCE9F5]/70 dark:from-[#1c2438] via-[#EAF2F8]/30 dark:via-[#161c2d]/70 to-transparent pointer-events-none z-0 pb-28 md:pb-10"></div>

      <header className="md:hidden bg-surface/80 dark:bg-surface-container/80 backdrop-blur-md text-primary dark:text-inverse-primary docked full-width top-0 sticky z-40 border-b border-outline-variant/30 dark:border-outline/20 shadow-sm flex justify-between items-center w-full px-margin h-14">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-primary text-[22px]">
            local_library
          </span>
          <span className="font-headline-sm text-headline-sm text-primary dark:text-inverse-primary tracking-tight font-bold">
            The Commons
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant/40 bg-surface-container-lowest/70 backdrop-blur text-primary text-label-md font-label-md hover:bg-surface-container-high transition-colors active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span>Import</span>
          </button>
        </div>
      </header>

      <main className="relative z-10 max-w-2xl md:max-w-none mx-auto px-margin md:px-8 pt-4 space-y-6 w-full pb-28 md:pb-10">
        <div className="flex items-start justify-between gap-4 pt-2">
          <div>
            <h1 className="font-display-lg-mobile md:font-headline-lg text-display-lg-mobile md:text-headline-lg text-primary tracking-tight font-medium">
              The Commons
            </h1>
            <p className="font-caption text-caption text-on-surface-variant mt-1 flex items-center gap-1.5">
              <span>
                {isSearchMode && typeof searchTotal === 'number'
                  ? `${searchTotal.toLocaleString()} catalog books found`
                  : 'Public domain catalog'}
              </span>
              <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
              <span className="text-secondary font-medium">Project Gutenberg</span>
            </p>
          </div>
          <button
            type="button"
            onClick={openImportModal}
            className="shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-container-lowest/90 border border-outline-variant/50 text-primary text-label-sm font-label-sm shadow-sm hover:bg-surface-container-low transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-[16px] text-secondary">
              cloud_upload
            </span>
            <span>Upload .epub</span>
          </button>
        </div>

        {/* Search Input Bar */}
        <section className="space-y-3">
          <div className="relative flex items-center">
            <span className="material-symbols-outlined absolute left-3.5 text-on-surface-variant text-[20px] pointer-events-none">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest/80 border border-outline-variant/40 rounded-full pl-10 pr-10 py-2.5 text-body-ui font-body-ui text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary shadow-sm backdrop-blur-sm transition-all"
              placeholder="Search title, author, or subject..."
              type="text"
            />
            {isSearching ? (
              <span className="absolute right-3.5 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setLiveSearchResults(null);
                  setSearchTotal(null);
                  setSearchError(null);
                  setSelectedTopic('All Classics');
                }}
                className="absolute right-3 p-1 rounded-full text-on-surface-variant hover:text-primary transition-colors"
                title="Filter & Clear"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {searchQuery ? 'close' : 'tune'}
                </span>
              </button>
            )}
          </div>

          {/* Topic Pills - visible when not actively searching */}
          {!isSearchMode && (
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-margin px-margin py-1">
              {TOPICS.map((topic) => {
                const active = selectedTopic === topic;
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setSelectedTopic(topic)}
                    className={`shrink-0 px-3.5 py-1.5 rounded-full text-caption font-label-sm transition-all ${
                      active
                        ? 'bg-primary text-on-primary shadow-xs font-semibold'
                        : 'bg-surface-container-lowest/80 border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {topic}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Curated Bookshelf Spines - visible only when browsing */}
        {!isSearchMode && (
          <section className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-caption text-caption text-on-surface-variant font-semibold tracking-wider">
                  FEATURED SHELF
                </span>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-[11px] font-label-sm">
                  Curated
                </span>
              </div>
              <span className="font-caption text-[11px] text-outline font-medium">Swipe to browse</span>
            </div>

            <div className="relative bg-surface-container-lowest/60 border border-outline-variant/30 rounded-2xl p-4 pt-6 shadow-sm backdrop-blur-md overflow-hidden">
              <div className="flex items-end justify-between sm:justify-around gap-2 sm:gap-3 overflow-x-auto no-scrollbar pt-2 px-1 pb-1 min-h-[265px] sm:min-h-[285px]">
                {TRENDING_SPINES.map((book) => {
                  const dims = {
                    height: book.height || getSpineDimensions(book.title).height,
                    width: book.width || getSpineDimensions(book.title).width,
                    fontSize: book.fontSize || getSpineDimensions(book.title).fontSize,
                    tracking: book.tracking || getSpineDimensions(book.title).tracking,
                  };

                  return (
                    <div
                      key={book.id}
                      onClick={() => router.push(`/book/${book.gutenbergId || book.id}`)}
                      className={`shrink-0 group cursor-pointer ${dims.width} ${dims.height} ${book.bg} rounded-t-sm rounded-b-[2px] border-l border-white/20 border-r border-black/40 shadow-md flex flex-col justify-between py-2.5 px-1 items-center transition-transform hover:-translate-y-2 hover:shadow-lg relative select-none`}
                    >
                      {/* Top Ornament */}
                      <div className="flex items-center justify-center h-4 w-full shrink-0">
                        {book.topType === 'icon' ? (
                          <span className={`material-symbols-outlined text-[12px] sm:text-[13px] ${book.topColor}`}>
                            {book.top}
                          </span>
                        ) : book.topType === 'text-serif' ? (
                          <span className={`font-serif text-[11px] ${book.topColor} font-bold leading-none`}>
                            {book.top}
                          </span>
                        ) : (
                          <span className={`font-label-sm text-[9px] sm:text-[9.5px] font-bold ${book.topColor} tracking-widest uppercase leading-none`}>
                            {book.top}
                          </span>
                        )}
                      </div>

                      {/* Spine Title - Centered along vertical spine axis */}
                      <div className="flex-1 w-full flex items-center justify-center overflow-hidden my-1 z-10">
                        <span
                          className={`spine-book ${dims.fontSize} font-headline-sm font-semibold ${dims.tracking} ${book.titleColor} text-center`}
                        >
                          {book.title}
                        </span>
                      </div>

                      {/* Bottom Author */}
                      <div className="flex items-center justify-center h-4 w-full shrink-0">
                        <span className={`text-[8px] sm:text-[8.5px] font-caption ${book.authorColor} tracking-tight truncate max-w-full text-center leading-none`}>
                          {book.author}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-3 w-full bg-gradient-to-b from-[#b89f82] to-[#998166] rounded-sm shadow-inner mt-0.5 border-t border-[#dfcfbd]"></div>
              <div className="h-2 w-full bg-[#75614a]/30 blur-[2px] -mt-1"></div>
              <p className="text-[11px] font-caption text-on-surface-variant text-center pt-2">
                Curated from the public domain · Free &amp; local-first
              </p>
            </div>
          </section>
        )}

        {/* Main Content Area: SEARCH RESULTS or BROWSE CATALOG */}
        <section id="shelves" className="space-y-3.5 pt-2">
          {/* Header & Layout Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-caption text-caption text-on-surface-variant font-semibold tracking-wider uppercase">
                {isSearchMode
                  ? isSearching
                    ? 'SEARCHING CATALOG...'
                    : searchError
                    ? 'SEARCH ERROR'
                    : `SEARCH RESULTS (${typeof searchTotal === 'number' ? searchTotal.toLocaleString() : liveSearchResults?.length || 0})`
                  : 'CURATED SELECTION'}
              </span>
            </div>

            {/* Layout switch controls (list vs grid) */}
            {(!isSearchMode || (!isSearching && !searchError && liveSearchResults?.length > 0)) && (
              <div className="flex items-center bg-surface-container-high/60 p-0.5 rounded-lg border border-outline-variant/30">
                <button
                  type="button"
                  onClick={() => setViewLayout('list')}
                  className={`p-1 rounded transition-colors ${
                    viewLayout === 'list'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                  title="List View"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    format_list_bulleted
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout('grid')}
                  className={`p-1 rounded transition-colors ${
                    viewLayout === 'grid'
                      ? 'bg-surface-container-lowest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                  title="Grid View"
                >
                  <span className="material-symbols-outlined text-[16px]">grid_view</span>
                </button>
              </div>
            )}
          </div>

          {/* SEARCH MODE STATES: Loading, Error, Empty, or Results */}
          {isSearchMode ? (
            <div>
              {/* 1. Loading State */}
              {isSearching && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30 p-8">
                  <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <h3 className="font-headline-sm text-base font-medium text-primary">
                    Searching Project Gutenberg...
                  </h3>
                  <p className="font-caption text-xs text-on-surface-variant max-w-sm">
                    Querying public domain books for &ldquo;{searchQuery}&rdquo;
                  </p>
                </div>
              )}

              {/* 2. Error State */}
              {!isSearching && searchError && (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-error-container/20 rounded-2xl border border-error/30 p-8">
                  <span className="material-symbols-outlined text-error text-[36px]">
                    cloud_off
                  </span>
                  <h3 className="font-headline-sm text-base font-semibold text-primary">
                    Search Request Failed
                  </h3>
                  <p className="font-caption text-xs text-on-surface-variant max-w-md">
                    {searchError}
                  </p>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setSearchRetryKey((k) => k + 1)}
                      className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px]">refresh</span>
                      <span>Retry</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchError(null);
                        setLiveSearchResults(null);
                      }}
                      className="px-4 py-1.5 rounded-full bg-surface-container-high text-on-surface font-label-md text-xs hover:bg-surface-container-highest transition-colors"
                    >
                      Clear Search
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Empty Results State */}
              {!isSearching && !searchError && liveSearchResults && liveSearchResults.length === 0 && (
                <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30 p-8">
                  <span className="material-symbols-outlined text-outline text-[40px]">
                    search_off
                  </span>
                  <h3 className="font-headline-sm text-base font-medium text-primary">
                    No Books Found
                  </h3>
                  <p className="font-caption text-xs text-on-surface-variant max-w-sm">
                    We couldn&apos;t find any public domain books matching &ldquo;{searchQuery}&rdquo; on Project Gutenberg.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setLiveSearchResults(null);
                    }}
                    className="mt-2 px-4 py-1.5 rounded-full bg-surface-container-high text-primary font-label-md text-xs hover:bg-surface-container-highest transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                    <span>Clear Search</span>
                  </button>
                </div>
              )}

              {/* 4. Results List/Grid */}
              {!isSearching && !searchError && liveSearchResults && liveSearchResults.length > 0 && (
                <BookCollection
                  books={liveSearchResults}
                  viewLayout={viewLayout}
                  savedIds={savedIds}
                  downloadingIds={downloadingIds}
                  isBookInVault={isBookInVault}
                  onDownload={handleDownloadBook}
                  onOpenBook={(book) => {
                    const bookKey = book.gutenbergId ? `gutenberg_${book.gutenbergId}` : String(book.id);
                    router.push(`/book/${bookKey}`);
                  }}
                  onOpenReader={(book) => {
                    const bookKey = book.gutenbergId ? `gutenberg_${book.gutenbergId}` : String(book.id);
                    router.push(`/reader/${bookKey}`);
                  }}
                />
              )}
            </div>
          ) : isBrowsing ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3 bg-surface-container-low/40 rounded-2xl border border-outline-variant/30 p-8">
              <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <h3 className="font-headline-sm text-base font-medium text-primary">
                Loading {selectedTopic}...
              </h3>
              <p className="font-caption text-xs text-on-surface-variant max-w-sm">
                Fetching public domain titles from Project Gutenberg
              </p>
            </div>
          ) : browseError ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 bg-error-container/20 rounded-2xl border border-error/30 p-8">
              <span className="material-symbols-outlined text-error text-[36px]">
                cloud_off
              </span>
              <h3 className="font-headline-sm text-base font-semibold text-primary">
                Failed to Load Catalog
              </h3>
              <p className="font-caption text-xs text-on-surface-variant max-w-md">
                {browseError}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setBrowseRetryKey((k) => k + 1)}
                  className="px-4 py-1.5 rounded-full bg-primary text-on-primary font-label-md text-xs hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">refresh</span>
                  <span>Retry</span>
                </button>
              </div>
            </div>
          ) : (
            <BookCollection
              books={browseResults}
              viewLayout={viewLayout}
              savedIds={savedIds}
              downloadingIds={downloadingIds}
              isBookInVault={isBookInVault}
              onDownload={handleDownloadBook}
              onOpenBook={(book) => {
                const bookKey = book.gutenbergId ? `gutenberg_${book.gutenbergId}` : String(book.id);
                router.push(`/book/${bookKey}`);
              }}
              onOpenReader={(book) => {
                const bookKey = book.gutenbergId ? `gutenberg_${book.gutenbergId}` : String(book.id);
                router.push(`/reader/${bookKey}`);
              }}
            />
          )}
        </section>
        <div className="h-6"></div>
      </main>
    </div>
  );
}

/**
 * Shared renderer for List vs Grid layouts with full offline vault and download state handling
 */
function BookCollection({
  books,
  viewLayout,
  downloadingIds,
  isBookInVault,
  onDownload,
  onOpenBook,
  onOpenReader,
}) {
  if (viewLayout === 'grid') {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {books.map((book) => {
          const isSaved = isBookInVault(book);
          const isDownloading = downloadingIds.has(book.id);
          const hasDownloadId = Boolean(
            book.gutenbergId || (book.id && String(book.id).startsWith('gutenberg_'))
          );

          return (
            <div
              key={book.id}
              onClick={() => onOpenBook(book)}
              className="bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-3 flex flex-col gap-2.5 shadow-sm hover:shadow-md transition-all cursor-pointer group relative"
            >
              <BookCover
                coverUrl={book.coverUrl}
                title={book.title}
                author={book.author}
                year={book.year}
                aspect="aspect-[2/3]"
              />
              <div className="min-w-0">
                <span className="font-caption text-[10px] font-semibold text-secondary uppercase tracking-wider truncate block">
                  {book.author}
                </span>
                <h3 className="font-headline-sm text-[15px] text-primary leading-tight font-medium truncate mt-0.5">
                  {book.title}
                </h3>
              </div>

              <button
                type="button"
                disabled={!hasDownloadId || isDownloading}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isSaved) {
                    onOpenReader(book);
                  } else {
                    onDownload(e, book);
                  }
                }}
                className={`mt-1 w-full py-1.5 rounded-lg text-xs font-label-md flex items-center justify-center gap-1 transition-colors ${
                  !hasDownloadId
                    ? 'bg-surface-container-low text-on-surface-variant/40 cursor-not-allowed opacity-50'
                    : isSaved
                    ? 'bg-secondary-container/50 text-on-secondary-container hover:bg-secondary-container'
                    : 'bg-surface-container hover:bg-primary hover:text-on-primary text-primary'
                }`}
                title={
                  !hasDownloadId
                    ? 'Download unavailable'
                    : isSaved
                    ? 'Open in Reader'
                    : 'Download EPUB to Vault'
                }
              >
                {!hasDownloadId ? (
                  <>
                    <span className="material-symbols-outlined text-[14px]">block</span>
                    <span>Unavailable</span>
                  </>
                ) : isDownloading ? (
                  <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                ) : isSaved ? (
                  <>
                    <span className="material-symbols-outlined text-[14px]">check</span>
                    <span>In Vault</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[14px]">download</span>
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-3">
      {books.map((book) => {
        const isSaved = isBookInVault(book);
        const isDownloading = downloadingIds.has(book.id);
        const hasDownloadId = Boolean(
          book.gutenbergId || (book.id && String(book.id).startsWith('gutenberg_'))
        );

        return (
          <div
            key={book.id}
            onClick={() => onOpenBook(book)}
            className="bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-3.5 flex items-center justify-between gap-3.5 shadow-sm hover:shadow-md transition-shadow backdrop-blur-sm cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-14 aspect-[2/3] shrink-0">
                <BookCover
                  coverUrl={book.coverUrl}
                  title={book.title}
                  author={book.author}
                  year={book.year}
                  aspect="aspect-[2/3]"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-caption text-[11px] font-semibold text-secondary uppercase tracking-wider truncate">
                    {book.author}
                  </span>
                </div>
                <h3 className="font-headline-sm text-[17px] text-primary leading-tight font-medium truncate mt-0.5">
                  {book.title}
                </h3>
                <p className="font-caption text-[12px] text-on-surface-variant truncate mt-1">
                  {book.meta}
                </p>
              </div>
            </div>

            {isSaved ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenReader(book);
                }}
                className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-secondary-container/40 text-on-secondary-container text-[11px] font-label-sm border border-secondary-container hover:opacity-90 transition-opacity"
                title="Open in Reader"
              >
                <span className="material-symbols-outlined text-[14px]">
                  check_circle
                </span>
                <span className="hidden sm:inline">Saved to Vault</span>
              </button>
            ) : !hasDownloadId ? (
              <button
                type="button"
                disabled
                className="shrink-0 w-9 h-9 rounded-full bg-surface-container-low text-on-surface-variant/30 border border-outline-variant/20 flex items-center justify-center cursor-not-allowed opacity-50"
                title="Download unavailable for this title"
              >
                <span className="material-symbols-outlined text-[18px]">block</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => onDownload(e, book)}
                disabled={isDownloading}
                className="shrink-0 w-9 h-9 rounded-full bg-surface-container-low hover:bg-primary-container hover:text-on-primary text-primary border border-outline-variant/40 flex items-center justify-center transition-all active:scale-95 group disabled:opacity-50"
                title="Download EPUB to Vault"
              >
                {isDownloading ? (
                  <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span className="material-symbols-outlined text-[18px] group-hover:translate-y-0.5 transition-transform">
                    arrow_downward
                  </span>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
