'use client';

import { useEffect } from 'react';
import { getPageAreaDimensions, applyThemeToRendition } from '../engine';

export function useDynamicTheme({
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
}) {
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    applyThemeToRendition(rendition, { settings, theme, fontSize, fontFamily, cursorHidden });

    if (isReady && containerRef.current && viewerRef.current) {
      resizingUntilRef.current = Date.now() + 600;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const userSpread = settings?.spread || 'auto';
        const isTwoPageSpread =
          userSpread === 'none' ? false : rect.width >= 1100 && rect.width > rect.height;
        const newDims = getPageAreaDimensions(
          rect.width,
          rect.height,
          isShortLandscape,
          isTwoPageSpread,
          settings?.margins
        );
        viewerRef.current.style.width = `${newDims.pageWidth}px`;
        viewerRef.current.style.height = `${newDims.pageHeight}px`;
        viewerRef.current.style.marginTop = `${newDims.topOffset}px`;
        viewerRef.current.style.marginBottom = `${newDims.bottomOffset}px`;
        setPageDimensions(newDims);

        if (rendition.spread) {
          rendition.spread(isTwoPageSpread ? 'auto' : 'none', 900);
        }
        rendition.resize(newDims.pageWidth, newDims.pageHeight);
      }

      const savedCfi = currentCfiRef.current;
      if (savedCfi) {
        try {
          rendition
            .display(savedCfi)
            .catch(() => {})
            .finally(() => {
              resizingUntilRef.current = Date.now() + 400;
            });
        } catch {}
      }
    }
  }, [
    renditionRef,
    settings,
    theme,
    fontSize,
    fontFamily,
    cursorHidden,
    isReady,
    isShortLandscape,
    containerRef,
    viewerRef,
    currentCfiRef,
    resizingUntilRef,
    setPageDimensions,
  ]);
}
