'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCatalogBrowse } from './hooks/useCatalogBrowse';
import { BrowseSearchHeader } from './components/BrowseSearchHeader';
import { CatalogRow } from './components/CatalogRow';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export function BrowseScreen() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const router = useRouter();
  const {
    searchQuery,
    setSearchQuery,
    selectedTopic,
    setSelectedTopic,
    liveSearchResults,
    setLiveSearchResults,
    searchTotal,
    setSearchTotal,
    isSearching,
    searchError,
    setSearchError,
    setSearchRetryKey,
    browseResults,
    isBrowsing,
    browseError,
    setBrowseRetryKey,
    isServerWaking,
    isBookInVault,
    handleDownloadGutenbergBook,
    downloadingIds,
    openImportModal,
  } = useCatalogBrowse();

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  const isSearchMode = Boolean(searchQuery.trim());
  const currentBooks = isSearchMode ? liveSearchResults : browseResults;
  const currentLoading = isSearchMode ? isSearching : isBrowsing;
  const currentError = isSearchMode ? searchError : browseError;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="PUBLIC DOMAIN CATALOG"
        title="The Commons"
        description="Curated classics from Project Gutenberg"
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={openImportModal}
            icon="cloud_upload"
            aria-label="Upload .epub"
          >
            <span className="hidden sm:inline">Upload .epub</span>
          </Button>
        }
      />

      {/* Search Input Bar & Topic Chips */}
      <BrowseSearchHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        isSearching={isSearching}
        isSearchMode={isSearchMode}
        selectedTopic={selectedTopic}
        setSelectedTopic={setSelectedTopic}
        onClearSearch={() => {
          setSearchQuery('');
          setLiveSearchResults(null);
          setSearchTotal(null);
          setSearchError(null);
        }}
      />

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
            {currentBooks.map((book) => (
              <CatalogRow
                key={book.id}
                book={book}
                isSaved={isBookInVault(book)}
                isDownloading={downloadingIds.has(book.id)}
                onOpenReader={(key) => router.push(`/reader/${key}`)}
                onDownload={handleDownloadGutenbergBook}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
