'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { getAllBooks, deleteBook } from '@/utils/db';
import { pluralize } from '@/lib/format';

const SPINE_PALETTES = [
  { bg: '#223348', text: '#e3e9f0', accent: '#97acc8' }, // deep navy
  { bg: '#53232b', text: '#f7e6e8', accent: '#e8b4b8' }, // burgundy
  { bg: '#2d4237', text: '#e2ede6', accent: '#a3c2b0' }, // forest green
  { bg: '#8a4e28', text: '#fdece2', accent: '#f5c6aa' }, // warm terracotta
  { bg: '#1c232c', text: '#d6dade', accent: '#9da7b3' }, // dark slate
  { bg: '#4a5859', text: '#ecefed', accent: '#b0c2c3' }, // sage teal
  { bg: '#3a2e39', text: '#eddfe7', accent: '#cbb3c2' }, // plum/aubergine
  { bg: '#5c4033', text: '#f5ebe6', accent: '#d2b48c' }, // leather brown
];

function hashString(str) {
  let hash = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getBookPalette(id) {
  const h = hashString(id);
  return SPINE_PALETTES[h % SPINE_PALETTES.length];
}

function getAuthorInitials(author) {
  const parts = String(author || 'Unknown').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Cover with image support and deterministic typographic fallback
 */
function BookCoverItem({ book, aspect = 'aspect-[2/3]' }) {
  const [imgFailed, setImgFailed] = useState(false);
  const palette = useMemo(() => getBookPalette(book.id), [book.id]);

  if (book.coverUrl && !imgFailed) {
    return (
      <div
        className={`relative ${aspect} w-full rounded-md overflow-hidden shadow-md bg-surface-container subtle-paper-border`}
      >
        <img
          src={book.coverUrl}
          alt={book.title}
          onError={() => setImgFailed(true)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/35 via-white/10 to-transparent pointer-events-none" />
      </div>
    );
  }

  // Typographic Fallback Cover
  return (
    <div
      style={{ backgroundColor: palette.bg, color: palette.text }}
      className={`relative ${aspect} w-full rounded-md overflow-hidden shadow-md p-2.5 flex flex-col justify-between border-l-[3px] border-black/30 subtle-paper-border select-none group-hover:scale-105 transition-transform duration-300`}
    >
      <div className="absolute inset-1.5 border border-white/20 rounded pointer-events-none" />
      <div className="text-right z-10">
        <span
          style={{ color: palette.accent }}
          className="text-[8px] font-caption tracking-widest uppercase"
        >
          {book.year || 'Flyleaf'}
        </span>
      </div>
      <div className="text-center z-10 px-0.5 my-auto">
        <h4 className="font-headline-md text-[12px] leading-tight font-serif font-medium line-clamp-3">
          {book.title}
        </h4>
        <p
          style={{ color: palette.accent }}
          className="text-[9px] font-caption mt-1 truncate"
        >
          {book.author}
        </p>
      </div>
      <div className="z-10 flex justify-between items-center text-[9px] font-caption border-t border-white/15 pt-0.5">
        <span style={{ color: palette.accent }} className="truncate max-w-[50px]">
          {book.category || 'Vault'}
        </span>
        <span className="font-semibold">{book.progressPercentage || 0}%</span>
      </div>
      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
    </div>
  );
}

/**
 * Dynamic Shelf Spine
 */
function ShelfSpine({ book }) {
  const palette = useMemo(() => getBookPalette(book.id), [book.id]);
  const authorInitials = useMemo(() => getAuthorInitials(book.author), [book.author]);

  const pages = Number(book.totalPages || book.pages) || 0;
  const heightPx =
    pages > 0
      ? Math.min(195, Math.max(145, 145 + Math.round(((pages - 100) / 700) * 50)))
      : 165;

  return (
    <Link
      href={`/reader/${encodeURIComponent(book.id)}`}
      style={{
        height: `${heightPx}px`,
        backgroundColor: palette.bg,
        color: palette.text,
      }}
      className="group relative flex-shrink-0 w-11 rounded-t-[4px] p-1.5 flex flex-col justify-between spine-shadow-left cursor-pointer transition-transform duration-200 hover:-translate-y-2 active:scale-95 border-l border-white/10"
      title={`${book.title} by ${book.author}`}
    >
      <div className="flex justify-between items-center w-full border-b border-white/20 pb-0.5">
        <span
          style={{ color: palette.accent }}
          className="text-[7px] font-caption tracking-widest uppercase truncate max-w-[24px]"
        >
          {book.year ? String(book.year).slice(-2) : '•'}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: palette.accent }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden py-1">
        <span className="spine-book font-headline-sm text-[11px] tracking-wider uppercase font-medium truncate">
          {book.title}
        </span>
      </div>

      <div className="border-t border-white/20 pt-0.5 text-center">
        <span
          style={{ color: palette.accent }}
          className="font-body-ui-bold text-[8px] tracking-wider"
        >
          {authorInitials}
        </span>
      </div>
    </Link>
  );
}

export default function Page() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { openImportModal, showToast } = useTheme();

  const [viewMode, setViewMode] = useState('grid'); // 'spine' | 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reading' | 'finished' | 'to-read'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'title' | 'progress'
  const [booksList, setBooksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookToDelete, setBookToDelete] = useState(null);

  useEffect(() => {
    let active = true;

    async function fetchVaultBooks() {
      setLoading(true);
      try {
        const vaultBooks = await getAllBooks();
        if (active) {
          const loaded = (vaultBooks || []).map((b) => {
            const pct =
              b.progressPercentage !== undefined
                ? b.progressPercentage
                : b.progress !== undefined
                ? b.progress
                : 0;
            return {
              ...b,
              progressPercentage: pct,
              status:
                b.status || (pct >= 100 ? 'finished' : pct > 0 ? 'reading' : 'to-read'),
              hasBinary: Boolean(b.hasBinary),
            };
          });
          setBooksList(loaded);
        }
      } catch (err) {
        console.warn('Failed to load books from vault:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchVaultBooks();
    return () => {
      active = false;
    };
  }, []);

  // Real Counts for Filter Tabs
  const counts = useMemo(() => {
    let reading = 0;
    let finished = 0;
    let toRead = 0;

    booksList.forEach((b) => {
      const pct = b.progressPercentage || 0;
      const status = b.status || (pct >= 100 ? 'finished' : pct > 0 ? 'reading' : 'to-read');
      if (status === 'finished' || pct >= 100) {
        finished++;
      } else if (status === 'reading' || pct > 0) {
        reading++;
      } else {
        toRead++;
      }
    });

    return {
      all: booksList.length,
      reading,
      finished,
      toRead,
    };
  }, [booksList]);

  // Filtered & Sorted Book Collection
  const filteredBooks = useMemo(() => {
    let list = booksList.filter((b) => {
      const pct = b.progressPercentage || 0;
      const status = b.status || (pct >= 100 ? 'finished' : pct > 0 ? 'reading' : 'to-read');

      if (activeFilter === 'reading') {
        if (status !== 'reading' && pct === 0) return false;
        if (pct >= 100) return false;
      } else if (activeFilter === 'finished') {
        if (status !== 'finished' && pct < 100) return false;
      } else if (activeFilter === 'to-read') {
        if (status !== 'to-read' && pct > 0) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (b.title || '').toLowerCase().includes(q);
        const matchAuthor = (b.author || '').toLowerCase().includes(q);
        return matchTitle || matchAuthor;
      }

      return true;
    });

    if (sortBy === 'title') {
      list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'progress') {
      list = [...list].sort((a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0));
    } else {
      // 'recent'
      list = [...list].sort(
        (a, b) =>
          (b.lastReadTimestamp || b.addedAt || 0) - (a.lastReadTimestamp || a.addedAt || 0)
      );
    }

    return list;
  }, [activeFilter, booksList, searchQuery, sortBy]);

  const cycleSort = () => {
    const next = sortBy === 'recent' ? 'title' : sortBy === 'title' ? 'progress' : 'recent';
    setSortBy(next);
    showToast(
      `Sorted by ${
        next === 'recent'
          ? 'Recent'
          : next === 'title'
          ? 'Title (A–Z)'
          : 'Reading Progress'
      }`
    );
  };

  // Real Footer Counts
  const totalBooksKept = booksList.length;
  const totalPagesRead = booksList.reduce(
    (acc, b) =>
      acc +
      (b.currentPage ||
        Math.round(((b.progressPercentage || 0) / 100) * (b.totalPages || b.pages || 0)) ||
        0),
    0
  );

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased selection:bg-secondary-container selection:text-on-secondary">
      <div className="w-full bg-background relative flex-col overflow-x-hidden pb-28 md:pb-10">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-80 bg-gradient-to-b from-[#dce9f5]/70 dark:from-[#1c2438] via-[#e9f0f6]/40 dark:via-[#161c2d]/70 to-transparent z-0"></div>

        {/* Header Bar */}
        <section className="relative z-10 px-5 md:px-8 pt-3 pb-2">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight font-normal">
                The Library
              </h2>
              <p className="font-body-ui text-label-md text-on-surface-variant mt-0.5">
                every book you keep ·{' '}
                <span className="font-body-ui-bold text-on-surface">
                  {pluralize(filteredBooks.length, 'volume')}
                </span>
              </p>
            </div>
            <div className="flex items-center p-1 bg-surface-container-high/70 backdrop-blur-md rounded-full subtle-paper-border shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode('spine')}
                className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  viewMode === 'spine'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Spine Shelf View"
              >
                <span className="material-symbols-outlined text-[17px]">view_column</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  viewMode === 'grid'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Cover Grid View"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  grid_view
                </span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`w-7 h-7 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                  viewMode === 'list'
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
                title="Compact List View"
              >
                <span className="material-symbols-outlined text-[17px]">
                  format_list_bulleted
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Search & Sort & Filter Bar */}
        <section className="relative z-10 px-5 md:px-8 py-3">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-on-surface-variant/70">
                <span className="material-symbols-outlined text-[19px]">search</span>
              </span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-surface-container-lowest/80 backdrop-blur-md subtle-paper-border rounded-xl font-body-ui text-label-md text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-surface-tint focus:border-surface-tint transition-all shadow-sm"
                placeholder="Search title or author..."
                type="text"
              />
            </div>
            <button
              type="button"
              onClick={cycleSort}
              className="relative w-9 h-9 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md subtle-paper-border flex items-center justify-center text-on-surface-variant hover:text-primary active:scale-95 shadow-sm transition-all"
              title={`Sort by ${sortBy}`}
            >
              <span className="material-symbols-outlined text-[19px]">swap_vert</span>
            </button>
          </div>
        </section>

        {/* Shelf Spines (Generated from all stored books) */}
        {booksList.length > 0 && viewMode !== 'list' && (
          <section className="relative z-10 mt-2 px-5 md:px-8">
            <div className="flex justify-between items-baseline mb-2.5">
              <div className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <h3 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                  Current Shelf
                </h3>
                <span className="font-body-ui text-caption text-on-surface-variant">
                  · On The Desk
                </span>
              </div>
              <button
                type="button"
                onClick={cycleSort}
                className="text-caption font-body-ui-bold text-on-surface-variant hover:text-primary transition-colors flex items-center space-x-0.5"
              >
                <span>Arrange</span>
                <span className="material-symbols-outlined text-[14px]">tune</span>
              </button>
            </div>

            <div className="relative bg-surface-container-low/70 rounded-2xl p-3 pb-0 subtle-paper-border shadow-sm overflow-hidden backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-b from-white/40 dark:from-white/[0.04] to-transparent pointer-events-none"></div>
              <div className="flex items-end justify-start space-x-2 overflow-x-auto no-scrollbar pt-2 pb-1 relative z-10 px-1">
                {booksList.map((book) => (
                  <ShelfSpine key={book.id} book={book} />
                ))}
              </div>
              {/* Shelf wooden ledge */}
              <div className="h-3.5 -mx-3 bg-gradient-to-r from-[#d8cebe] via-[#e5dccf] to-[#d8cebe] dark:from-[#262F42] dark:via-[#2F3A52] dark:to-[#222B3C] border-t border-[#c5baaa] dark:border-white/10 flex items-center px-4 shadow-sm">
                <div className="w-full h-[1px] bg-white/40 dark:bg-white/10"></div>
              </div>
              <div className="h-2 -mx-3 bg-gradient-to-b from-[#b8ab99]/60 to-[#a39482]/20 dark:from-black/40 dark:to-transparent"></div>
            </div>
          </section>
        )}

        {/* Main Book Feed & Filters */}
        <section className="relative z-10 px-5 md:px-8 pt-6">
          <div className="flex flex-col space-y-2.5 mb-4">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                All Books
              </h3>
              <span className="font-body-ui text-caption text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded-full">
                Vault • Local-first
              </span>
            </div>

            {/* Filters: All / Reading / Finished / To read */}
            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'all', label: `All (${counts.all})` },
                { id: 'reading', label: `Reading (${counts.reading})` },
                { id: 'finished', label: `Finished (${counts.finished})` },
                { id: 'to-read', label: `To read (${counts.toRead})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-3 py-1 rounded-full text-caption active:scale-95 transition-all shrink-0 ${
                    activeFilter === tab.id
                      ? 'font-body-ui-bold bg-primary text-on-primary shadow-sm'
                      : 'font-body-ui text-on-surface-variant bg-surface-container-lowest/90 subtle-paper-border hover:bg-surface-container'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 md:gap-x-5 gap-y-5 md:gap-y-7 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col space-y-2">
                  <div className="aspect-[2/3] w-full rounded-md bg-surface-container-high" />
                  <div className="h-3 w-3/4 bg-surface-container-high rounded" />
                  <div className="h-2 w-1/2 bg-surface-container-high rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State when Library is empty */}
          {!loading && booksList.length === 0 && (
            <div className="bg-surface-container-lowest/90 backdrop-blur-sm border border-black/[0.06] rounded-[24px] p-8 md:p-12 text-center shadow-xs flex flex-col items-center justify-center my-8">
              <div className="w-16 h-16 rounded-full bg-secondary/10 border border-secondary/20 text-secondary flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px]">local_library</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary font-medium mb-1">
                Your library is empty
              </h3>
              <p className="font-body-ui text-body-ui text-on-surface-variant max-w-sm leading-relaxed mb-6">
                Explore free public domain classics in The Commons or import your own EPUB files.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Link
                  href="/browse"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md font-medium hover:opacity-90 active:scale-95 transition shadow-sm flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">explore</span>
                  <span>Browse The Commons</span>
                </Link>
                <button
                  type="button"
                  onClick={openImportModal}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-surface-container border border-outline-variant/30 text-on-surface hover:bg-surface-container-high active:scale-95 transition text-label-md font-medium flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">upload_file</span>
                  <span>Import EPUB</span>
                </button>
              </div>
            </div>
          )}

          {/* No search results empty state */}
          {!loading && booksList.length > 0 && filteredBooks.length === 0 && (
            <div className="p-8 text-center bg-surface-container-lowest/60 rounded-2xl border border-outline-variant/20 my-6">
              <p className="text-sm text-on-surface font-medium mb-1">
                No books match your criteria
              </p>
              <p className="text-xs text-on-surface-variant mb-4">
                Try searching for a different title or resetting your filter.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
                className="px-4 py-1.5 rounded-full bg-surface-container text-xs font-semibold text-primary hover:bg-surface-container-high transition"
              >
                Reset Filters
              </button>
            </div>
          )}

          {/* List View Mode */}
          {!loading && viewMode === 'list' && filteredBooks.length > 0 && (
            <div className="space-y-2.5">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="bg-surface-container-lowest/90 border border-outline-variant/30 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-all group"
                >
                  <Link
                    href={`/reader/${encodeURIComponent(book.id)}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <div className="w-10 aspect-[2/3] shrink-0">
                      <BookCoverItem book={book} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-headline-sm text-[15px] text-primary font-medium truncate group-hover:underline">
                        {book.title}
                      </h4>
                      <p className="font-caption text-caption text-on-surface-variant truncate">
                        {book.author} · {book.year || 'Volume'}
                      </p>
                      {/* Progress Bar */}
                      <div className="w-28 h-1 bg-surface-container-high rounded-full mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full"
                          style={{ width: `${book.progressPercentage || 0}%` }}
                        />
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 shrink-0">
                    {book.hasBinary === false && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-label-sm text-amber-600 dark:text-amber-400">
                        <span className="material-symbols-outlined text-[12px]">cloud_off</span>
                        <span>Not downloaded</span>
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-full bg-surface-container text-caption font-label-sm text-primary">
                      {book.progressPercentage === 100
                        ? 'Done'
                        : `${book.progressPercentage || 0}%`}
                    </span>

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setBookToDelete(book);
                      }}
                      title="Delete book from vault"
                      className="p-1.5 rounded-full text-on-surface-variant hover:text-red-500 hover:bg-red-500/10 transition"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>

                    <Link href={`/reader/${encodeURIComponent(book.id)}`}>
                      <span className="material-symbols-outlined text-[18px] text-outline">
                        chevron_right
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grid View Mode */}
          {!loading && viewMode !== 'list' && filteredBooks.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-3 md:gap-x-5 gap-y-5 md:gap-y-7">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="flex flex-col group relative transition-transform"
                >
                  {/* Delete button on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setBookToDelete(book);
                    }}
                    title="Delete book"
                    className="absolute top-1.5 right-1.5 z-20 w-6 h-6 rounded-full bg-black/75 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                  >
                    <span className="material-symbols-outlined text-[13px]">delete</span>
                  </button>

                  <Link href={`/reader/${encodeURIComponent(book.id)}`} className="cursor-pointer active:scale-95 transition-transform">
                    {book.hasBinary === false && (
                      <div className="absolute top-1.5 left-1.5 z-20 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-amber-500/40 text-[9px] font-label-sm text-amber-300 shadow-sm pointer-events-none">
                        <span className="material-symbols-outlined text-[11px]">cloud_off</span>
                        <span>Not downloaded</span>
                      </div>
                    )}

                    <BookCoverItem book={book} />

                    <div className="mt-2 flex flex-col">
                      <h4 className="font-headline-sm text-[13px] leading-tight text-on-surface line-clamp-1 group-hover:text-primary">
                        {book.title}
                      </h4>
                      <p className="font-body-ui text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5 truncate">
                        {book.author}
                      </p>

                      {/* Per-book progress bar using progressPercentage */}
                      <div className="w-full h-1 bg-[#E2EBF1] dark:bg-surface-container-high rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            book.progressPercentage === 100 ? 'bg-primary w-full' : 'bg-secondary'
                          }`}
                          style={
                            book.progressPercentage === 100
                              ? undefined
                              : { width: `${book.progressPercentage || 0}%` }
                          }
                        />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Footer Metrics */}
          {booksList.length > 0 && (
            <div className="mt-8 mb-4 flex items-center justify-center">
              <Link
                href="/stats"
                className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-surface-container/60 backdrop-blur-md subtle-paper-border text-on-surface-variant hover:text-primary font-body-ui text-caption shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">auto_stories</span>
                <span>
                  {pluralize(totalBooksKept, 'book')} kept ·{' '}
                  {pluralize(totalPagesRead, 'page')} read
                </span>
              </Link>
            </div>
          )}
        </section>

        {/* Delete Confirmation Modal */}
        {bookToDelete && (
          <div
            onClick={() => setBookToDelete(null)}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-fade-in"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-surface-container-lowest text-on-surface rounded-2xl border border-outline-variant/30 shadow-2xl p-5 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">delete_forever</span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-primary">
                    Delete Book?
                  </h3>
                  <p className="font-caption text-caption text-on-surface-variant">
                    Remove from offline vault
                  </p>
                </div>
              </div>

              <p className="font-body-ui text-on-surface-variant text-xs leading-relaxed">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-primary">“{bookToDelete.title}”</span>? This
                will remove its offline file, reading marks, and highlights from this device.
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBookToDelete(null)}
                  className="flex-1 py-2 px-3 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-semibold text-on-surface hover:bg-surface-container-high active:scale-95 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const b = bookToDelete;
                    setBookToDelete(null);
                    await deleteBook(b.id);
                    setBooksList((prev) => prev.filter((item) => item.id !== b.id));
                    showToast(`Deleted "${b.title}" from library`);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-red-600 text-white text-xs font-semibold hover:bg-red-500 active:scale-95 transition shadow-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Add Book Button */}
        <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-40">
          <button
            type="button"
            onClick={openImportModal}
            className="w-12 h-12 rounded-full bg-primary-container text-on-primary shadow-lg shadow-primary/20 flex items-center justify-center hover:bg-primary active:scale-95 transition-all subtle-paper-border"
            title="Add Book (.epub, .txt)"
          >
            <span className="material-symbols-outlined text-[24px]">add</span>
          </button>
        </div>
      </div>
    </div>
  );
}
