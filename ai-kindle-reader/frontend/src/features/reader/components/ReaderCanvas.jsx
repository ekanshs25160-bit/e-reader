'use client';

import React, { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { getPageAreaDimensions, THEME_PALETTES, getChapterText } from '../engine';
import { useViewportResize } from '../hooks/useViewportResize';
import { useEpubRendition } from '../hooks/useEpubRendition';
import { useReaderHighlights } from '../hooks/useReaderHighlights';
import { useDynamicTheme } from '../hooks/useDynamicTheme';
import { ReaderLoadingOverlay, ReaderErrorOverlay } from './ReaderStates';

export { getPageAreaDimensions };

const ReaderCanvas = forwardRef(function ReaderCanvas(
  {
    bookBlob,
    file,
    initialCfi,
    theme = 'paper',
    fontSize = 18.5,
    fontFamily = 'literata',
    settings,
    highlights = [],
    cursorHidden = false,
    isShortLandscape = false,
    onKeyDown,
    onIframeMouseMove,
    onLocationChange,
    onTextSelect,
    onTextSelected,
    onToggleMenu,
    onReady,
    onNavigationLoaded,
    onUserInteraction,
    fallbackContent = null,
    children,
  },
  ref
) {
  const activeBlob = bookBlob || file;
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const currentCfiRef = useRef(initialCfi || null);
  const resizingUntilRef = useRef(0);

  useEffect(() => {
    if (initialCfi) currentCfiRef.current = initialCfi;
  }, [initialCfi]);

  const cbRef = useRef({});
  cbRef.current = {
    onToggleMenu,
    onUserInteraction,
    onLocationChange,
    onTextSelect,
    onTextSelected,
    onKeyDown,
    onIframeMouseMove,
    onReady,
    onNavigationLoaded,
  };

  const handleNext = useCallback(() => {
    onUserInteraction?.();
    try {
      renditionRef.current?.next()?.catch?.(() => {});
    } catch (err) {
      console.warn('[ReaderCanvas] next error:', err);
    }
  }, [onUserInteraction]);

  const handlePrev = useCallback(() => {
    onUserInteraction?.();
    try {
      renditionRef.current?.prev()?.catch?.(() => {});
    } catch (err) {
      console.warn('[ReaderCanvas] prev error:', err);
    }
  }, [onUserInteraction]);

  const handleGoToCfi = useCallback((targetCfi) => {
    onUserInteraction?.();
    if (renditionRef.current && targetCfi) {
      currentCfiRef.current = targetCfi;
      renditionRef.current.display(targetCfi);
    }
  }, [onUserInteraction]);

  const handleGoToPercentage = useCallback((percentage) => {
    onUserInteraction?.();
    if (renditionRef.current && bookRef.current?.locations) {
      try {
        const pct = percentage > 1 ? percentage / 100 : percentage;
        const cfi = bookRef.current.locations.cfiFromPercentage(pct);
        if (cfi) {
          currentCfiRef.current = cfi;
          renditionRef.current.display(cfi);
        }
      } catch (err) {
        console.warn('[ReaderCanvas] Failed to go to percentage:', err);
      }
    }
  }, [onUserInteraction]);

  const { isReady, loadError } = useEpubRendition({
    renditionRef,
    bookRef,
    viewerRef,
    containerRef,
    activeBlob,
    initialCfi,
    currentCfiRef,
    resizingUntilRef,
    settings,
    isShortLandscape,
    theme,
    fontSize,
    fontFamily,
    cursorHidden,
    handleNext,
    handlePrev,
    cbRef,
    retryCount,
  });

  const { pageDimensions, setPageDimensions } = useViewportResize({
    containerRef,
    viewerRef,
    renditionRef,
    currentCfiRef,
    resizingUntilRef,
    isReady,
    settings,
    isShortLandscape,
  });

  useDynamicTheme({
    renditionRef,
    isReady,
    containerRef,
    viewerRef,
    currentCfiRef,
    resizingUntilRef,
    setPageDimensions,
    settings,
    theme,
    fontSize,
    fontFamily,
    cursorHidden,
    isShortLandscape,
  });

  const { renderHighlight } = useReaderHighlights({ renditionRef, isReady, highlights });

  useImperativeHandle(ref, () => ({
    prev: handlePrev,
    next: handleNext,
    goToCfi: handleGoToCfi,
    goToPercentage: handleGoToPercentage,
    getRendition: () => renditionRef.current,
    getBook: () => bookRef.current,
    getChapterText: () => getChapterText(renditionRef.current, bookRef.current),
    renderHighlight,
  }));

  const activeThemeId = settings?.palette || settings?.theme || theme;
  const activePalette = THEME_PALETTES[activeThemeId] || THEME_PALETTES.paper;

  const handleContainerClick = useCallback((e) => {
    if (e.target?.closest?.('a, button')) return;
    if (typeof window !== 'undefined' && window.getSelection?.()?.toString().trim()) return;
    const rect = containerRef.current?.getBoundingClientRect() || { left: 0, width: window.innerWidth };
    const xRatio = (e.clientX - rect.left) / Math.max(1, rect.width);
    if (xRatio < 0.3) handlePrev();
    else if (xRatio > 0.7) handleNext();
    else cbRef.current?.onToggleMenu?.();
  }, [handlePrev, handleNext]);

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className={`relative w-full h-full overflow-hidden flex justify-center transition-colors duration-300 select-none ${
        cursorHidden ? 'cursor-none' : 'cursor-default'
      }`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: `var(--reader-bg, ${activePalette.outer || activePalette.bg})`,
        color: `var(--reader-fg, ${activePalette.text})`,
      }}
    >
      {!isReady && !loadError && activeBlob && (
        <ReaderLoadingOverlay activePalette={activePalette} />
      )}

      {loadError && (
        <ReaderErrorOverlay error={loadError} onRetry={() => setRetryCount((c) => c + 1)} />
      )}

      <div
        ref={viewerRef}
        id="reader-viewer"
        data-testid="reader-viewer"
        className={`${activeBlob ? 'block' : 'hidden'} transition-colors duration-300`}
        style={{
          width: `${pageDimensions.pageWidth}px`,
          height: `${pageDimensions.pageHeight}px`,
          marginTop: `${pageDimensions.topOffset}px`,
          marginBottom: `${pageDimensions.bottomOffset}px`,
          marginLeft: 'auto',
          marginRight: 'auto',
          backgroundColor: activePalette.bg,
          overflow: 'hidden',
          scrollbarWidth: 'none',
        }}
      />

      {!activeBlob && (fallbackContent || children) && (
        <main
          className="select-text overflow-y-auto flex-1 transition-colors duration-300 px-4 sm:px-6 md:px-8"
          style={{
            width: `${pageDimensions.pageWidth}px`,
            height: `${pageDimensions.pageHeight}px`,
            marginTop: `${pageDimensions.topOffset}px`,
            marginBottom: `${pageDimensions.bottomOffset}px`,
            backgroundColor: activePalette.bg,
            color: activePalette.text,
          }}
        >
          {children}
        </main>
      )}
    </div>
  );
});

export default ReaderCanvas;
