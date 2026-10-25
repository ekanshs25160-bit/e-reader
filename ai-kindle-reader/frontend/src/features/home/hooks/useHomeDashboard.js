'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getAllBooks,
  getStatsSummary,
  getAllVocabularyWords,
  getAllHighlights,
} from '@/utils/db';

export function useHomeDashboard() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [vocabWords, setVocabWords] = useState([]);
  const [fellOutItem, setFellOutItem] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadHomeDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vaultBooks, readingTelemetry, savedVocab, savedHighlights] =
        await Promise.all([
          getAllBooks(),
          getStatsSummary(),
          getAllVocabularyWords(),
          getAllHighlights(),
        ]);

      const loadedBooks = (vaultBooks || []).map((b) => ({
        ...b,
        hasBinary: Boolean(b.hasBinary),
      }));

      setBooks(loadedBooks);
      setStats(readingTelemetry);
      setVocabWords(savedVocab || []);

      const pool = [];
      if (Array.isArray(savedHighlights)) {
        savedHighlights.forEach((h) => {
          if (h?.text) {
            pool.push({
              type: 'highlight',
              id: h.id,
              text: h.text,
              bookTitle: h.bookTitle,
              date: h.createdAt,
            });
          }
        });
      }
      if (Array.isArray(savedVocab)) {
        savedVocab.forEach((v) => {
          if (v?.word) {
            pool.push({
              type: 'word',
              id: v.id,
              word: v.word,
              definition: v.definition,
              sentence: v.contextSentence,
              bookTitle: v.bookTitle,
              date: v.dateAdded,
            });
          }
        });
      }

      if (pool.length > 0) {
        const picked = pool[Math.floor(Math.random() * pool.length)];
        setFellOutItem(picked);
      }
    } catch (err) {
      console.error('Failed to load home dashboard:', err);
      setError('Could not access your offline reading vault.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeDashboard();
  }, [loadHomeDashboard]);

  const sortedBooks = useMemo(() => {
    return [...books].sort((a, b) => {
      const timeA = a.lastRead ? new Date(a.lastRead).getTime() : 0;
      const timeB = b.lastRead ? new Date(b.lastRead).getTime() : 0;
      return timeB - timeA;
    });
  }, [books]);

  const carouselBooks = useMemo(() => {
    const reading = sortedBooks.filter((b) => b.status === 'reading' || (b.progress && b.progress > 0));
    return reading.length > 0 ? reading : sortedBooks.slice(0, 3);
  }, [sortedBooks]);

  const currentHero = carouselBooks[heroIndex] || sortedBooks[0] || null;

  const otherBooks = useMemo(() => {
    return sortedBooks.filter((b) => b.id !== currentHero?.id).slice(0, 3);
  }, [sortedBooks, currentHero]);

  const totalSeconds = stats?.totalSeconds || 0;
  const currentStreak = stats?.currentStreak || 0;
  const totalPagesRead = stats?.totalPagesRead || 0;

  const heroProgress = useMemo(() => {
    if (!currentHero) return 0;
    if (typeof currentHero.progressPercentage === 'number') return currentHero.progressPercentage;
    if (typeof currentHero.progress === 'number') return Math.round(currentHero.progress);
    if (currentHero.currentPage && currentHero.totalPages) {
      return Math.round((currentHero.currentPage / currentHero.totalPages) * 100);
    }
    return 0;
  }, [currentHero]);

  const heroPageLabel = useMemo(() => {
    if (!currentHero) return undefined;
    if (currentHero.currentPage && currentHero.totalPages) {
      return `Page ${currentHero.currentPage} of ${currentHero.totalPages}`;
    }
    return `${heroProgress}% complete`;
  }, [currentHero, heroProgress]);

  return {
    books,
    loading,
    error,
    currentHero,
    carouselBooks,
    heroIndex,
    setHeroIndex,
    heroProgress,
    heroPageLabel,
    otherBooks,
    totalSeconds,
    currentStreak,
    totalPagesRead,
    fellOutItem,
    reload: loadHomeDashboard,
  };
}
