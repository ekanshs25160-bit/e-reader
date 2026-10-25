'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useHud({ activeOverlay, setActiveOverlay, onActivity }) {
  const [showHud, setShowHud] = useState(false);
  const [cursorHidden, setCursorHidden] = useState(false);
  const [isMouseInWindow, setIsMouseInWindow] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const cursorIdleTimerRef = useRef(null);
  const activeOverlayRef = useRef(activeOverlay);
  activeOverlayRef.current = activeOverlay;

  const registerPointerActivity = useCallback(() => {
    onActivity?.();
    setIsMouseInWindow(true);
    setCursorHidden(false);
    clearTimeout(cursorIdleTimerRef.current);

    cursorIdleTimerRef.current = setTimeout(() => {
      if (activeOverlayRef.current === 'none') {
        setCursorHidden(true);
      }
    }, 3000);
  }, [onActivity]);

  const handleToggleHud = useCallback(() => {
    onActivity?.();
    if (activeOverlayRef.current !== 'none') {
      setActiveOverlay?.('none');
      setShowHud(false);
      return;
    }
    setShowHud((prev) => !prev);
  }, [onActivity, setActiveOverlay]);

  useEffect(() => {
    const handleMouseLeave = () => {
      setIsMouseInWindow(false);
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
      clearTimeout(cursorIdleTimerRef.current);
    };
  }, [registerPointerActivity]);

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
