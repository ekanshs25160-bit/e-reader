'use client';

import { useState, useEffect, useRef } from 'react';
import ePub from 'epubjs';
import { getPageAreaDimensions } from '../engine/layout';
import { applyThemeToRendition } from '../engine/themes';
import {
  setupReaderGestures,
  injectWebFonts,
  enforceNeighborContainment,
  registerRenderHooks,
  computeLocationProgress,
} from '../engine';

export function useEpubRendition({
  renditionRef, bookRef, viewerRef, containerRef, activeBlob, initialCfi,
  currentCfiRef, resizingUntilRef, settings, isShortLandscape, theme, fontSize, fontFamily,
  cursorHidden, handleNext, handlePrev, cbRef, retryCount,
}) {
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState('');
  const lastWheelTurnTimeRef = useRef(0);
  const lastTouchTimestampRef = useRef(0);
  const paramsRef = useRef({});
  paramsRef.current = {
    settings, isShortLandscape, theme, fontSize, fontFamily,
    cursorHidden, handleNext, handlePrev, initialCfi,
  };

  useEffect(() => {
    let isCancelled = false;
    let epubContainerObserver = null;

    async function initEpub() {
      if (!viewerRef.current || !activeBlob) return;
      setIsReady(false);
      setLoadError('');
      viewerRef.current.innerHTML = '';

      if (renditionRef.current) {
        try { renditionRef.current.destroy(); } catch {}
        renditionRef.current = null;
      }
      if (bookRef.current) {
        try { bookRef.current.destroy(); } catch {}
        bookRef.current = null;
      }

      try {
        let bookInput = activeBlob;
        if (typeof activeBlob.arrayBuffer === 'function' && !(activeBlob instanceof ArrayBuffer)) {
          bookInput = await activeBlob.arrayBuffer();
        }
        if (isCancelled) return;

        const book = ePub(bookInput);
        if (isCancelled) {
          epubContainerObserver?.disconnect();
          book.destroy();
          return;
        }
        bookRef.current = book;

        let stageW = containerRef.current?.clientWidth || window.innerWidth;
        let stageH = containerRef.current?.clientHeight || window.innerHeight;
        const currentSettings = paramsRef.current.settings;
        const isTwoPage = stageW >= 1100 && stageW > stageH;
        const dims = getPageAreaDimensions(
          stageW, stageH, paramsRef.current.isShortLandscape, isTwoPage, currentSettings?.margins
        );

        if (viewerRef.current) {
          const s = viewerRef.current.style;
          s.width = `${dims.pageWidth}px`;
          s.height = `${dims.pageHeight}px`;
          s.marginTop = `${dims.topOffset}px`;
          s.marginBottom = `${dims.bottomOffset}px`;
          s.overflow = 'hidden';
          s.scrollbarWidth = 'none';
        }

        const rendition = book.renderTo(viewerRef.current, {
          width: dims.pageWidth,
          height: dims.pageHeight,
          flow: 'paginated',
          manager: 'default',
          spread: isTwoPage ? 'auto' : 'none',
          minSpreadWidth: 900,
          gap: isTwoPage ? 56 : 0,
          overflow: 'hidden',
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;

        epubContainerObserver = new MutationObserver(() => {
          const epubContainer = viewerRef.current?.querySelector('.epub-container');
          if (epubContainer) {
            epubContainer.style.overflow = 'hidden';
            epubContainer.style.scrollbarWidth = 'none';
          }
        });
        epubContainerObserver.observe(viewerRef.current, { childList: true, subtree: true });

        applyThemeToRendition(rendition, {
          settings: currentSettings,
          theme: paramsRef.current.theme,
          fontSize: paramsRef.current.fontSize,
          fontFamily: paramsRef.current.fontFamily,
          cursorHidden: paramsRef.current.cursorHidden,
        });

        rendition.on('relocated', (location) => {
          if (isCancelled || !location?.start) return;
          const isResize = Date.now() < (resizingUntilRef?.current || 0);
          const cfi = isResize && currentCfiRef.current ? currentCfiRef.current : location.start.cfi;
          if (!isResize) currentCfiRef.current = location.start.cfi;
          const locData = computeLocationProgress(book, location);
          cbRef.current.onLocationChange?.({ ...locData, cfi, isResize });
        });

        rendition.hooks.content.register((contents) => {
          if (isCancelled) return;
          enforceNeighborContainment(contents.document, viewerRef.current);
          injectWebFonts(contents.document);
          setupReaderGestures({
            doc: contents.document,
            win: contents.window,
            contents,
            viewerRef,
            containerRef,
            cbRef,
            handleNext: () => paramsRef.current.handleNext?.(),
            handlePrev: () => paramsRef.current.handlePrev?.(),
            lastWheelTurnTimeRef,
            lastTouchTimestampRef,
            getIsCancelled: () => isCancelled,
          });
        });

        registerRenderHooks(rendition, () => isCancelled);

        const displayPromise = rendition.display(paramsRef.current.initialCfi || undefined);
        const timeoutPromise = new Promise((_, reject) => {
          const t = setTimeout(() => reject(new Error('Opening book pages timed out after 20 seconds.')), 20000);
          displayPromise.finally(() => clearTimeout(t));
        });
        await Promise.race([displayPromise, timeoutPromise]);

        if (isCancelled) {
          epubContainerObserver?.disconnect();
          return;
        }
        setIsReady(true);

        book.ready.then(() => {
          if (isCancelled) return;
          if (cbRef.current.onReady) cbRef.current.onReady(book);
          if (cbRef.current.onNavigationLoaded && book.navigation?.toc) {
            cbRef.current.onNavigationLoaded(book.navigation.toc);
          }
          return book.locations.generate(1600);
        }).catch((e) => console.warn('[useEpubRendition] locations error:', e));
      } catch (err) {
        if (!isCancelled) {
          setLoadError(err?.message || 'Failed to render book file.');
          setIsReady(false);
        }
      }
    }

    initEpub();
    return () => {
      isCancelled = true;
      epubContainerObserver?.disconnect();
      try { renditionRef.current?.destroy(); } catch {}
      try { bookRef.current?.destroy(); } catch {}
      renditionRef.current = null;
      bookRef.current = null;
    };
  }, [activeBlob, retryCount, viewerRef, containerRef, currentCfiRef, resizingUntilRef, cbRef, renditionRef, bookRef]);

  return { isReady, loadError };
}
