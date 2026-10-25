'use client';

import { useState, useEffect, useRef } from 'react';
import { getPageAreaDimensions } from '../engine/layout';

export function useViewportResize({
  containerRef,
  viewerRef,
  renditionRef,
  currentCfiRef,
  resizingUntilRef: externalResizingUntilRef,
  isReady,
  settings,
  isShortLandscape,
}) {
  const internalResizingUntilRef = useRef(0);
  const resizingUntilRef = externalResizingUntilRef || internalResizingUntilRef;
  const [pageDimensions, setPageDimensions] = useState({
    pageWidth: 704,
    pageHeight: 708,
    topOffset: 80,
    bottomOffset: 112,
  });

  useEffect(() => {
    if (!containerRef.current || !viewerRef.current) return;
    let resizeTimer = null;
    let windowResizeTimer = null;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: stageW, height: stageH } = entry.contentRect;
        if (stageW <= 0 || stageH <= 0) continue;

        const userSpread = settings?.spread || 'auto';
        const isTwoPageSpread = userSpread === 'none' ? false : stageW >= 1100 && stageW > stageH;
        const dims = getPageAreaDimensions(stageW, stageH, isShortLandscape, isTwoPageSpread, settings?.margins);

        if (viewerRef.current) {
          viewerRef.current.style.width = `${dims.pageWidth}px`;
          viewerRef.current.style.height = `${dims.pageHeight}px`;
          viewerRef.current.style.marginTop = `${dims.topOffset}px`;
          viewerRef.current.style.marginBottom = `${dims.bottomOffset}px`;
        }
        setPageDimensions(dims);

        clearTimeout(resizeTimer);
        resizingUntilRef.current = Date.now() + 600;
        resizeTimer = setTimeout(() => {
          if (renditionRef.current && isReady) {
            try {
              const savedCfi = currentCfiRef.current;
              const newSpread = isTwoPageSpread ? 'auto' : 'none';
              if (renditionRef.current.spread) {
                renditionRef.current.spread(newSpread, 900);
              }
              renditionRef.current.resize(dims.pageWidth, dims.pageHeight);
              if (savedCfi) {
                renditionRef.current.display(savedCfi).catch(() => {}).finally(() => {
                  resizingUntilRef.current = Date.now() + 400;
                });
              } else {
                resizingUntilRef.current = Date.now() + 400;
              }
            } catch (err) {
              console.warn('[ReaderCanvas] Live reflow resize error:', err);
            }
          }
        }, 120);
      }
    });

    observer.observe(containerRef.current);

    const handleDeviceChange = () => {
      clearTimeout(windowResizeTimer);
      resizingUntilRef.current = Date.now() + 600;
      windowResizeTimer = setTimeout(() => {
        if (containerRef.current && viewerRef.current && renditionRef.current && isReady) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const userSpread = settings?.spread || 'auto';
            const isTwoPageSpread = userSpread === 'none' ? false : rect.width >= 1100 && rect.width > rect.height;
            const newDims = getPageAreaDimensions(rect.width, rect.height, isShortLandscape, isTwoPageSpread, settings?.margins);
            viewerRef.current.style.width = `${newDims.pageWidth}px`;
            viewerRef.current.style.height = `${newDims.pageHeight}px`;
            viewerRef.current.style.marginTop = `${newDims.topOffset}px`;
            viewerRef.current.style.marginBottom = `${newDims.bottomOffset}px`;
            setPageDimensions(newDims);

            try {
              const savedCfi = currentCfiRef.current;
              const newSpread = isTwoPageSpread ? 'auto' : 'none';
              if (renditionRef.current.spread) {
                renditionRef.current.spread(newSpread, 900);
              }
              renditionRef.current.resize(newDims.pageWidth, newDims.pageHeight);
              if (savedCfi) {
                renditionRef.current.display(savedCfi).catch(() => {}).finally(() => {
                  resizingUntilRef.current = Date.now() + 400;
                });
              } else {
                resizingUntilRef.current = Date.now() + 400;
              }
            } catch (err) {
              console.warn('[ReaderCanvas] Device rotation/resize reflow error:', err);
            }
          }
        }
      }, 120);
    };

    window.addEventListener('resize', handleDeviceChange);
    window.addEventListener('orientationchange', handleDeviceChange);

    return () => {
      clearTimeout(resizeTimer);
      clearTimeout(windowResizeTimer);
      observer.disconnect();
      window.removeEventListener('resize', handleDeviceChange);
      window.removeEventListener('orientationchange', handleDeviceChange);
    };
  }, [containerRef, viewerRef, renditionRef, currentCfiRef, isReady, isShortLandscape, settings, resizingUntilRef]);

  return { pageDimensions, setPageDimensions, resizingUntilRef };
}
