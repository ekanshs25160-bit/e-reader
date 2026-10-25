'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { logReadingSession, getStatsSummary } from '@/lib/storage';

export function useReadingSession({ bookId, bookBlob, loadingDb, isNotDownloaded, pageInfo }) {
  const [userWpm, setUserWpm] = useState(220);
  const lastInteractionRef = useRef(Date.now());
  const uncommittedSecondsRef = useRef(0);
  const uncommittedPagesRef = useRef(0);

  // Load measured reading pace from stats summary
  useEffect(() => {
    let active = true;
    async function loadStats() {
      try {
        const statsSummary = await getStatsSummary();
        if (!active || !statsSummary) return;
        const totalSecs = statsSummary.totalSeconds || 0;
        const totalPgs = statsSummary.totalPagesTurned || 0;
        if (totalSecs >= 180 && totalPgs >= 3) {
          const estimatedWords = totalPgs * 260;
          const paceWpm = Math.round(estimatedWords / (totalSecs / 60));
          if (paceWpm >= 100 && paceWpm <= 500) {
            setUserWpm(paceWpm);
          }
        }
      } catch (err) {
        console.warn('[useReadingSession] Stats load error:', err);
      }
    }
    loadStats();
    return () => {
      active = false;
    };
  }, []);

  const flushSession = useCallback(() => {
    const secs = uncommittedSecondsRef.current;
    const pgs = uncommittedPagesRef.current;
    if (secs > 0 || pgs > 0) {
      uncommittedSecondsRef.current = 0;
      uncommittedPagesRef.current = 0;
      logReadingSession({ bookId, seconds: secs, pages: pgs });
    }
  }, [bookId]);

  const recordPageTurn = useCallback(() => {
    uncommittedPagesRef.current += 1;
    lastInteractionRef.current = Date.now();
  }, []);

  const registerActivity = useCallback(() => {
    lastInteractionRef.current = Date.now();
  }, []);

  // 1-second interval timer
  useEffect(() => {
    if (isNotDownloaded || loadingDb || !bookBlob) return;

    const timer = setInterval(() => {
      const isVisible =
        typeof document !== 'undefined' && document.visibilityState === 'visible';
      const isActiveRecently =
        Date.now() - lastInteractionRef.current <= 120000;

      if (isVisible && isActiveRecently) {
        uncommittedSecondsRef.current += 1;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isNotDownloaded, loadingDb, bookBlob]);

  // Periodic flush every 30 seconds
  useEffect(() => {
    if (isNotDownloaded || loadingDb || !bookBlob) return;

    const flushInterval = setInterval(() => {
      flushSession();
    }, 30000);

    return () => {
      clearInterval(flushInterval);
      flushSession();
    };
  }, [flushSession, isNotDownloaded, loadingDb, bookBlob]);

  // Flush on visibilitychange / pagehide
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSession();
      } else {
        lastInteractionRef.current = Date.now();
      }
    };

    const handlePageHide = () => {
      flushSession();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pointerdown', registerActivity);
    window.addEventListener('keydown', registerActivity);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pointerdown', registerActivity);
      window.removeEventListener('keydown', registerActivity);
    };
  }, [flushSession, registerActivity]);

  const wordsLeftInChapter = Math.max(0, (pageInfo?.total || 1) - (pageInfo?.current || 1)) * 260;
  const minutesLeftInChapter = Math.max(1, Math.ceil(wordsLeftInChapter / userWpm));
  const chapterProgressPercent = Math.min(
    100,
    Math.round(((pageInfo?.current || 1) / Math.max(1, pageInfo?.total || 1)) * 100)
  );

  return {
    userWpm,
    recordPageTurn,
    registerActivity,
    flushSession,
    minutesLeftInChapter,
    chapterProgressPercent,
  };
}
