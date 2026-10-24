'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { getAllBooks, deleteBook } from '@/utils/db';
import { pluralize } from '@/lib/format';
import {
  PageHeader,
  Card,
  Button,
  Segmented,
  ProgressLine,
  Cover,
  EmptyState,
  Skeleton,
} from '@/components/ui';

const SPINE_TONES = [
  { bg: '#152A41', text: '#FAF9F6', accent: '#855224' }, // Navy / Bronze
  { bg: '#223348', text: '#E3E9F0', accent: '#97ACC8' }, // Deep Slate
  { bg: '#2D4237', text: '#E2EDE6', accent: '#A3C2B0' }, // Forest
  { bg: '#5C4033', text: '#F5EBE6', accent: '#D2B48C' }, // Leather
  { bg: '#4A5859', text: '#ECEFED', accent: '#B0C2C3' }, // Sage
  { bg: '#3A2E39', text: '#EDDFE7', accent: '#CBB3C2' }, // Aubergine
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

function getSpineTone(id) {
  const h = hashString(id);
  return SPINE_TONES[h % SPINE_TONES.length];
}

function getAuthorInitials(author) {
  const parts = String(author || 'Unknown').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Flat Shelf Spine (Editorial spec: flat ink/bronze tones, no 3D gradients or shadows)
 */
function FlatShelfSpine({ book }) {
  const tone = useMemo(() => getSpineTone(book.id), [book.id]);
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
        backgroundColor: tone.bg,
        color: tone.text,
      }}
      className="group relative flex-shrink-0 w-11 rounded-t-[4px] p-2 flex flex-col justify-between border-l border-hairline/30 select-none transition-transform duration-200 hover:-translate-y-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      title={`${book.title} by ${book.author}`}
      aria-label={`${book.title} by ${book.author}`}
    >
      <div className="flex justify-between items-center w-full border-b border-white/20 pb-1">
        <span
          style={{ color: tone.accent }}
          className="text-[7.5px] font-sans tracking-widest uppercase truncate max-w-[24px]"
        >
          {book.year ? String(book.year).slice(-2) : '•'}
        </span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: tone.accent }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden py-1">
        <span className="font-serif text-[11px] tracking-wider uppercase font-normal truncate -rotate-90 whitespace-nowrap block">
          {book.title}
        </span>
      </div>

      <div className="border-t border-white/20 pt-1 text-center">
        <span
          style={{ color: tone.accent }}
          className="font-sans font-medium text-[8px] tracking-wider"
        >
          {authorInitials}
        </span>
      </div>
    </Link>
  );
}

