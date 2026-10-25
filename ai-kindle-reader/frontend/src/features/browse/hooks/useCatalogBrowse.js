'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { mapGutenbergBook } from '../lib/browse-helpers';
import { downloadGutenbergEpub } from '../lib/download-gutenberg';
import { useTheme } from '@/providers/ThemeProvider';
import { getAllBooks } from '@/lib/storage';
import { searchBooks, browseBooks } from '@/lib/api';

export function useCatalogBrowse() {
  const router = useRouter();
  const { openImportModal, showToast } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('All Classics');
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [downloadingIds, setDownloadingIds] = useState(() => new Set());

  const [liveSearchResults, setLiveSearchResults] = useState(null);
  const [searchTotal, setSearchTotal] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchRetryKey, setSearchRetryKey] = useState(0);

  const [browseResults, setBrowseResults] = useState([]);
  const [isBrowsing, setIsBrowsing] = useState(true);
  const [browseError, setBrowseError] = useState(null);
  const [browseRetryKey, setBrowseRetryKey] = useState(0);
  const isFirstRequestRef = useRef(true);
  const [isServerWaking, setIsServerWaking] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAllBooks()
      .then((books) => {
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
      })
      .catch((err) => console.warn('Failed to load saved books from vault:', err));
    return () => { cancelled = true; };
  }, []);

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
        const mapped = books.map((b) => mapGutenbergBook(b, 'Project Gutenberg'));
        setLiveSearchResults(mapped);
        setSearchTotal(typeof result?.total === 'number' ? result.total : mapped.length);
      } catch (err) {
        if (cancelled) return;
        console.warn('Search error:', err);
        setSearchError(err.message || 'Failed to search Project Gutenberg');
        setLiveSearchResults(null);
        setSearchTotal(null);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 400);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [searchQuery, searchRetryKey]);

  useEffect(() => {
    let cancelled = false;
    let wakeTimer = null;
    setIsBrowsing(true);
    setBrowseError(null);
    setIsServerWaking(false);

    if (isFirstRequestRef.current) {
      wakeTimer = setTimeout(() => { if (!cancelled) setIsServerWaking(true); }, 5000);
    }

    const topicParam = selectedTopic === 'All Classics' ? '' : selectedTopic;
    browseBooks({ topic: topicParam })
      .then((res) => {
        if (cancelled) return;
        const books = res?.books || [];
        setBrowseResults(books.map((b) => mapGutenbergBook(b, selectedTopic)));
      })
      .catch((err) => {
        if (cancelled) return;
        console.warn('Browse error:', err);
        setBrowseError(err.message || 'Failed to load public domain catalog');
      })
      .finally(() => {
        if (wakeTimer) clearTimeout(wakeTimer);
        if (!cancelled) {
          setIsBrowsing(false);
          setIsServerWaking(false);
          isFirstRequestRef.current = false;
        }
      });

    return () => { cancelled = true; if (wakeTimer) clearTimeout(wakeTimer); };
  }, [selectedTopic, browseRetryKey]);

  const isBookInVault = useCallback(
    (book) => {
      if (!book) return false;
      if (savedIds.has(String(book.id || ''))) return true;
      if (book.gutenbergId) {
        const g = String(book.gutenbergId);
        return savedIds.has(g) || savedIds.has(`gutenberg_${g}`);
      }
      return false;
    },
    [savedIds]
  );

  const handleDownloadGutenbergBook = async (e, book) => {
    if (e?.stopPropagation) e.stopPropagation();
    setDownloadingIds((prev) => new Set(prev).add(book.id));
    showToast(`Downloading "${book.title}" EPUB`);
    try {
      const { bookKey, gutenbergId, alreadyDownloaded } = await downloadGutenbergEpub(book);
      setSavedIds((prev) => {
        const next = new Set(prev);
        next.add(bookKey);
        if (book.id) next.add(String(book.id));
        if (gutenbergId) next.add(String(gutenbergId));
        return next;
      });
      showToast(alreadyDownloaded ? `Opening "${book.title}" from offline vault` : `Saved "${book.title}" to offline library`);
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

  return {
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
  };
}
