'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useHud({ activeOverlay, onActivity }) {
  const [showHud, setShowHud] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [isMouseInWindow, setIsMouseInWindow] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const hudIdleTimerRef = useRef(null);
  const cursorIdleTimerRef = useRef(null);
  const activeOverlayRef = useRef(activeOverlay);
  activeOverlayRef.current = activeOverlay;

  const registerPointerActivity = useCallback((e) => {
    onActivity?.();
    setCursorHidden(false);
    clearTimeout(cursorIdleTimerRef.current);

    cursorIdleTimerRef.current = setTimeout(() => {
      if (activeOverlayRef.current === 'none') {
        setCursorHidden(true);
      }
    }, 3000);

    const clientY = e?.clientY ?? (typeof e?.touches !== 'undefined' ? e.touches[0]?.clientY : undefined);
    const isTop80 = typeof clientY === 'number' && clientY <= 80;

    setShowHud(true);
    clearTimeout(hudIdleTimerRef.current);

    if (!isTop80) {
      hudIdleTimerRef.current = setTimeout(() => {
        if (activeOverlayRef.current === 'none') {
          setShowHud(false);
        }
      }, 2500);
    }
  }, [onActivity]);

  const handleToggleHud = useCallback(() => {
    onActivity?.();
    setShowHud((prev) => !prev);
  }, [onActivity]);

  useEffect(() => {
    const handleMouseLeave = () => {
      setIsMouseInWindow(false);
      if (activeOverlayRef.current === 'none') {
        clearTimeout(hudIdleTimerRef.current);
        hudIdleTimerRef.current = setTimeout(() => {
          if (activeOverlayRef.current === 'none') {
            setShowHud(false);
          }
        }, 1000);
      }
    };
    const handleMouseEnter = () => {
      setIsMouseInWindow(true);
    };

    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mousemove', registerPointerActivity);

    return () => {
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mousemove', registerPointerActivity);
      clearTimeout(hudIdleTimerRef.current);
      clearTimeout(cursorIdleTimerRef.current);
    };
  }, [registerPointerActivity]);

  useEffect(() => {
    if (activeOverlay !== 'none') {
      setShowHud(true);
      clearTimeout(hudIdleTimerRef.current);
    }
  }, [activeOverlay]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  return {
    showHud,
    setShowHud,
    cursorHidden,
    isMouseInWindow,
    isFullscreen,
    handleToggleHud,
    handleToggleFullscreen,
    registerPointerActivity,
  };
}
