'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { SLUG_TO_GUTENBERG } from '../constants';
import { fetchBookDetail } from '../lib/book-detail-loader';
import { useTheme } from '@/providers/ThemeProvider';
import { saveBook } from '@/lib/storage';
import { downloadEpub } from '@/lib/api';

export function useBookDetail() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useTheme();

  const rawId = params?.id ? decodeURIComponent(String(params.id)) : '';
  const mappedGutenbergId = SLUG_TO_GUTENBERG[rawId] || null;
  const numericGutenbergId = rawId.startsWith('gutenberg_')
    ? rawId.replace('gutenberg_', '')
    : /^\d+$/.test(rawId)
    ? rawId
    : mappedGutenbergId;
  const canonicalVaultId = numericGutenbergId ? `gutenberg_${numericGutenbergId}` : rawId;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const { book: resultBook, hasFile } = await fetchBookDetail({
          rawId,
          canonicalVaultId,
          numericGutenbergId,
        });
        if (!active) return;
        if (resultBook) {
          setBook(resultBook);
          setSavedToLibrary(hasFile);
        } else {
          setLoadError('Book details could not be found.');
        }
      } catch (err) {
        if (!active) return;
        setLoadError(err.message || 'Failed to load book');
      } finally {
        if (active) setLoading(false);
      }
    }

    if (rawId) {
      load();
    } else {
      setLoadError('No book identifier specified');
      setLoading(false);
    }

    return () => { active = false; };
  }, [rawId, canonicalVaultId, numericGutenbergId]);

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/browse');
    }
  };

  const handlePrimaryAction = async () => {
    if (!book) return;
    if (savedToLibrary) {
      router.push(`/reader/${book.id}`);
      return;
    }

    const downloadTargetId = book.gutenbergId || numericGutenbergId;
    if (!downloadTargetId) {
      showToast('This book cannot be downloaded automatically without a Gutenberg ID.');
      return;
    }

    setDownloading(true);
    showToast(`Downloading "${book.title}" EPUB into offline library…`);
    try {
      const epubBlob = await downloadEpub(downloadTargetId);

      await saveBook(
        {
          id: canonicalVaultId,
          title: book.title,
          author: book.authorText,
          authors: book.authors,
          coverUrl: book.coverUrl,
          gutenbergId: String(downloadTargetId),
          languages: book.languages,
          subjects: book.subjects,
          downloadCount: book.downloadCount,
          copyright: book.copyright,
          fileSize: epubBlob.size,
          status: 'to-read',
          progress: 0,
          progressPercentage: 0,
          addedAt: Date.now(),
        },
        epubBlob
      );

      setBook((prev) =>
        prev ? { ...prev, id: canonicalVaultId, hasBinary: true, fileSize: epubBlob.size } : prev
      );
      setSavedToLibrary(true);
      showToast(`Saved "${book.title}" to offline library`);
    } catch (err) {
      console.warn('EPUB download failed:', err);
      showToast(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return {
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
  };
}
