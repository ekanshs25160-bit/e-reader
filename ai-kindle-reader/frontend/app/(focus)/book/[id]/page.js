'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getBookById } from '@/utils/booksData';
import { useTheme } from '@/components/common/ThemeProvider';
import { saveBook, getBook } from '@/utils/db';

export default function Page() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useTheme();
  const book = getBookById(params?.id);

  const [expandedSynopsis, setExpandedSynopsis] = useState(false);
  const [savedToLibrary, setSavedToLibrary] = useState(book.status !== 'to-read');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    async function checkSavedState() {
      try {
        const stored = await getBook(book.id);
        if (stored && active) {
          setSavedToLibrary(true);
        }
      } catch (err) {
        console.warn('Error reading book saved state:', err);
      }
    }
    checkSavedState();
    return () => {
      active = false;
    };
  }, [book.id]);

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/browse');
    }
  };

  const handlePrimaryAction = async () => {
    if (!savedToLibrary) {
      setDownloading(true);
      showToast(`Downloading "${book.title}" EPUB into offline vault...`);
      try {
        const res = await fetch(
          `http://localhost:8000/api/catalog/download/${book.gutenbergId || book.id}`
        );
        let arrayBuffer = null;
        if (res.ok) {
          arrayBuffer = await res.arrayBuffer();
        }

        await saveBook(
          {
            id: String(book.id),
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl,
            gutenbergId: String(book.gutenbergId || book.id),
            status: 'to-read',
            progress: 0,
          },
          arrayBuffer
        );

        setSavedToLibrary(true);
        showToast(`Saved "${book.title}" to your offline Library!`);
      } catch (err) {
        console.warn('Backend download error:', err);
        await saveBook({
          id: String(book.id),
          title: book.title,
          author: book.author,
          coverUrl: book.coverUrl,
          gutenbergId: String(book.gutenbergId || book.id),
          status: 'to-read',
          progress: 0,
        });
        setSavedToLibrary(true);
        showToast(`Saved "${book.title}" to Library`);
      } finally {
        setDownloading(false);
      }
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
              <div className="w-24 h-36 shrink-0 rounded-lg overflow-hidden bg-surface-container-high shadow-md border border-outline-variant/40 relative">
                <img className="w-full h-full object-cover" src={book.coverUrl} alt={book.title} />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <h1 className="font-headline-md text-headline-md text-primary font-semibold tracking-tight leading-snug">
                  {book.title}
                </h1>
                <p className="font-body-ui text-label-md text-on-surface-variant">{book.author}</p>
                <div className="flex items-center gap-3 pt-2 text-caption font-caption text-outline">
                  <span>{book.year}</span>
                  <span>•</span>
                  <span>{book.pages} pages</span>
                  <span>•</span>
                  <span className="text-secondary font-medium">Free Domain</span>
                </div>
              </div>
            </div>

            <div className="space-y-2 border-t border-outline-variant/20 pt-4">
              <h2 className="font-headline-sm text-headline-sm text-primary font-medium">Synopsis</h2>
              <p
                className={`font-body-reading text-[14.5px] leading-relaxed text-on-surface-variant ${
                  !expandedSynopsis ? 'line-clamp-4' : ''
                }`}
              >
                {book.synopsis}
              </p>
              {book.synopsis?.length > 200 && (
                <button
                  type="button"
                  onClick={() => setExpandedSynopsis((v) => !v)}
                  className="text-secondary font-label-sm text-label-sm hover:underline"
                >
                  {expandedSynopsis ? 'Show less' : 'Read full synopsis'}
                </button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-on-surface">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  format_size
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
              disabled={downloading}
              className="w-full py-3.5 px-5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-body-ui-bold text-body-ui-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150 disabled:opacity-75"
            >
              {downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                  <span>Streaming EPUB Binary...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">
                    {savedToLibrary ? 'auto_stories' : 'download'}
                  </span>
                  <span>
                    {savedToLibrary
                      ? 'Saved in Library · Open in Reader'
                      : 'Save to Library (Offline EPUB)'}
                  </span>
                </>
              )}
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
