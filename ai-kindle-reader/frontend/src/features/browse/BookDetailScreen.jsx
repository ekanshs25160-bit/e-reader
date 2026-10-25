'use client';

import { useState, useEffect } from 'react';
import { useBookDetail } from './hooks/useBookDetail';
import { BookMetaDetails } from './components/BookMetaDetails';
import Cover from '@/components/ui/Cover';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';

export function BookDetailScreen() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
    book,
    loading,
    loadError,
    savedToLibrary,
    downloading,
    showFullSynopsis,
    setShowFullSynopsis,
    handleClose,
    handlePrimaryAction,
    router,
  } = useBookDetail();

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  const sheetClass =
    'relative z-30 w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] bg-surface/95 backdrop-blur-md rounded-t-[24px] md:rounded-[24px] border border-hairline flex flex-col overflow-hidden';

  const stage = (inner) => (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity"
      />
      {inner}
    </div>
  );

  if (loading) {
    return stage(
      <div
        data-overlay="sheet"
        role="dialog"
        aria-modal="true"
        className={`${sheetClass} p-6 sm:p-8 space-y-6`}
      >
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="w-36 md:w-52 aspect-[2/3] rounded-[12px] shrink-0 mx-auto md:mx-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !book) {
    return stage(
      <div
        data-overlay="sheet"
        role="dialog"
        aria-modal="true"
        className="relative z-30 w-full max-w-md bg-surface rounded-[24px] border border-hairline p-6 text-center space-y-4"
      >
        <span
          className="material-symbols-outlined text-muted text-[36px]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
        >
          error_outline
        </span>
        <h2 className="font-serif text-[22px] text-ink font-normal">
          {loadError || 'Volume not found'}
        </h2>
        <p className="text-[14px] text-muted font-sans">
          Could not locate volume information in your offline library or the catalog.
        </p>
        <div className="flex gap-2 w-full pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => router.push('/library')}>
            Library
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => router.push('/browse')}>
            The Commons
          </Button>
        </div>
      </div>
    );
  }

  return stage(
    <div
      data-overlay="sheet"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      className={sheetClass}
    >
      {/* Top Bar */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-hairline flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
          {book.gutenbergId ? `Project Gutenberg #${book.gutenbergId}` : 'Offline Library'}
        </span>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/30 transition-colors"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            close
          </span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 sm:px-8 py-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Large cover: Left on desktop, Top on phone */}
          <div className="w-36 sm:w-44 md:w-56 aspect-[2/3] shrink-0 mx-auto md:mx-0">
            <Cover
              coverUrl={book.coverUrl}
              title={book.title}
              author={book.authorText}
              size="lg"
              className="w-full h-full"
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            <div>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
                {book.isPublicDomain ? 'Public Domain' : 'Volume'}
              </span>
              <h1 className="font-serif text-[26px] sm:text-[32px] md:text-[36px] text-ink font-normal leading-tight break-words">
                {book.title}
              </h1>
              <p className="text-[15px] sm:text-[16px] text-muted font-sans font-medium mt-1">
                {book.authorText}
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Button
                variant="primary"
                size="md"
                onClick={handlePrimaryAction}
                disabled={downloading}
                icon={downloading ? null : savedToLibrary ? 'auto_stories' : 'download'}
                className="w-full sm:w-auto"
              >
                {downloading
                  ? 'Downloading EPUB…'
                  : savedToLibrary
                  ? 'Continue Reading'
                  : 'Save to Library'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => router.push(`/reader/${book.id}`)}
                className="w-full sm:w-auto"
              >
                Open Reader
              </Button>
            </div>

            {/* Book Metadata & Synopsis */}
            <BookMetaDetails
              book={book}
              showFullSynopsis={showFullSynopsis}
              setShowFullSynopsis={setShowFullSynopsis}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
