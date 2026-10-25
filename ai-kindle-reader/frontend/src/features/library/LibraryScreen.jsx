'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLibraryBooks } from './hooks/useLibraryBooks';
import { LibraryViews } from './components/LibraryViews';
import { useTheme } from '@/components/common/ThemeProvider';
import { pluralize } from '@/lib/format';
import {
  PageHeader,
  Card,
  Button,
  Segmented,
  EmptyState,
  Skeleton,
} from '@/components/ui';

export function LibraryScreen() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const { openImportModal } = useTheme();
  const {
    booksList,
    filteredBooks,
    filterCounts,
    activeFilter,
    setActiveFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortLabel,
    cycleSort,
    loading,
    error,
    reload,
  } = useLibraryBooks();

  if (!isMounted) {
    return <div className="w-full min-h-dvh bg-background" />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="PERSONAL ARCHIVE"
        title="The Library"
        description={`Every book you keep · ${pluralize(booksList.length, 'volume')}`}
        action={
          <Segmented
            options={[
              { id: 'shelf', icon: 'view_column', label: <span className="hidden sm:inline">Shelf</span> },
              { id: 'grid', icon: 'grid_view', label: <span className="hidden sm:inline">Grid</span> },
              { id: 'list', icon: 'format_list_bulleted', label: <span className="hidden sm:inline">List</span> },
            ]}
            value={viewMode}
            onChange={setViewMode}
            size="sm"
          />
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Segmented
            options={[
              { id: 'all', label: `All (${filterCounts.all})` },
              { id: 'reading', label: `Reading (${filterCounts.reading})` },
              { id: 'finished', label: `Finished (${filterCounts.finished})` },
            ]}
            value={activeFilter}
            onChange={setActiveFilter}
            size="sm"
          />
        </div>

        <div className="flex items-center gap-2 flex-1 sm:max-w-xs">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-on-surface-variant">
              <span className="material-symbols-outlined text-[19px] font-[300]">
                search
              </span>
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title or author…"
              className="w-full min-h-[44px] pl-10 pr-4 py-2 text-[14px] font-sans rounded-full border border-outline-variant/30 bg-surface-container-low text-on-surface placeholder:text-on-surface-variant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors"
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

      {!loading && error && (
        <EmptyState
          icon="error"
          title="Library unavailable"
          description={error}
          action={
            <Button variant="primary" onClick={reload}>
              Retry
            </Button>
          }
        />
      )}

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

      {!loading && !error && filteredBooks.length > 0 && (
        <LibraryViews filteredBooks={filteredBooks} viewMode={viewMode} />
      )}
    </div>
  );
}

export default LibraryScreen;
