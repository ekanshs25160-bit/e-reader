'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getBookmarks,
  addBookmark,
  removeBookmark,
  getHighlights,
  addHighlight,
  removeHighlight,
} from '@/lib/storage';

export function useBookmarks({
  bookId,
  bookMeta,
  currentCfi,
  currentProgress,
  currentChapter,
  pageInfo,
  canvasRef,
  showToast,
}) {
  const [bookmarks, setBookmarks] = useState([]);
  const [highlights, setHighlights] = useState([]);
  const [activeHighlightColor, setActiveHighlightColor] = useState('var(--reader-accent)');

  useEffect(() => {
    if (!bookId) return;
    let active = true;

    async function loadData() {
      try {
        const [savedBookmarks, savedHighlights] = await Promise.all([
          getBookmarks(bookId),
          getHighlights(bookId),
        ]);
        if (!active) return;
        if (Array.isArray(savedBookmarks)) setBookmarks(savedBookmarks);
        if (Array.isArray(savedHighlights)) setHighlights(savedHighlights);
      } catch (err) {
        console.warn('[useBookmarks] Failed to load bookmarks/highlights:', err);
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, [bookId]);

  const isCurrentBookmarked = Boolean(
    currentCfi && bookmarks.some((b) => b.cfi === currentCfi)
  );

  const handleToggleBookmark = useCallback(async () => {
    if (!currentCfi) return;

    const existingBm = bookmarks.find((b) => b.cfi === currentCfi);
    if (existingBm) {
      await removeBookmark(bookId, existingBm.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== existingBm.id));
      showToast?.('Bookmark removed');
    } else {
      const newBm = await addBookmark(bookId, {
        cfi: currentCfi,
        chapter: currentChapter || bookMeta?.currentChapter || 'Bookmark',
        percentage: currentProgress,
        page: pageInfo?.current || 1,
        totalPages: pageInfo?.total || 1,
        createdAt: Date.now(),
      });
      if (newBm) {
        setBookmarks((prev) => [newBm, ...prev]);
        showToast?.('Bookmark saved');
      }
    }
  }, [currentCfi, bookmarks, bookId, currentChapter, bookMeta, currentProgress, pageInfo, showToast]);

  const handleRemoveBookmark = useCallback(async (id, e) => {
    e?.stopPropagation?.();
    await removeBookmark(bookId, id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    showToast?.('Bookmark removed');
  }, [bookId, showToast]);

  const handleAddHighlight = useCallback(async (text, cfiRange, color = 'var(--reader-accent)') => {
    if (!text) return;
    const chosenColor = color === 'underline' ? 'var(--reader-accent)' : color;
    setActiveHighlightColor(chosenColor);

    const highlightEntry = {
      id: `hl-${Date.now()}`,
      cfiRange: cfiRange || currentCfi || null,
      text,
      color: chosenColor,
      isUnderline: color === 'underline',
      chapter: currentChapter || bookMeta?.currentChapter || 'Passage',
      createdAt: Date.now(),
    };

    await addHighlight(bookId, highlightEntry);

    if (highlightEntry.cfiRange && canvasRef.current?.renderHighlight) {
      canvasRef.current.renderHighlight(highlightEntry.cfiRange, chosenColor, highlightEntry.id);
    }

    setHighlights((prev) => [highlightEntry, ...prev]);
    showToast?.(color === 'underline' ? 'Underline saved' : 'Highlight saved');
  }, [bookId, currentCfi, currentChapter, bookMeta, canvasRef, showToast]);

  const handleDeleteHighlight = useCallback(async (highlightId) => {
    try {
      await removeHighlight(highlightId);
      setHighlights((prev) => prev.filter((h) => h.id !== highlightId));
    } catch (err) {
      console.error('[useBookmarks] Failed to remove highlight:', err);
    }
  }, []);

  return {
    bookmarks,
    highlights,
    activeHighlightColor,
    isCurrentBookmarked,
    handleToggleBookmark,
    handleRemoveBookmark,
    handleAddHighlight,
    handleDeleteHighlight,
  };
}
