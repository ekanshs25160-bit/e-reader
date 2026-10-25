'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { formatVocabularyItem } from '../lib/vocabulary-helpers';
import { useVocabularyQuiz } from './useVocabularyQuiz';
import { useAddWordModal } from './useAddWordModal';
import {
  getAllVocabularyWords,
  deleteVocabularyWord,
  updateVocabularyCardReview,
  getAllBooks,
} from '@/lib/storage';
import { useTheme } from '@/providers/ThemeProvider';

export function useVocabularyData() {
  const router = useRouter();
  const { showToast } = useTheme();

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storedBooks, setStoredBooks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState('All Books');
  const [aiWord, setAiWord] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const loadVaultVocab = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [saved, books] = await Promise.all([getAllVocabularyWords(), getAllBooks()]);
      if (Array.isArray(books)) setStoredBooks(books);
      const formatted = Array.isArray(saved) ? saved.map(formatVocabularyItem) : [];
      formatted.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setWords(formatted);
    } catch (err) {
      console.warn('Error loading vocabulary from vault:', err);
      setError(err?.message || 'Failed to load vocabulary words from vault');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVaultVocab();
  }, [loadVaultVocab]);

  const bookFilterChips = useMemo(() => {
    const counts = {};
    words.forEach((w) => {
      const title = (w.bookTitle || 'Unfiled').trim();
      counts[title] = (counts[title] || 0) + 1;
    });
    return [
      { id: 'All Books', label: 'All Books', count: words.length },
      ...Object.entries(counts).map(([title, count]) => ({ id: title, label: title, count })),
    ];
  }, [words]);

  const dueCards = useMemo(() => {
    const now = Date.now();
    return words
      .filter((w) => {
        if (!w.nextReviewDate) return true;
        const dueTime = typeof w.nextReviewDate === 'number' ? w.nextReviewDate : new Date(w.nextReviewDate).getTime();
        return dueTime <= now;
      })
      .sort((a, b) => {
        const timeA = a.nextReviewDate ? (typeof a.nextReviewDate === 'number' ? a.nextReviewDate : new Date(a.nextReviewDate).getTime()) : 0;
        const timeB = b.nextReviewDate ? (typeof b.nextReviewDate === 'number' ? b.nextReviewDate : new Date(b.nextReviewDate).getTime()) : 0;
        return timeA - timeB;
      });
  }, [words]);

  const activeRecallCard = dueCards.length > 0 ? dueCards[0] : null;

  const filteredLexicon = useMemo(() => {
    return words.filter((w) => {
      if (selectedBook !== 'All Books') {
        const title = (w.bookTitle || 'Unfiled').trim();
        if (title !== selectedBook) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const wordMatch = (w.word || '').toLowerCase().includes(q);
      const defMatch = (w.definition || (Array.isArray(w.definitions) ? w.definitions.join(' ') : '')).toLowerCase().includes(q);
      const sentenceMatch = (w.contextSentence || w.quote || '').toLowerCase().includes(q);
      return wordMatch || defMatch || sentenceMatch;
    });
  }, [words, selectedBook, searchQuery]);

  const handleRecallAction = async (wasRemembered) => {
    if (!activeRecallCard) return;
    try {
      const updated = await updateVocabularyCardReview(activeRecallCard.id, wasRemembered);
      const nextDue = updated?.nextReviewDate || Date.now() + (wasRemembered ? 86400000 * 2 : 86400000);
      setWords((prev) =>
        prev.map((w) => (w.id === activeRecallCard.id ? { ...w, ...(updated || {}), nextReviewDate: nextDue } : w))
      );
      showToast(
        wasRemembered
          ? `Marked “${activeRecallCard.word}” as remembered`
          : `Scheduled “${activeRecallCard.word}” for review soon`
      );
    } catch (err) {
      showToast('Error updating review: ' + err.message);
    }
  };

  const handleOpenInReader = (bookId, cfi) => {
    if (!bookId || bookId === 'custom') {
      showToast('No book attached to this word');
      return;
    }
    const cfiQuery = cfi ? `?cfi=${encodeURIComponent(cfi)}` : '';
    router.push(`/reader/${encodeURIComponent(bookId)}${cfiQuery}`);
  };

  const handleDeleteWord = async (id, wordText) => {
    try {
      await deleteVocabularyWord(id);
      setWords((prev) => prev.filter((w) => w.id !== id));
      setDeleteConfirmId(null);
      showToast(`Removed “${wordText}” from lexicon`);
    } catch (err) {
      showToast('Failed to delete word: ' + err.message);
    }
  };

  const addModal = useAddWordModal({
    storedBooks,
    onWordAdded: (newWord) => setWords((prev) => [newWord, ...prev]),
    showToast,
  });

  const quiz = useVocabularyQuiz({ words, showToast });

  return {
    words,
    loading,
    error,
    loadVaultVocab,
    storedBooks,
    searchQuery,
    setSearchQuery,
    selectedBook,
    setSelectedBook,
    bookFilterChips,
    dueCards,
    activeRecallCard,
    filteredLexicon,
    handleRecallAction,
    handleOpenInReader,
    deleteConfirmId,
    setDeleteConfirmId,
    handleDeleteWord,
    addModal,
    aiWord,
    setAiWord,
    showToast,
    quiz,
  };
}