export default function LibraryPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { openImportModal } = useTheme();

  const [booksList, setBooksList] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'reading' | 'finished'
  const [viewMode, setViewMode] = useState('grid'); // 'shelf' | 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'title' | 'progress'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = await getAllBooks();
      setBooksList(stored || []);
    } catch (err) {
      console.error('Failed to load library:', err);
      setError('Could not access stored volumes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Counts for Segmented Filter
  const filterCounts = useMemo(() => {
    const all = booksList.length;
    const reading = booksList.filter(
      (b) => b.status === 'reading' || ((b.progressPercentage || 0) > 0 && (b.progressPercentage || 0) < 100)
    ).length;
    const finished = booksList.filter(
      (b) => b.status === 'finished' || (b.progressPercentage || 0) >= 100
    ).length;
    return { all, reading, finished };
  }, [booksList]);

  // Filtered and Sorted Books
  const filteredBooks = useMemo(() => {
    let list = booksList.filter((b) => {
      if (activeFilter === 'reading') {
        const p = b.progressPercentage || 0;
        return b.status === 'reading' || (p > 0 && p < 100);
      }
      if (activeFilter === 'finished') {
        const p = b.progressPercentage || 0;
        return b.status === 'finished' || p >= 100;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'title') {
      list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'progress') {
      list = [...list].sort(
        (a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0)
      );
    } else {
      list = [...list].sort(
        (a, b) => (b.lastRead || b.addedAt || 0) - (a.lastRead || a.addedAt || 0)
      );
    }

    return list;
  }, [activeFilter, booksList, searchQuery, sortBy]);

  const cycleSort = () => {
    const next = sortBy === 'recent' ? 'title' : sortBy === 'title' ? 'progress' : 'recent';
    setSortBy(next);
  };

  const sortLabel = {
    recent: 'Recent',
    title: 'Title A–Z',
    progress: 'Progress',
  }[sortBy];

  if (!isMounted) {
    return <div className="w-full min-h-dvh bg-background" />;
  }

  return (
    <div className="space-y-8 md:space-y-10">
      {/* Editorial Page Header */}
      <PageHeader
        eyebrow="Collection"
        title="Library"
        description={
          booksList.length > 0
            ? `${pluralize(booksList.length, 'volume')} stored in your local sanctuary.`
            : 'Your personal book collection is empty.'
        }
        action={
          <Button
            variant="primary"
            onClick={openImportModal}
            icon="add"
          >
            Import EPUB
          </Button>
        }
      />

      {/* Control Bar: Filters, Views, and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
        {/* Hairline Segmented Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            options={[
              { id: 'all', label: `All (${filterCounts.all})` },
              { id: 'reading', label: `Reading (${filterCounts.reading})` },
              { id: 'finished', label: `Finished (${filterCounts.finished})` },
            ]}
            value={activeFilter}
            onChange={setActiveFilter}
            size="md"
          />

          {/* View Mode Switcher */}
          <Segmented
            options={[
              { id: 'shelf', icon: 'view_column', label: 'Shelf' },
              { id: 'grid', icon: 'grid_view', label: 'Grid' },
              { id: 'list', icon: 'format_list_bulleted', label: 'List' },
            ]}
            value={viewMode}
            onChange={setViewMode}
            size="md"
          />
        </div>

        {/* Search and Sort */}
        <div className="flex items-center gap-3 flex-1 lg:max-w-md">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted">
              <span className="material-symbols-outlined text-[19px] font-[300]">
                search
              </span>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title or author…"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-[14px] font-sans rounded-full border border-hairline bg-surface text-ink placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
            />
          </div>

          <Button
            variant="secondary"
            onClick={cycleSort}
            icon="swap_vert"
            className="shrink-0"
            aria-label={`Sorted by ${sortLabel}. Click to change.`}
          >
            {sortLabel}
          </Button>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton variant="card" height="240px" />
              <Skeleton variant="text" width="80%" />
              <Skeleton variant="text" width="50%" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <EmptyState
          icon="error"
          title="Library unavailable"
          description={error}
          action={
            <Button variant="primary" onClick={loadLibrary}>
              Retry
            </Button>
          }
        />
      )}

      {/* Empty State when no books exist */}
      {!loading && !error && booksList.length === 0 && (
        <EmptyState
          icon="auto_stories"
          title="Your collection is empty"
          description="Import an EPUB file from your device or browse curated public domain titles."
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

      {/* No Search Matches */}
      {!loading && !error && booksList.length > 0 && filteredBooks.length === 0 && (
        <Card className="p-8 text-center">
          <p className="font-serif text-[18px] text-ink mb-2">
            No matching volumes found
          </p>
          <p className="font-sans text-[14px] text-muted mb-4">
            Try adjusting your search query or filter criteria.
          </p>
          <Button variant="secondary" onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}>
            Reset filters
          </Button>
        </Card>
      )}

      {/* 1. SHELF VIEW: Flat Spines on a Hairline Shelf Line */}
      {!loading && !error && filteredBooks.length > 0 && viewMode === 'shelf' && (
        <div className="space-y-4">
          <div className="flex items-end gap-1.5 overflow-x-auto pb-1 pt-6 px-2 scrollbar-none">
            {filteredBooks.map((book) => (
              <FlatShelfSpine key={book.id} book={book} />
            ))}
          </div>
          {/* Hairline Shelf Line (Spec: shelf line = hairline) */}
          <div className="w-full border-b border-hairline" />
        </div>
      )}

      {/* 2. GRID VIEW: Flat Cover Grid with Typographic Fallback & ProgressLine */}
      {!loading && !error && filteredBooks.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/reader/${encodeURIComponent(book.id)}`}
              className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[10px]"
              aria-label={`Read ${book.title} by ${book.author}`}
            >
              <Cover
                src={book.coverUrl}
                title={book.title}
                author={book.author}
                aspect="aspect-[2/3]"
              />
              <ProgressLine
                value={book.progressPercentage || 0}
                className="mt-3"
              />
              <h3 className="font-serif text-[15px] sm:text-[16.5px] text-ink font-normal leading-snug line-clamp-2 mt-2 group-hover:text-accent transition-colors">
                {book.title}
              </h3>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mt-1 truncate">
                {book.author || 'Unknown Author'}
              </span>
            </Link>
          ))}
        </div>
      )}

      {/* 3. LIST VIEW: Flat Hairline Rows */}
      {!loading && !error && filteredBooks.length > 0 && viewMode === 'list' && (
        <div className="border border-hairline rounded-[12px] bg-surface overflow-hidden divide-y divide-hairline">
          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/reader/${encodeURIComponent(book.id)}`}
              className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-hairline/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              aria-label={`Read ${book.title} by ${book.author}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 aspect-[2/3] shrink-0">
                  <Cover
                    src={book.coverUrl}
                    title={book.title}
                    author={book.author}
                    aspect="aspect-[2/3]"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-[16px] text-ink font-normal leading-snug truncate">
                    {book.title}
                  </h3>
                  <p className="font-sans text-[13px] text-muted truncate mt-0.5">
                    {book.author || 'Unknown Author'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="w-24 hidden sm:block">
                  <ProgressLine value={book.progressPercentage || 0} />
                </div>
                <span className="text-[12px] font-sans font-medium text-muted tabular-nums">
                  {book.progressPercentage || 0}%
                </span>
                <span className="material-symbols-outlined text-[18px] text-muted group-hover:text-ink transition-colors">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
