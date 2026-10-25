'use client';

import { useCallback, useEffect } from 'react';

export function useReaderShortcuts({
  canvasRef,
  activeOverlay,
  setActiveOverlay,
  selectedData,
  setSelectedData,
  setShowHud,
  handleToggleFullscreen,
  handleToggleBookmark,
  onActivity,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      onActivity?.();

      const target = e.target;
      const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
      const tag = (target?.tagName || activeEl?.tagName || '').toUpperCase();
      if (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable ||
        activeEl?.isContentEditable
      ) {
        return;
      }

      switch (e.key) {
        case 'Escape':
          if (activeOverlay !== 'none') {
            setActiveOverlay('none');
          } else if (selectedData) {
            setSelectedData(null);
          } else {
            setShowHud(false);
          }
          break;
        case 'f':
        case 'F':
          handleToggleFullscreen?.();
          break;
        case 'c':
        case 'C':
          setActiveOverlay((prev) => (prev === 'contents' ? 'none' : 'contents'));
          break;
        case 'a':
        case 'A':
          setActiveOverlay((prev) => (prev === 'settings' ? 'none' : 'settings'));
          break;
        case 'i':
        case 'I':
          setActiveOverlay((prev) => (prev === 'ai' ? 'none' : 'ai'));
          break;
        case 'b':
        case 'B':
          handleToggleBookmark?.();
          break;
        case 'ArrowRight':
        case 'PageDown':
          canvasRef.current?.next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          canvasRef.current?.prev();
          break;
        case ' ':
          e.preventDefault();
          if (e.shiftKey) {
            canvasRef.current?.prev();
          } else {
            canvasRef.current?.next();
          }
          break;
        default:
          break;
      }
    },
    [
      activeOverlay,
      selectedData,
      canvasRef,
      setActiveOverlay,
      setSelectedData,
      setShowHud,
      handleToggleFullscreen,
      handleToggleBookmark,
      onActivity,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { handleKeyDown };
}
