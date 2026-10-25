'use client';

import { useState, useRef, useCallback } from 'react';
import { saveReadingLocation } from '@/lib/storage';

export function useReaderLocation({ bookId, recordPageTurn, setSelectedData }) {
  const [currentCfi, setCurrentCfi] = useState(null);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentChapter, setCurrentChapter] = useState('');
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1 });
  const [endOfChapterHint, setEndOfChapterHint] = useState(false);
  const endOfChapterTimerRef = useRef(null);
  const lastSeenLocKeyRef = useRef('');

  const handleLocationChange = useCallback(
    ({ cfi, progress, chapter, page, totalPages, isLastPageInChapter, isResize }) => {
      if (cfi) setCurrentCfi(cfi);
      if (progress !== undefined) setCurrentProgress(progress);
      if (chapter) setCurrentChapter(chapter);
      if (page) setPageInfo({ current: page, total: totalPages || pageInfo.total });

      const isLast = isLastPageInChapter || (page && totalPages && totalPages > 1 && page === totalPages);
      if (isLast) {
        const locKey = `${chapter || ''}-${page}-${totalPages}`;
        if (lastSeenLocKeyRef.current !== locKey) {
          lastSeenLocKeyRef.current = locKey;
          setEndOfChapterHint(true);
          clearTimeout(endOfChapterTimerRef.current);
          endOfChapterTimerRef.current = setTimeout(() => setEndOfChapterHint(false), 2000);
        }
      } else if (endOfChapterHint) {
        setEndOfChapterHint(false);
        clearTimeout(endOfChapterTimerRef.current);
      }

      setSelectedData?.(null);
      if (!isResize) {
        recordPageTurn?.();
        saveReadingLocation(bookId, cfi, progress, chapter, page, totalPages);
      }
    },
    [bookId, endOfChapterHint, pageInfo.total, recordPageTurn, setSelectedData]
  );

  const pct = Math.round(currentProgress * 100);

  return {
    currentCfi,
    currentProgress,
    currentChapter,
    pageInfo,
    endOfChapterHint,
    handleLocationChange,
    pct,
  };
}
