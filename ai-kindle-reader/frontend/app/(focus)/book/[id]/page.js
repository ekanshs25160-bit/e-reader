'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBookById } from '@/utils/booksData';
import { useTheme } from '@/components/common/ThemeProvider';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useTheme();
  const book = getBookById(params?.id);

  const [expandedSynopsis, setExpandedSynopsis] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(book.status !== 'to-read');

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/browse');
    }
  };

  const handlePrimaryAction = () => {
    if (!savedToLibrary) {
      setSavedToLibrary(true);
      showToast(`Saved "${book.title}" to your offline Library`);
    } else {
      router.push(`/reader/${book.id}`);
    }
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased font-body-ui selection:bg-secondary-container/40 selection:text-secondary">
      <div className="relative w-full min-h-dvh bg-surface flex flex-col md:py-8 md:bg-background">
        <div className="relative z-30 w-full flex-1 md:flex-none md:max-w-3xl md:mx-auto bg-surface md:rounded-3xl md:border md:border-outline-variant/50 md:shadow-xl flex flex-col border-t border-outline-variant/50 shadow-[0_-8px_32px_rgba(21,42,65,0.18)] overflow-hidden animate-in slide-in-from-bottom duration-300">
          <div className="flex-shrink-0 pt-2.5 pb-2 px-5 flex flex-col border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md">
            <div className="md:hidden w-10 h-1.5 bg-outline-variant/70 rounded-full mx-auto mb-2"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-secondary">book</span>
                <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Project Gutenberg #{book.gutenbergId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close book details"
                className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all text-on-surface-variant flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          <div className="flex-1 no-scrollbar px-5 md:px-8 pt-4 pb-28 md:pb-6 space-y-5">
            <div className="flex items-start gap-4 pt-1">
              <div
                onClick={() => router.push(`/reader/${book.id}`)}
                className="relative flex-shrink-0 w-28 sm:w-32 aspect-[3/4.2] rounded-lg overflow-hidden book-spine-effect border border-black/10 bg-primary-container cursor-pointer group"
              >
                <img
                  alt={`${book.title} by ${book.author} vintage book cover`}
                  className="w-full h-full object-cover select-none group-hover:scale-105 transition-transform duration-300"
                  src={book.coverUrl}
                />
                <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none"></div>
              </div>

              <div className="flex-1 flex flex-col justify-start min-w-0">
                <div className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-secondary-fixed/50 border border-secondary/20 mb-1.5">
                  <span className="material-symbols-outlined text-[12px] text-secondary">
                    public
                  </span>
                  <span className="text-label-sm font-label-sm text-secondary font-semibold tracking-tight">
                    PUBLIC DOMAIN
                  </span>
                </div>
                <h1 className="font-headline-md text-headline-md text-primary tracking-tight leading-tight mb-1">
                  {book.title}
                </h1>
                <p className="font-label-md text-label-md text-on-surface-variant tracking-wider font-semibold uppercase mb-2">
                  {book.author}
                </p>
                <div className="flex items-center gap-1.5 text-caption font-caption text-on-surface-variant">
                  <div className="flex items-center text-secondary">
                    <span
                      className="material-symbols-outlined text-[15px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-bold ml-0.5 text-on-surface">{book.rating}</span>
                  </div>
                  <span>·</span>
                  <span>{book.year}</span>
                  <span>·</span>
                  <span className="truncate">{book.category}</span>
                </div>
                <p className="mt-2 text-caption font-caption text-outline italic">
                  {book.editionNote}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 divide-x divide-outline-variant/30 bg-surface-container-lowest/80 border border-outline-variant/40 rounded-xl py-2.5 px-1 shadow-sm text-center">
              <div className="flex flex-col items-center px-2">
                <span className="font-headline-sm text-headline-sm text-primary font-semibold leading-none mb-1">
                  {book.language}
                </span>
                <span className="text-label-sm font-label-sm text-outline tracking-wider uppercase">
                  Language
                </span>
              </div>
              <div className="flex flex-col items-center px-2">
                <span className="font-headline-sm text-headline-sm text-primary font-semibold leading-none mb-1">
                  {book.size}
                </span>
                <span className="text-label-sm font-label-sm text-outline tracking-wider uppercase">
                  File Size
                </span>
              </div>
              <div className="flex flex-col items-center px-2">
                <span className="font-headline-sm text-headline-sm text-primary font-semibold leading-none mb-1">
                  ~{book.pages}
                </span>
                <span className="text-label-sm font-label-sm text-outline tracking-wider uppercase">
                  Pages
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider block">
                Themes &amp; Context
              </span>
              <div className="flex flex-wrap gap-1.5">
                {book.themes.map((theme) => (
                  <span
                    key={theme}
                    className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface-variant text-label-md font-label-md"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1 border-t border-outline-variant/20">
              <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                About this edition
              </h2>
              <p className="font-body-reading text-[16px] leading-[26px] text-on-surface/90">
                {book.synopsis}
              </p>
              {expandedSynopsis && book.extendedSynopsis && (
                <p className="font-body-reading text-[16px] leading-[26px] text-on-surface/90 pt-1 animate-in fade-in duration-200">
                  {book.extendedSynopsis}
                </p>
              )}
              <button
                type="button"
                onClick={() => setExpandedSynopsis((v) => !v)}
                className="inline-flex items-center gap-1 text-label-md font-label-md text-primary font-semibold hover:underline"
              >
                <span>{expandedSynopsis ? 'Show less' : 'Read full synopsis'}</span>
                <span className="material-symbols-outlined text-[16px]">
                  {expandedSynopsis ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            <div className="bg-secondary-fixed/30 border border-secondary-container rounded-xl p-3.5 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary-container/40 flex items-center justify-center flex-shrink-0 text-secondary">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-label-md font-label-md text-on-secondary-container font-semibold">
                    Local AI Reading Companion
                  </span>
                  <span className="text-[10px] bg-secondary text-on-secondary px-1.5 py-0.2 rounded font-mono font-medium">
                    OFFLINE
                  </span>
                </div>
                <p className="text-caption font-caption text-on-secondary-fixed-variant leading-relaxed">
                  Includes spoiler-free AI X-Ray, historical character guide &amp; instant dictionary
                  — entirely offline in your local vault.
                </p>
              </div>
            </div>

            <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-outline">
                  font_download
                </span>
                <span className="text-caption font-caption">Pre-formatted in Literata Book</span>
              </div>
              <span className="text-label-sm font-label-sm text-secondary font-medium">
                Optimized Typometry
              </span>
            </div>
          </div>

          <footer className="sticky bottom-0 md:rounded-b-3xl bg-surface/95 backdrop-blur-md pt-3 pb-5 px-5 border-t border-outline-variant/30 flex flex-col gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="w-full py-3.5 px-5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-body-ui-bold text-body-ui-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150"
            >
              <span className="material-symbols-outlined text-[20px]">
                {savedToLibrary ? 'auto_stories' : 'download'}
              </span>
              <span>
                {savedToLibrary
                  ? 'Saved in Library · Open in Reader'
                  : 'Save to Library (Offline EPUB)'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => router.push(`/reader/${book.id}`)}
              className="w-full py-2.5 px-4 rounded-full border border-outline-variant/60 bg-surface-container-lowest/70 hover:bg-surface-container text-on-surface font-body-ui text-body-ui text-center active:scale-[0.98] transition-all duration-150"
            >
              Read Preview
            </button>
            <div className="flex items-center justify-center gap-1.5 pt-0.5 text-caption font-caption text-outline">
              <span className="material-symbols-outlined text-[14px] text-secondary">
                verified_user
              </span>
              <span>Saved locally on device · No tracking or cloud required</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
