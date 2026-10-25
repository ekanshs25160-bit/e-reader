'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { getAllBooks } from '@/utils/db';

export function useLibraryBooks() {
  const [booksList, setBooksList] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stored = await getAllBooks();
      setBooksList(stored || []);
    } catch (err) {
      console.error('Failed to load library:', err);
      setError('Could not access stored volumes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  const filterCounts = useMemo(() => {
    const all = booksList.length;
    const reading = booksList.filter(
      (b) => b.status === 'reading' || ((b.progressPercentage || 0) > 0 && (b.progressPercentage || 0) < 100)
    ).length;
    const finished = booksList.filter(
      (b) => b.status === 'finished' || (b.progressPercentage || 0) >= 100
    ).length;
    return { all, reading, finished };
  }, [booksList]);

  const filteredBooks = useMemo(() => {
    let list = booksList.filter((b) => {
      if (activeFilter === 'reading') {
        const p = b.progressPercentage || 0;
        return b.status === 'reading' || (p > 0 && p < 100);
      }
      if (activeFilter === 'finished') {
        const p = b.progressPercentage || 0;
        return b.status === 'finished' || p >= 100;
      }
      return true;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (b) =>
          (b.title || '').toLowerCase().includes(q) ||
          (b.author || '').toLowerCase().includes(q)
      );
    }

    if (sortBy === 'title') {
      list = [...list].sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'progress') {
      list = [...list].sort(
        (a, b) => (b.progressPercentage || 0) - (a.progressPercentage || 0)
      );
    } else {
      list = [...list].sort(
        (a, b) => (b.lastRead || b.addedAt || 0) - (a.lastRead || a.addedAt || 0)
      );
    }

    return list;
  }, [activeFilter, booksList, searchQuery, sortBy]);

  const cycleSort = () => {
    const next = sortBy === 'recent' ? 'title' : sortBy === 'title' ? 'progress' : 'recent';
    setSortBy(next);
  };

  const sortLabel = {
    recent: 'Recent',
    title: 'Title A–Z',
    progress: 'Progress',
  }[sortBy];

  return {
    booksList,
    filteredBooks,
    filterCounts,
    activeFilter,
    setActiveFilter,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortLabel,
    cycleSort,
    loading,
    error,
    reload: loadLibrary,
  };
}
