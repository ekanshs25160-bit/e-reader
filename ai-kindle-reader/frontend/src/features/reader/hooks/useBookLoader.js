'use client';

import { useState, useCallback, useEffect } from 'react';
import { STATIC_GUTENBERG_BOOKS } from '../constants';
import { downloadEpub } from '@/lib/api';
import { getBookBlob, getBookMeta, saveBook } from '@/lib/storage';

export async function validateEpubBlob(blob) {
  if (!blob) return false;
  try {
    if (blob instanceof ArrayBuffer) {
      if (blob.byteLength < 2) return false;
      const bytes = new Uint8Array(blob, 0, 2);
      return bytes[0] === 0x50 && bytes[1] === 0x4b;
    }
    if (typeof blob.slice === 'function' && typeof blob.size === 'number') {
      if (blob.size === 0) return false;
      const slice = await blob.slice(0, 2).arrayBuffer();
      const bytes = new Uint8Array(slice);
      return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    }
  } catch (err) {
    console.warn('Failed to validate EPUB blob header:', err);
    return false;
  }
  return false;
}

export function useBookLoader(bookId, showToast) {
  const [bookMeta, setBookMeta] = useState(null);
  const [bookBlob, setBookBlob] = useState(null);
  const [loadingDb, setLoadingDb] = useState(true);
  const [isNotDownloaded, setIsNotDownloaded] = useState(false);
  const [isReDownloading, setIsReDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const [toc, setToc] = useState([]);

  const loadBook = useCallback(async () => {
    if (!bookId) return;
    setLoadingDb(true);
    setIsNotDownloaded(false);
    setDownloadError('');

    if (bookId === 'demo' || bookId === 'sample') {
      setBookMeta({
        id: bookId,
        title: 'Pride and Prejudice',
        author: 'Jane Austen',
        volume: 'Volume I',
        chapter: 'CHAPTER I.',
      });
      setBookBlob(null);
      setIsNotDownloaded(false);
      setToc([
        { label: 'Volume I · Chapter I', href: '#ch1' },
        { label: 'Volume I · Chapter II', href: '#ch2' },
        { label: 'Volume I · Chapter III', href: '#ch3' },
      ]);
      setLoadingDb(false);
      return;
    }

    try {
      const [meta, blob] = await Promise.all([
        getBookMeta(bookId),
        getBookBlob(bookId),
      ]);

      const rawGutenbergId =
        meta?.gutenbergId ||
        (bookId.startsWith('gutenberg_') ? bookId.replace('gutenberg_', '') : /^\d+$/.test(bookId) ? bookId : null);
      const staticInfo = rawGutenbergId ? STATIC_GUTENBERG_BOOKS[rawGutenbergId] : null;

      const resolvedMeta = {
        id: bookId,
        title: meta?.title || staticInfo?.title || 'Unknown Title',
        author: meta?.author || staticInfo?.author || 'Unknown Author',
        gutenbergId: rawGutenbergId,
        ...meta,
      };
      setBookMeta(resolvedMeta);

      const isValid = await validateEpubBlob(blob);
      if (isValid) {
        setBookBlob(blob);
        setIsNotDownloaded(false);
      } else if (rawGutenbergId) {
        setIsNotDownloaded(true);
      } else {
        setBookBlob(blob);
        setIsNotDownloaded(!blob);
      }
    } catch (err) {
      console.error('[useBookLoader] Failed to load book data:', err);
      setIsNotDownloaded(true);
    } finally {
      setLoadingDb(false);
    }
  }, [bookId]);

  const handleDownloadAgain = async () => {
    const rawGutenbergId =
      bookMeta?.gutenbergId ||
      (bookId.startsWith('gutenberg_') ? bookId.replace('gutenberg_', '') : /^\d+$/.test(bookId) ? bookId : null);

    if (!rawGutenbergId) {
      setDownloadError('No Project Gutenberg ID available for this book.');
      return;
    }

    setIsReDownloading(true);
    setDownloadError('');
    try {
      const freshBlob = await downloadEpub(rawGutenbergId);
      const isValid = await validateEpubBlob(freshBlob);
      if (!isValid) throw new Error('Downloaded file is not a valid EPUB archive.');

      await saveBook({
        id: bookId,
        title: bookMeta?.title || `Gutenberg Book #${rawGutenbergId}`,
        author: bookMeta?.author || 'Project Gutenberg',
        blob: freshBlob,
        file: freshBlob,
        fileSize: freshBlob.size,
        gutenbergId: rawGutenbergId,
        downloadedAt: new Date().toISOString(),
      });

      setBookBlob(freshBlob);
      setIsNotDownloaded(false);
      showToast?.('Book downloaded successfully');
    } catch (err) {
      console.error('[useBookLoader] Download failed:', err);
      setDownloadError(err?.message || 'Download failed. Please check network connection.');
    } finally {
      setIsReDownloading(false);
    }
  };

  useEffect(() => {
    loadBook();
  }, [loadBook]);

  return {
    bookMeta,
    setBookMeta,
    bookBlob,
    loadingDb,
    isNotDownloaded,
    isReDownloading,
    downloadError,
    handleDownloadAgain,
    toc,
    setToc,
    reloadBook: loadBook,
  };
}
