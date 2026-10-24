'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { saveBook, getBookBlob, getAllBooks } from '@/utils/db';
import { searchBooks, browseBooks, downloadEpub } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import Cover from '@/components/ui/Cover';
import Skeleton from '@/components/ui/Skeleton';

const TOPICS = [
  'All Classics',
  'Philosophy',
  'Gothic Fiction',
  'Russian Lit',
  'Sci-Fi & Fantasy',
  'Poetry',
  'Essays',
];

export default function BrowsePage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { openImportModal, showToast } = useTheme();

  // Search & Navigation States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Classics');

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
  const isFirstRequestRef = useRef(true);
  const [isServerWaking, setIsServerWaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let wakeTimer = null;
    setIsBrowsing(true);
    setBrowseError(null);
    setIsServerWaking(false);

    if (isFirstRequestRef.current) {
      wakeTimer = setTimeout(() => {
        if (!cancelled) {
          setIsServerWaking(true);
        }
      }, 5000);
    }

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
        if (wakeTimer) clearTimeout(wakeTimer);
        if (!cancelled) {
          setIsBrowsing(false);
          setIsServerWaking(false);
          isFirstRequestRef.current = false;
        }
      }
    }

    loadBrowseBooks();

    return () => {
      cancelled = true;
      if (wakeTimer) clearTimeout(wakeTimer);
    };
  }, [selectedTopic, browseRetryKey]);

  const isSearchMode = Boolean(searchQuery.trim());

  // Check if a book is downloaded in the local vault
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

  // Download EPUB from Gutenberg
  const handleDownloadGutenbergBook = async (e, book) => {
    if (e && e.stopPropagation) e.stopPropagation();

    const gutenbergId =
      book.gutenbergId ||
      (book.id && String(book.id).startsWith('gutenberg_')
        ? String(book.id).replace('gutenberg_', '')
        : null);

    if (!gutenbergId) {
      showToast('Download is unavailable for this title');
      return;
    }

    const bookKey = `gutenberg_${gutenbergId}`;

    try {
      const existingBlob =
        (await getBookBlob(bookKey)) ||
        (book.id ? await getBookBlob(String(book.id)) : null);
      if (existingBlob) {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.add(bookKey);
          if (book.id) next.add(String(book.id));
          next.add(String(gutenbergId));
          return next;
        });
        showToast(`Opening "${book.title}" from offline vault`);
        router.push(`/reader/${bookKey}`);
        return;
      }
    } catch (err) {
      console.warn('Error checking existing book binary:', err);
    }

    setDownloadingIds((prev) => new Set(prev).add(book.id));
    showToast(`Downloading "${book.title}" EPUB`);

    try {
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

      await saveBook(bookKey, bookMeta, epubBlob);

      setSavedIds((prev) => {
        const next = new Set(prev);
        next.add(bookKey);
        if (book.id) next.add(String(book.id));
        next.add(String(gutenbergId));
        return next;
      });

      showToast(`Saved "${book.title}" to offline library`);
      router.push(`/reader/${bookKey}`);
    } catch (err) {
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

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  const currentBooks = isSearchMode ? liveSearchResults : browseResults;
  const currentLoading = isSearchMode ? isSearching : isBrowsing;
  const currentError = isSearchMode ? searchError : browseError;

  return (
    <div className="min-h-dvh bg-background text-ink antialiased">
      <main className="max-w-[72rem] mx-auto px-4 sm:px-8 lg:px-12 pt-6 pb-32 space-y-8">
        {/* Page Header */}
        <PageHeader
          eyebrow="Public Domain"
          title="The Commons"
          description={
            isSearchMode && typeof searchTotal === 'number'
              ? `${searchTotal.toLocaleString()} catalog volumes found · Project Gutenberg`
              : 'Free public domain catalog from Project Gutenberg'
          }
          actions={
            <Button
              variant="secondary"
              size="sm"
              onClick={openImportModal}
              icon="cloud_upload"
            >
              Upload .epub
            </Button>
          }
        />

        {/* Search Input Bar (Hairline input) */}
        <div className="space-y-4 max-w-[40rem]">
          <div className="relative flex items-center">
            <span
              className="material-symbols-outlined absolute left-3.5 text-muted text-[20px] pointer-events-none"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
              aria-hidden="true"
            >
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, author, or subject…"
              type="text"
              className="w-full bg-surface border border-hairline rounded-[12px] pl-10 pr-10 py-3 text-[15px] font-sans text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink transition-colors"
            />
            {isSearching ? (
              <span className="absolute right-3.5 w-4 h-4 border-2 border-ink border-t-transparent rounded-full animate-spin" />
            ) : searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setLiveSearchResults(null);
                  setSearchTotal(null);
                  setSearchError(null);
                }}
                className="absolute right-1.5 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-muted hover:text-ink transition-colors"
                title="Clear search"
                aria-label="Clear search"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  close
                </span>
              </button>
            ) : null}
          </div>

          {/* Topic Chips (selected = ink-filled with check) */}
          {!isSearchMode && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:-mx-8 sm:px-8 md:mx-0 md:px-0 py-1">
              {TOPICS.map((topic) => (
                <Chip
                  key={topic}
                  label={topic}
                  selected={selectedTopic === topic}
                  onClick={() => setSelectedTopic(topic)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Waking Up Notice */}
        {isServerWaking && !currentError && (
          <div className="border border-hairline bg-surface rounded-[12px] p-3 text-[13px] text-muted flex items-center gap-2 max-w-[40rem]">
            <span
              className="material-symbols-outlined text-[18px] text-accent shrink-0 animate-pulse"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              hourglass_top
            </span>
            <span>Waking up the server, this can take up to a minute on the first request.</span>
          </div>
        )}

        {/* Results Area */}
        <section className="space-y-4">
          <div className="flex items-center justify-between border-b border-hairline pb-2">
            <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
              {isSearchMode
                ? isSearching
                  ? 'Searching catalog…'
                  : currentError
                  ? 'Search error'
                  : `Search results (${typeof searchTotal === 'number' ? searchTotal.toLocaleString() : currentBooks?.length || 0})`
                : `${selectedTopic} (${currentBooks?.length || 0})`}
            </span>
          </div>

          {/* 1. Loading State */}
          {currentLoading ? (
            <div className="space-y-2.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="border border-hairline bg-surface rounded-[12px] p-3.5 flex items-center gap-4"
                >
                  <Skeleton className="w-12 h-16 rounded-[4px] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : currentError ? (
            /* 2. Error State with Retry Button */
            <div className="py-12 px-6 rounded-[12px] border border-hairline bg-surface text-center space-y-3 max-w-[32rem] mx-auto my-6">
              <span
                className="material-symbols-outlined text-muted text-[36px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                cloud_off
              </span>
              <h3 className="font-serif text-[20px] text-ink font-normal">
                Catalog unavailable
              </h3>
              <p className="text-[13px] text-muted font-sans leading-relaxed">
                {currentError}
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    isSearchMode
                      ? setSearchRetryKey((k) => k + 1)
                      : setBrowseRetryKey((k) => k + 1)
                  }
                  icon="refresh"
                >
                  Retry
                </Button>
                {isSearchMode && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchError(null);
                      setLiveSearchResults(null);
                    }}
                  >
                    Clear search
                  </Button>
                )}
              </div>
            </div>
          ) : !currentBooks || currentBooks.length === 0 ? (
            /* 3. Empty State */
            <div className="py-16 px-6 rounded-[12px] border border-hairline bg-surface text-center space-y-2.5 max-w-[32rem] mx-auto my-6">
              <span
                className="material-symbols-outlined text-muted text-[36px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                menu_book
              </span>
              <h3 className="font-serif text-[20px] text-ink font-normal">
                No volumes found
              </h3>
              <p className="text-[13px] text-muted font-sans">
                {isSearchMode
                  ? `No public domain titles matched “${searchQuery}”.`
                  : 'No volumes currently available in this category.'}
              </p>
            </div>
          ) : (
            /* 4. Results as Hairline Rows */
            <div className="space-y-2.5">
              {currentBooks.map((book) => {
                const isSaved = isBookInVault(book);
                const isDownloading = downloadingIds.has(book.id);
                const hasDownloadId = Boolean(
                  book.gutenbergId ||
                    (book.id && String(book.id).startsWith('gutenberg_'))
                );
                const bookKey = book.gutenbergId
                  ? `gutenberg_${book.gutenbergId}`
                  : String(book.id);

                return (
                  <div
                    key={book.id}
                    className="border border-hairline bg-surface rounded-[12px] p-3 sm:p-3.5 flex items-center justify-between gap-3.5 hover:border-ink/25 transition-colors group"
                  >
                    <Link
                      href={`/book/${encodeURIComponent(bookKey)}`}
                      className="flex items-center gap-3.5 min-w-0 flex-1 focus:outline-none"
                    >
                      <div className="w-12 aspect-[2/3] shrink-0">
                        <Cover
                          coverUrl={book.coverUrl}
                          title={book.title}
                          author={book.author}
                          size="sm"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium truncate block">
                          {book.author}
                        </span>
                        <h3 className="font-serif text-[16px] sm:text-[17px] text-ink font-normal leading-snug truncate mt-0.5 group-hover:underline">
                          {book.title}
                        </h3>
                        <p className="text-[11.5px] text-muted font-sans tabular-nums mt-0.5 truncate">
                          {book.meta}
                        </p>
                      </div>
                    </Link>

                    {/* Quiet Download Icon Button */}
                    <div className="shrink-0 flex items-center">
                      {isDownloading ? (
                        <div
                          className="min-w-[44px] min-h-[44px] flex items-center justify-center"
                          aria-label="Downloading EPUB"
                        >
                          <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : isSaved ? (
                        <button
                          type="button"
                          onClick={() => router.push(`/reader/${bookKey}`)}
                          className="min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-full border border-hairline bg-surface text-ink text-[12px] font-sans flex items-center gap-1.5 hover:border-ink/40 transition-colors"
                          title="In offline library — Open reader"
                          aria-label="In offline library — Open reader"
                        >
                          <span
                            className="material-symbols-outlined text-[16px] text-accent"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                          >
                            check
                          </span>
                          <span className="hidden sm:inline text-muted">In Library</span>
                        </button>
                      ) : hasDownloadId ? (
                        <button
                          type="button"
                          onClick={(e) => handleDownloadGutenbergBook(e, book)}
                          className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-hairline bg-surface text-muted hover:text-ink hover:border-ink/40 transition-colors flex items-center justify-center"
                          title="Save to Library"
                          aria-label={`Save "${book.title}" to Library`}
                        >
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                          >
                            download
                          </span>
                        </button>
                      ) : (
                        <div
                          className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-hairline/50 text-muted/30 flex items-center justify-center cursor-not-allowed"
                          title="Download unavailable"
                          aria-label="Download unavailable"
                        >
                          <span
                            className="material-symbols-outlined text-[18px]"
                            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                          >
                            block
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
