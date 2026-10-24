"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import ePub from "epubjs";

const THEME_PALETTES = {
  day: { bg: "#FAF9F6", text: "#152A41", outer: "#FAF9F6" },
  paper: { bg: "#FAF9F6", text: "#152A41", outer: "#FAF9F6" },
  sepia: { bg: "#F4ECD8", text: "#2C2214", outer: "#F4ECD8" },
  night: { bg: "#141824", text: "#F0F2F5", outer: "#141824" },
  oled: { bg: "#000000", text: "#EDEDED", outer: "#000000" },
  dark: { bg: "#141824", text: "#F0F2F5", outer: "#141824" },
};

/**
 * Breakpoints: phone < 768px, tablet 768-1023px, desktop >= 1024px.
 * Sizing rules:
 * - phone: stage width minus 2x16px (stageWidth - 32px)
 * - tablet single page: min(stageWidth, 44rem)
 * - desktop single page: min(stageWidth minus 2x48px, 44rem)
 */
export function getPageAreaDimensions(
  stageWidth,
  stageHeight,
  isShortLandscape = false,
  isTwoPage = false
) {
  const remInPx =
    typeof document !== "undefined"
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16;
  const max44rem = 44 * remInPx; // 704px at 16px base font

  let pageWidth;
  if (stageWidth < 768) {
    // phone < 768px: stage width minus 2x16px
    pageWidth = Math.max(0, stageWidth - 32);
  } else if (stageWidth < 1024) {
    // tablet 768-1023px: min(stage, 44rem)
    pageWidth = Math.min(stageWidth, max44rem);
  } else if (isTwoPage) {
    // desktop two facing pages: at most 1200px wide
    pageWidth = Math.min(stageWidth - 96, 1200);
  } else {
    // desktop single page: min(stage minus 2x48px, 44rem)
    pageWidth = Math.min(stageWidth - 96, max44rem);
  }

  pageWidth = Math.floor(pageWidth);

  const topOffset = isShortLandscape ? 44 : 80;
  const bottomOffset = isShortLandscape ? 52 : 112;
  const pageHeight = Math.max(100, Math.floor(stageHeight - topOffset - bottomOffset));

  return { pageWidth, pageHeight, topOffset, bottomOffset };
}

const ReaderCanvas = forwardRef(function ReaderCanvas(
  {
    bookBlob,
    file, // alias for bookBlob
    initialCfi,
    theme = "paper",
    fontSize = 18.5,
    fontFamily = "literata",
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
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1, chapter: "" });
  const currentCfiRef = useRef(initialCfi || null);
  const resizingUntilRef = useRef(0);
  const lastWheelTurnTimeRef = useRef(0);
  const lastTouchTimestampRef = useRef(0);
  const [pageDimensions, setPageDimensions] = useState({
    pageWidth: 704,
    pageHeight: 708,
    topOffset: 80,
    bottomOffset: 112,
  });

  useEffect(() => {
    if (initialCfi) {
      currentCfiRef.current = initialCfi;
    }
  }, [initialCfi]);

  // Keep latest callbacks in a ref so listeners registered once at mount never go stale
  const cbRef = useRef({});
  cbRef.current = {
    onToggleMenu,
    onUserInteraction,
    onLocationChange,
    onTextSelect,
    onTextSelected,
    onKeyDown,
    onIframeMouseMove,
  };

  const handleNext = useCallback(() => {
    onUserInteraction && onUserInteraction();
    if (renditionRef.current) {
      try {
        const p = renditionRef.current.next();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch (err) {
        console.warn("[ReaderCanvas] next error:", err);
      }
    }
  }, [onUserInteraction]);

  const handlePrev = useCallback(() => {
    onUserInteraction && onUserInteraction();
    if (renditionRef.current) {
      try {
        const p = renditionRef.current.prev();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch (err) {
        console.warn("[ReaderCanvas] prev error:", err);
      }
    }
  }, [onUserInteraction]);

  const handleGoToCfi = useCallback((targetCfi) => {
    onUserInteraction && onUserInteraction();
    if (renditionRef.current && targetCfi) {
      currentCfiRef.current = targetCfi;
      renditionRef.current.display(targetCfi);
    }
  }, [onUserInteraction]);

  const handleGoToPercentage = useCallback((percentage) => {
    onUserInteraction && onUserInteraction();
    if (renditionRef.current && bookRef.current?.locations) {
      try {
        const pct = percentage > 1 ? percentage / 100 : percentage;
        const cfi = bookRef.current.locations.cfiFromPercentage(pct);
        if (cfi) {
          currentCfiRef.current = cfi;
          renditionRef.current.display(cfi);
        }
      } catch (err) {
        console.warn("[ReaderCanvas] Failed to go to percentage:", err);
      }
    }
  }, [onUserInteraction]);

  const renderHighlight = useCallback((cfiRange, color = "#F3D382", id = null) => {
    if (renditionRef.current && cfiRange) {
      try {
        renditionRef.current.annotations.highlight(
          cfiRange,
          { id: id || `hl-${Date.now()}` },
          () => {},
          "flyleaf-highlight",
          {
            fill: color || "#F3D382",
            "fill-opacity": "0.42",
            "mix-blend-mode": "multiply",
          }
        );
      } catch (e) {
        // Annotation may already exist or fail gracefully
      }
    }
  }, []);

  const getChapterText = useCallback(() => {
    try {
      if (renditionRef.current) {
        const contents = renditionRef.current.getContents?.() || [];
        if (contents.length > 0) {
          let text = "";
          for (const content of contents) {
            const doc = content.document;
            if (doc?.body) {
              text += (doc.body.innerText || doc.body.textContent || "") + "\n";
            }
          }
          if (text.trim()) {
            return text.trim().slice(0, 50000);
          }
        }
      }
      if (bookRef.current) {
        const location = renditionRef.current?.currentLocation?.();
        const href = location?.start?.href;
        if (href) {
          const item = bookRef.current.spine?.get?.(href);
          if (item?.document?.body) {
            const text = item.document.body.innerText || item.document.body.textContent || "";
            if (text.trim()) return text.trim().slice(0, 50000);
          }
        }
      }
    } catch (err) {
      console.warn("[ReaderCanvas] Failed to get chapter text:", err);
    }
    return "";
  }, []);

  // Expose imperative API for parent HUD controls
  useImperativeHandle(ref, () => ({
    prev: handlePrev,
    next: handleNext,
    goToCfi: handleGoToCfi,
    goToPercentage: handleGoToPercentage,
    getRendition: () => renditionRef.current,
    getBook: () => bookRef.current,
    getChapterText,
    renderHighlight,
  }));

  // Dynamic theme & typography application helper
  const applyThemeToRendition = useCallback((rendition) => {
    if (!rendition) return;

    const chosenTheme = settings?.palette || settings?.theme || theme;
    const isSysDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const effectiveTheme =
      chosenTheme === "auto" ? (isSysDark ? "night" : "paper") : chosenTheme;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 600;
    const isPhone = typeof window !== "undefined" && window.innerWidth < 768;
    const isTablet =
      typeof window !== "undefined" && window.innerWidth >= 768 && window.innerWidth < 1024;
    const defaultResponsiveFontSize = isPhone ? 18 : isTablet ? 19 : 20;

    const chosenFontSize = settings?.fontSize || fontSize || defaultResponsiveFontSize;
    const chosenFontFamily = settings?.typeface || settings?.fontFamily || fontFamily;
    const rawAlign = settings?.align || settings?.textAlign || "auto";
    const chosenAlign = rawAlign === "auto" ? (isMobile ? "left" : "justify") : rawAlign;
    const chosenLineHeight = settings?.lineHeight || "1.6";

    const palette = THEME_PALETTES[effectiveTheme] || THEME_PALETTES.paper;
    const fontStack =
      chosenFontFamily === "sans" || chosenFontFamily === "inter"
        ? "'Inter', sans-serif"
        : chosenFontFamily === "newsreader"
        ? "'Newsreader', Georgia, serif"
        : chosenFontFamily === "garamond"
        ? "'EB Garamond', Georgia, serif"
        : chosenFontFamily === "source-serif"
        ? "'Source Serif 4', Georgia, serif"
        : chosenFontFamily === "lora"
        ? "'Lora', Georgia, serif"
        : chosenFontFamily === "opendyslexic"
        ? "'OpenDyslexic', sans-serif"
        : "'Literata', Georgia, serif";

    rendition.themes.default({
      "html, body": {
        background: `${palette.bg} !important`,
        color: `${palette.text} !important`,
        "font-family": `${fontStack} !important`,
        padding: "0 !important",
        margin: "0 !important",
        "padding-left": "0 !important",
        "padding-right": "0 !important",
        "padding-top": "0 !important",
        "padding-bottom": "0 !important",
        height: "100% !important",
        width: "100% !important",
        "box-sizing": "border-box !important",
        "-webkit-user-select": "text !important",
        "user-select": "text !important",
        cursor: `${cursorHidden ? "none" : "default"} !important`,
        overflow: "hidden !important",
        "scrollbar-width": "none !important",
      },
      "::selection": {
        background: "#ffdcc3 !important",
        color: "#2e1500 !important",
      },
      p: {
        "text-align": `${chosenAlign} !important`,
        "line-height": `${chosenLineHeight} !important`,
        "font-size": `${chosenFontSize}px !important`,
        "text-indent": "1.5em !important",
        "margin-top": "0 !important",
        "margin-bottom": "0.45em !important",
        ...(chosenAlign === "justify"
          ? {
              "-webkit-hyphens": "auto !important",
              "-ms-hyphens": "auto !important",
              hyphens: "auto !important",
            }
          : {}),
      },
      "p:first-of-type": {
        "text-indent": "0 !important",
      },
      "a, h1, h2, h3, h4, span, div": {
        color: `${palette.text} !important`,
      },
      img: {
        "max-width": "100% !important",
        "max-height": "100% !important",
        "object-fit": "contain !important",
      },
    });
    rendition.themes.fontSize(`${chosenFontSize}px`);

    if (settings?.spread) {
      try {
        rendition.spread(settings.spread === "auto" ? "auto" : "none");
      } catch (err) {
        console.warn("[ReaderCanvas] Failed to update spread:", err);
      }
    }
  }, [settings, theme, fontSize, fontFamily, cursorHidden]);

  // 1. Mount & Load EPUB with 20s timeout, cancel safety, and blob identity dependency
  useEffect(() => {
    let isCancelled = false;
    let epubContainerObserver = null;

    async function initEpub() {
      if (!viewerRef.current) return;
      if (!activeBlob) return;

      setIsReady(false);
      setLoadError("");
      viewerRef.current.innerHTML = "";

      // Cleanup prior instances
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch {
          // ignore
        }
        renditionRef.current = null;
      }
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch {
          // ignore
        }
        bookRef.current = null;
      }

      try {
        let bookInput;

        if (activeBlob instanceof ArrayBuffer) {
          bookInput = activeBlob;
        } else if (typeof activeBlob.arrayBuffer === "function") {
          bookInput = await activeBlob.arrayBuffer();
        } else {
          bookInput = activeBlob;
        }

        if (isCancelled) return;

        const book = ePub(bookInput);
        if (isCancelled) {
          book.destroy();
          return;
        }
        bookRef.current = book;

        let stageW = containerRef.current ? containerRef.current.clientWidth : window.innerWidth;
        let stageH = containerRef.current ? containerRef.current.clientHeight : window.innerHeight;
        if (!stageW || stageW <= 0) stageW = window.innerWidth;
        if (!stageH || stageH <= 0) stageH = window.innerHeight;

        const isTwoPageSpread = stageW >= 1100 && stageW > stageH;
        const dims = getPageAreaDimensions(stageW, stageH, isShortLandscape, isTwoPageSpread);
        setPageDimensions(dims);

        if (viewerRef.current) {
          viewerRef.current.style.width = `${dims.pageWidth}px`;
          viewerRef.current.style.height = `${dims.pageHeight}px`;
          viewerRef.current.style.marginTop = `${dims.topOffset}px`;
          viewerRef.current.style.marginBottom = `${dims.bottomOffset}px`;
        }

        const spreadMode = isTwoPageSpread ? "auto" : "none";
        const gap = isTwoPageSpread ? 56 : 0;
        const rendition = book.renderTo(viewerRef.current, {
          width: dims.pageWidth,
          height: dims.pageHeight,
          flow: "paginated",
          manager: "default",
          spread: spreadMode,
          minSpreadWidth: 900,
          gap: gap,
          overflow: "hidden",
          allowScriptedContent: false,
        });
        renditionRef.current = rendition;

        // Synchronous overflow clip on the viewer wrapper (before rendition.display)
        if (viewerRef.current) {
          viewerRef.current.style.overflow = "hidden";
          viewerRef.current.style.scrollbarWidth = "none";
        }

        // MutationObserver: apply overflow: hidden to .epub-container the moment it appears
        epubContainerObserver = new MutationObserver(() => {
          const epubContainer = viewerRef.current?.querySelector(".epub-container");
          if (epubContainer) {
            epubContainer.style.overflow = "hidden";
            epubContainer.style.scrollbarWidth = "none";
            epubContainer.style.padding = "0";
            epubContainer.style.margin = "0";
          }
          const epubView = viewerRef.current?.querySelector(".epub-view");
          if (epubView) {
            epubView.style.overflow = "hidden";
            epubView.style.scrollbarWidth = "none";
            epubView.style.padding = "0";
            epubView.style.margin = "0";
          }
          const iframe = viewerRef.current?.querySelector("iframe");
          if (iframe) {
            iframe.style.overflow = "hidden";
            iframe.style.scrollbarWidth = "none";
            iframe.style.padding = "0";
            iframe.style.margin = "0";
            iframe.style.border = "none";
          }
        });
        epubContainerObserver.observe(viewerRef.current, { childList: true, subtree: true });

        // Apply theme immediately so initial pages are properly styled and padded from first render
        applyThemeToRendition(rendition);

        // Attach relocated listener immediately
        rendition.on("relocated", (location) => {
          if (isCancelled || !location?.start) return;

          const isResize = Date.now() < resizingUntilRef.current;
          const cfi = isResize && currentCfiRef.current ? currentCfiRef.current : location.start.cfi;
          if (!isResize) {
            currentCfiRef.current = location.start.cfi;
          }
          const displayedPage = location.start.displayed?.page || 1;
          const displayedTotal = location.start.displayed?.total || 1;

          let progress = 0;
          if (book.locations && book.locations.length() > 0) {
            progress = book.locations.percentageFromCfi(cfi) || 0;
          } else {
            progress = displayedPage / Math.max(1, displayedTotal);
          }

          let chapterLabel = "";
          if (book.navigation) {
            const navItem = book.navigation.get(location.start.href);
            if (navItem?.label) chapterLabel = navItem.label.trim();
          }

          setPageInfo({
            current: displayedPage,
            total: displayedTotal,
            chapter: chapterLabel,
          });

          const isLastPageInChapter = displayedPage === displayedTotal && displayedTotal > 1;

          cbRef.current.onLocationChange &&
            cbRef.current.onLocationChange({
              cfi,
              progress,
              percentage: progress,
              chapter: chapterLabel,
              page: displayedPage,
              totalPages: displayedTotal,
              isLastPageInChapter,
              isResize,
            });
        });

        // Hook directly into rendered chapter iframes for Selection, Taps, and Swipes
        rendition.hooks.content.register((contents) => {
          if (isCancelled) return;
          const doc = contents.document;
          const win = contents.window;

          // Enforce neighbor containment on html/body and outer epub container
          if (doc) {
            if (doc.documentElement) {
              doc.documentElement.style.overflow = "hidden";
              doc.documentElement.style.scrollbarWidth = "none";
              doc.documentElement.style.margin = "0";
              doc.documentElement.style.padding = "0";
            }
            if (doc.body) {
              doc.body.style.overflow = "hidden";
              doc.body.style.scrollbarWidth = "none";
              doc.body.style.margin = "0";
              doc.body.style.padding = "0";
            }
          }
          const epubContainer = viewerRef.current?.querySelector(".epub-container");
          if (epubContainer) {
            epubContainer.style.overflow = "hidden";
            epubContainer.style.scrollbarWidth = "none";
          }

          // Ensure all reader webfonts and OpenDyslexic are available inside the chapter iframe
          if (doc && doc.head) {
            if (!doc.getElementById("flyleaf-fonts")) {
              const link = doc.createElement("link");
              link.id = "flyleaf-fonts";
              link.rel = "stylesheet";
              link.href =
                "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..700;1,400..700&family=Inter:wght@400;500;600;700&family=Literata:ital,opsz,wght@0,7..72,400..700;1,7..72,400..700&family=Lora:ital,wght@0,400..700;1,400..700&family=Newsreader:ital,opsz,wght@0,6..72,400..700;1,6..72,400..700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400..700;1,8..60,400..700&display=swap";
              doc.head.appendChild(link);
            }
            if (!doc.getElementById("flyleaf-opendyslexic")) {
              const odLink = doc.createElement("link");
              odLink.id = "flyleaf-opendyslexic";
              odLink.rel = "stylesheet";
              odLink.href = "https://cdn.jsdelivr.net/npm/@fontsource/opendyslexic@5.0.21/index.min.css";
              doc.head.appendChild(odLink);
            }
          }

          const notifyInteraction = () => {
            cbRef.current.onUserInteraction && cbRef.current.onUserInteraction();
          };

          let touchStartX = 0;
          let touchStartY = 0;
          let touchStartTime = 0;
          let touchLastX = 0;
          let isTouchDragging = false;
          let lastTouchEndTimestamp = 0;

          const checkSelection = () => {
            notifyInteraction();
            setTimeout(() => {
              if (isCancelled) return;
              const sel = win.getSelection ? win.getSelection() : null;
              const text = sel ? sel.toString().trim() : "";
              if (text.length > 0) {
                let cfiRange = null;
                if (sel.rangeCount > 0 && typeof contents.cfiFromRange === "function") {
                  try {
                    cfiRange = contents.cfiFromRange(sel.getRangeAt(0));
                  } catch (err) {
                    console.warn("[ReaderCanvas] Failed to derive cfiFromRange:", err);
                  }
                }

                let selectionRect = null;
                if (sel.rangeCount > 0) {
                  try {
                    const range = sel.getRangeAt(0);
                    const r = range.getBoundingClientRect();
                    let frameTop = 0;
                    let frameLeft = 0;
                    const fe = win.frameElement;
                    if (fe) {
                      const fRect = fe.getBoundingClientRect();
                      frameTop = fRect.top;
                      frameLeft = fRect.left;
                    }
                    selectionRect = {
                      top: frameTop + r.top,
                      bottom: frameTop + r.bottom,
                      left: frameLeft + r.left,
                      right: frameLeft + r.right,
                      width: r.width,
                      height: r.height,
                    };
                  } catch (err) {
                    console.warn("[ReaderCanvas] Failed to calculate selectionRect:", err);
                  }
                }

                const anchorText = sel.anchorNode?.textContent || text;
                const payload = {
                  text,
                  cfiRange,
                  contextSentence: anchorText.slice(0, 300),
                  selectionRect,
                };
                if (cbRef.current.onTextSelect) cbRef.current.onTextSelect(payload);
                if (cbRef.current.onTextSelected) cbRef.current.onTextSelected(text, cfiRange, payload);
              }
            }, 60);
          };

          const handleTouchStart = (e) => {
            notifyInteraction();
            if (e.touches && e.touches.length === 1) {
              touchStartX = e.touches[0].clientX;
              touchStartY = e.touches[0].clientY;
              touchLastX = touchStartX;
              touchStartTime = Date.now();
              isTouchDragging = false;
            }
          };

          const handleTouchMove = (e) => {
            if (!touchStartX && !touchStartY) return;
            if (e.touches && e.touches.length === 1) {
              const currentX = e.touches[0].clientX;
              const currentY = e.touches[0].clientY;
              touchLastX = currentX;
              const dx = currentX - touchStartX;
              const dy = currentY - touchStartY;
              const absDx = Math.abs(dx);
              const absDy = Math.abs(dy);

              if (!isTouchDragging) {
                if (absDx > 8 && absDx > 1.2 * absDy) {
                  isTouchDragging = true;
                  // Swipes never start a text selection: cancel any selection immediately
                  if (win.getSelection) {
                    try { win.getSelection().removeAllRanges(); } catch {}
                  }
                  if (window.getSelection) {
                    try { window.getSelection().removeAllRanges(); } catch {}
                  }
                }
              }

              if (isTouchDragging) {
                if (e.cancelable) e.preventDefault();
                // Clear selection continuously while dragging
                if (win.getSelection && !win.getSelection().isCollapsed) {
                  try { win.getSelection().removeAllRanges(); } catch {}
                }
                const prefersReducedMotion =
                  typeof window !== "undefined" &&
                  window.matchMedia &&
                  window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                if (!prefersReducedMotion && viewerRef.current) {
                  viewerRef.current.style.transition = "none";
                  viewerRef.current.style.transform = `translateX(${dx}px)`;
                }
              }
            }
          };

          const handleTouchEnd = (e) => {
            notifyInteraction();
            lastTouchEndTimestamp = Date.now();
            lastTouchTimestampRef.current = Date.now();

            const prefersReducedMotion =
              typeof window !== "undefined" &&
              window.matchMedia &&
              window.matchMedia("(prefers-reduced-motion: reduce)").matches;

            if (isTouchDragging) {
              isTouchDragging = false;
              const dx = touchLastX - touchStartX;
              const absDx = Math.abs(dx);
              const duration = Date.now() - touchStartTime;

              // Commit page turn if dragged > 45px or quick flick (absDx > 20 in < 250ms)
              const shouldTurn = absDx > 45 || (absDx > 20 && duration < 250);
              if (shouldTurn) {
                const isNext = dx < 0;
                if (!prefersReducedMotion && viewerRef.current) {
                  const targetX = isNext ? -Math.min(window.innerWidth, 500) : Math.min(window.innerWidth, 500);
                  viewerRef.current.style.transition = "transform 220ms cubic-bezier(0.25, 1, 0.5, 1)";
                  viewerRef.current.style.transform = `translateX(${targetX}px)`;
                  setTimeout(() => {
                    if (viewerRef.current) {
                      viewerRef.current.style.transition = "none";
                      viewerRef.current.style.transform = "none";
                    }
                    if (isNext) handleNext();
                    else handlePrev();
                  }, 220);
                } else {
                  if (viewerRef.current) {
                    viewerRef.current.style.transition = "none";
                    viewerRef.current.style.transform = "none";
                  }
                  if (isNext) handleNext();
                  else handlePrev();
                }
              } else {
                // Snap back to original position
                if (!prefersReducedMotion && viewerRef.current) {
                  viewerRef.current.style.transition = "transform 220ms cubic-bezier(0.25, 1, 0.5, 1)";
                  viewerRef.current.style.transform = "translateX(0px)";
                  setTimeout(() => {
                    if (viewerRef.current) {
                      viewerRef.current.style.transition = "none";
                      viewerRef.current.style.transform = "none";
                    }
                  }, 220);
                } else {
                  if (viewerRef.current) {
                    viewerRef.current.style.transition = "none";
                    viewerRef.current.style.transform = "none";
                  }
                }
              }
              // Swipes NEVER start a text selection or the center-tap menu!
              touchStartX = 0;
              touchStartY = 0;
              return;
            }

            const duration = Date.now() - touchStartTime;
            touchStartX = 0;
            touchStartY = 0;

            // Long-press (>= 500ms): allow native text selection to complete
            if (duration >= 500) {
              checkSelection();
              return;
            }

            // Interactive element check
            if (e.target && e.target.closest && (e.target.closest("a") || e.target.closest("button"))) {
              return;
            }

            // Existing selection check
            const sel = win.getSelection ? win.getSelection() : null;
            if (sel && sel.toString().trim().length > 0) {
              checkSelection();
              return;
            }

            // Click zone navigation
            const touch = e.changedTouches ? e.changedTouches[0] : null;
            const clientX = touch ? touch.clientX : touchLastX;

            let frameLeft = 0;
            try {
              const fe = win.frameElement;
              if (fe) frameLeft = fe.getBoundingClientRect().left;
            } catch {
              frameLeft = 0;
            }
            const viewerRect = containerRef.current
              ? containerRef.current.getBoundingClientRect()
              : { left: 0, width: window.innerWidth };
            const screenX = frameLeft + clientX;
            const xRatio = (screenX - viewerRect.left) / Math.max(1, viewerRect.width);

            if (xRatio < 0.30) {
              handlePrev();
            } else if (xRatio > 0.70) {
              handleNext();
            } else {
              cbRef.current.onToggleMenu && cbRef.current.onToggleMenu();
            }
          };

          const handleClick = (e) => {
            // Prevent synthetic click from firing immediately after touchend
            if (Date.now() - lastTouchEndTimestamp < 600) return;
            if (Date.now() - lastTouchTimestampRef.current < 600) return;

            if (e.target && e.target.closest && (e.target.closest("a") || e.target.closest("button"))) {
              return;
            }

            const sel = win.getSelection ? win.getSelection() : null;
            if (sel && sel.toString().trim().length > 0) return;

            let frameLeft = 0;
            try {
              const fe = win.frameElement;
              if (fe) frameLeft = fe.getBoundingClientRect().left;
            } catch {
              frameLeft = 0;
            }
            const viewerRect = containerRef.current
              ? containerRef.current.getBoundingClientRect()
              : { left: 0, width: window.innerWidth };
            const screenX = frameLeft + e.clientX;
            const xRatio = (screenX - viewerRect.left) / Math.max(1, viewerRect.width);

            // On desktop (>= 1024px), no full-page click zones: clicking text never turns pages
            if (typeof window !== "undefined" && window.innerWidth >= 1024) {
              cbRef.current.onToggleMenu && cbRef.current.onToggleMenu();
              return;
            }

            if (xRatio < 0.30) {
              handlePrev();
            } else if (xRatio > 0.70) {
              handleNext();
            } else {
              cbRef.current.onToggleMenu && cbRef.current.onToggleMenu();
            }
          };

          // Horizontal trackpad scroll: turns one page per gesture (debounced 350ms). Plain vertical wheel does nothing.
          const handleIframeWheel = (e) => {
            if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
              return; // Plain vertical wheel does nothing
            }
            if (Math.abs(e.deltaX) > 20) {
              if (e.cancelable) e.preventDefault();
              const now = Date.now();
              if (now - lastWheelTurnTimeRef.current >= 350) {
                lastWheelTurnTimeRef.current = now;
                if (e.deltaX > 0) {
                  handleNext();
                } else {
                  handlePrev();
                }
              }
            }
          };

          const handleIframePointerMove = (e) => {
            let frameTop = 0;
            let frameLeft = 0;
            try {
              const fe = win.frameElement;
              if (fe) {
                const rect = fe.getBoundingClientRect();
                frameTop = rect.top;
                frameLeft = rect.left;
              }
            } catch {
              frameTop = 0;
              frameLeft = 0;
            }
            if (cbRef.current.onIframeMouseMove) {
              cbRef.current.onIframeMouseMove({
                clientX: frameLeft + e.clientX,
                clientY: frameTop + e.clientY,
              });
            }
          };

          doc.addEventListener("pointermove", handleIframePointerMove);
          doc.addEventListener("touchstart", handleTouchStart, { passive: false });
          doc.addEventListener("touchmove", handleTouchMove, { passive: false });
          doc.addEventListener("touchend", handleTouchEnd);
          doc.addEventListener("mouseup", checkSelection);
          doc.addEventListener("click", handleClick);
          doc.addEventListener("wheel", handleIframeWheel, { passive: false });

          // Keyboard support inside iframe
          doc.addEventListener("keydown", (e) => {
            notifyInteraction();
            if (cbRef.current.onKeyDown) {
              cbRef.current.onKeyDown(e);
            }
          });
        });

        // Hook into rendered views to strictly eliminate any layout-injected padding
        rendition.hooks.render.register((view) => {
          if (isCancelled) return;
          try {
            const doc = view?.contents?.document;
            if (doc?.documentElement) {
              doc.documentElement.style.setProperty("padding", "0", "important");
              doc.documentElement.style.setProperty("padding-left", "0", "important");
              doc.documentElement.style.setProperty("padding-right", "0", "important");
              doc.documentElement.style.setProperty("padding-top", "0", "important");
              doc.documentElement.style.setProperty("padding-bottom", "0", "important");
              doc.documentElement.style.setProperty("margin", "0", "important");
              doc.documentElement.style.setProperty("overflow", "hidden", "important");
              doc.documentElement.style.setProperty("scrollbar-width", "none", "important");
            }
            if (doc?.body) {
              doc.body.style.setProperty("padding", "0", "important");
              doc.body.style.setProperty("padding-left", "0", "important");
              doc.body.style.setProperty("padding-right", "0", "important");
              doc.body.style.setProperty("padding-top", "0", "important");
              doc.body.style.setProperty("padding-bottom", "0", "important");
              doc.body.style.setProperty("margin", "0", "important");
              doc.body.style.setProperty("overflow", "hidden", "important");
              doc.body.style.setProperty("scrollbar-width", "none", "important");
            }
          } catch (e) {
            // ignore
          }
        });

        // 20-second timeout around rendition.display()
        const DISPLAY_TIMEOUT_MS = 20000;
        let timeoutTimer = null;

        const displayPromise = rendition.display(initialCfi || undefined);
        const timeoutPromise = new Promise((_, reject) => {
          timeoutTimer = setTimeout(() => {
            reject(
              new Error("Opening book pages timed out after 20 seconds. The file may be corrupt or too large.")
            );
          }, DISPLAY_TIMEOUT_MS);
        });

        try {
          await Promise.race([displayPromise, timeoutPromise]);
        } finally {
          if (timeoutTimer) clearTimeout(timeoutTimer);
        }

        if (isCancelled) {
          epubContainerObserver?.disconnect();
          return;
        }
        setIsReady(true);

        // Notify parent when navigation/TOC is loaded & generate locations
        book.ready
          .then(() => {
            if (isCancelled) return;
            if (onReady) onReady(book);
            if (onNavigationLoaded && book.navigation?.toc) {
              onNavigationLoaded(book.navigation.toc);
            }
            return book.locations.generate(1600);
          })
          .catch((readyErr) => {
            console.warn("[ReaderCanvas] Background location notice:", readyErr);
          });
      } catch (err) {
        console.error("EPUB Render Error:", err);
        if (!isCancelled) {
          const message = err?.message || String(err) || "Failed to render book file.";
          setLoadError(message);
          setIsReady(false);
        }
      }
    }

    initEpub();

    return () => {
      isCancelled = true;
      epubContainerObserver?.disconnect();
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch {
          // ignore
        }
        renditionRef.current = null;
      }
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch {
          // ignore
        }
        bookRef.current = null;
      }
    };
  }, [activeBlob, retryCount]);

  // 2. Apply Theme, Font Size & Family Dynamically
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    applyThemeToRendition(rendition);

    // Re-display saved CFI so reading position never jumps when changing options
    const savedCfi = currentCfiRef.current;
    if (savedCfi && isReady) {
      try {
        rendition.display(savedCfi);
      } catch (e) {
        // ignore
      }
    }
  }, [applyThemeToRendition, isReady]);

  // 3. Viewport size observer: debounced 120ms rendition.resize and re-display saved CFI
  useEffect(() => {
    if (!containerRef.current) return;

    let resizeTimer = null;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: stageW, height: stageH } = entry.contentRect;
        if (stageW <= 0 || stageH <= 0) continue;

        const isTwoPageSpread = stageW >= 1100 && stageW > stageH;
        const newDims = getPageAreaDimensions(stageW, stageH, isShortLandscape, isTwoPageSpread);

        if (viewerRef.current) {
          viewerRef.current.style.width = `${newDims.pageWidth}px`;
          viewerRef.current.style.height = `${newDims.pageHeight}px`;
          viewerRef.current.style.marginTop = `${newDims.topOffset}px`;
          viewerRef.current.style.marginBottom = `${newDims.bottomOffset}px`;
        }
        setPageDimensions(newDims);

        clearTimeout(resizeTimer);
        resizingUntilRef.current = Date.now() + 600;
        resizeTimer = setTimeout(() => {
          if (renditionRef.current && isReady) {
            try {
              const savedCfi = currentCfiRef.current;
              const newSpread = isTwoPageSpread ? "auto" : "none";
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
              console.warn("[ReaderCanvas] Live reflow resize error:", err);
            }
          }
        }, 120);
      }
    });

    observer.observe(containerRef.current);

    // Device rotation & window resize listener (debounce 120ms)
    let windowResizeTimer = null;
    const handleDeviceChange = () => {
      clearTimeout(windowResizeTimer);
      resizingUntilRef.current = Date.now() + 600;
      windowResizeTimer = setTimeout(() => {
        if (containerRef.current && viewerRef.current && renditionRef.current && isReady) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            const isTwoPageSpread = rect.width >= 1100 && rect.width > rect.height;
            const newDims = getPageAreaDimensions(
              rect.width,
              rect.height,
              isShortLandscape,
              isTwoPageSpread
            );
            viewerRef.current.style.width = `${newDims.pageWidth}px`;
            viewerRef.current.style.height = `${newDims.pageHeight}px`;
            viewerRef.current.style.marginTop = `${newDims.topOffset}px`;
            viewerRef.current.style.marginBottom = `${newDims.bottomOffset}px`;
            setPageDimensions(newDims);

            try {
              const savedCfi = currentCfiRef.current;
              const newSpread = isTwoPageSpread ? "auto" : "none";
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
              console.warn("[ReaderCanvas] Device rotation/resize reflow error:", err);
            }
          }
        }
      }, 120);
    };

    window.addEventListener("resize", handleDeviceChange);
    window.addEventListener("orientationchange", handleDeviceChange);

    return () => {
      clearTimeout(resizeTimer);
      clearTimeout(windowResizeTimer);
      observer.disconnect();
      window.removeEventListener("resize", handleDeviceChange);
      window.removeEventListener("orientationchange", handleDeviceChange);
    };
  }, [isReady, isShortLandscape]);

  // 3. Render Book Highlights on Load and Updates
  useEffect(() => {
    if (!isReady || !renditionRef.current || !Array.isArray(highlights)) return;
    highlights.forEach((h) => {
      if (h.cfiRange) {
        renderHighlight(h.cfiRange, h.color, h.id);
      }
    });
  }, [isReady, highlights, renderHighlight]);

  // Handle tap / click gestures on outer container margins
  const handleContainerClick = (e) => {
    // If clicked inside an interactive button, ignore
    if (e.target && e.target.closest && (e.target.closest("button") || e.target.closest("a"))) {
      return;
    }
    // Prevent synthetic click from firing immediately after touchend
    if (Date.now() - lastTouchTimestampRef.current < 600) return;

    const sel = window.getSelection ? window.getSelection() : null;
    if (sel && sel.toString().trim().length > 0) return;

    // On desktop (>= 1024px), disable full-page click zones: no page turns on click
    if (typeof window !== "undefined" && window.innerWidth >= 1024) {
      cbRef.current.onToggleMenu && cbRef.current.onToggleMenu();
      return;
    }

    const width = window.innerWidth;
    const xRatio = e.clientX / width;

    if (xRatio < 0.30) {
      handlePrev();
    } else if (xRatio > 0.70) {
      handleNext();
    } else {
      cbRef.current.onToggleMenu && cbRef.current.onToggleMenu();
    }
  };

  // Outer container trackpad wheel listener (debounce 350ms, ignore vertical scroll)
  const handleContainerWheel = (e) => {
    if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) return;
    if (Math.abs(e.deltaX) > 20) {
      const now = Date.now();
      if (now - lastWheelTurnTimeRef.current >= 350) {
        lastWheelTurnTimeRef.current = now;
        if (e.deltaX > 0) handleNext();
        else handlePrev();
      }
    }
  };

  const chosenTheme = settings?.palette || settings?.theme || theme;
  const [isSystemDark, setIsSystemDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsSystemDark(mq.matches);
    const handler = (e) => setIsSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const effectiveThemeId =
    chosenTheme === "auto" ? (isSystemDark ? "night" : "paper") : chosenTheme;
  const activePalette = THEME_PALETTES[effectiveThemeId] || THEME_PALETTES.paper;

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      onWheel={handleContainerWheel}
      className={`relative w-full h-full overflow-hidden flex justify-center transition-colors duration-300 select-none ${
        cursorHidden ? "cursor-none" : "cursor-default"
      }`}
      style={{
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "var(--reader-bg, " + (activePalette.outer || activePalette.bg) + ")",
        color: "var(--reader-fg, " + activePalette.text + ")",
      }}
    >
      {/* Loading State: Active only while waiting for initial page render */}
      {!isReady && !loadError && activeBlob && (
        <div
          style={{
            backgroundColor: "var(--reader-bg, " + (activePalette.outer || activePalette.bg) + ")",
            color: "var(--reader-fg, " + activePalette.text + ")",
          }}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-opacity-90 backdrop-blur-md"
        >
          <div
            style={{ borderColor: "var(--reader-accent, #855224)" }}
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mb-3"
          />
          <p
            style={{ color: "var(--reader-muted, " + activePalette.text + ")" }}
            className="font-body-ui text-sm font-medium"
          >
            Opening book pages...
          </p>
        </div>
      )}

      {/* Error State with Real Error Message & Retry Button */}
      {loadError && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-surface/95 backdrop-blur-md text-on-surface">
          <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[26px]">error_outline</span>
          </div>
          <h3 className="font-headline-md text-headline-sm text-primary mb-1">
            Unable to Open Book
          </h3>
          <p className="font-body-ui text-error text-xs max-w-md leading-relaxed mb-4">
            {loadError}
          </p>
          <button
            type="button"
            onClick={() => setRetryCount((c) => c + 1)}
            aria-label="Retry opening book"
            className="px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-on-primary text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-md focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Retry Opening</span>
          </button>
        </div>
      )}

      {/* EPUB Viewport Container */}
      <div
        ref={viewerRef}
        id="reader-viewer"
        data-testid="reader-viewer"
        className={`${activeBlob ? "block" : "hidden"} transition-colors duration-300`}
        style={{
          width: `${pageDimensions.pageWidth}px`,
          height: `${pageDimensions.pageHeight}px`,
          marginTop: `${pageDimensions.topOffset}px`,
          marginBottom: `${pageDimensions.bottomOffset}px`,
          marginLeft: "auto",
          marginRight: "auto",
          backgroundColor: activePalette.bg,
          overflow: "hidden",
          scrollbarWidth: "none",
        }}
      />

      {/* Static Fallback Container matching 03-reader-viewport.html */}
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
          {children || (
            <>
              <header className="text-center my-10 space-y-2">
                {fallbackContent?.volume && (
                  <div className="inline-flex items-center justify-center">
                    <span
                      style={{ color: "var(--reader-muted, " + activePalette.text + ")" }}
                      className="font-label-sm tracking-widest text-caption uppercase opacity-80"
                    >
                      {fallbackContent.volume}
                    </span>
                  </div>
                )}
                <h1
                  style={{ color: "var(--reader-fg, " + activePalette.text + ")" }}
                  className="font-headline-lg text-headline-lg tracking-tight font-normal"
                >
                  {fallbackContent?.chapter || fallbackContent?.title || "CHAPTER I."}
                </h1>
                <div
                  style={{ backgroundColor: "var(--reader-border, rgba(128,128,128,0.2))" }}
                  className="w-12 h-px mx-auto mt-4"
                />
              </header>
              <article
                style={{ color: "var(--reader-fg, " + activePalette.text + ")" }}
                className="font-body-reading text-body-reading text-justify leading-relaxed relative space-y-4"
              >
                {fallbackContent?.paragraphs?.map((p, idx) => (
                  <p
                    key={idx}
                    className={idx === 0 ? "book-paragraph-first" : "book-paragraph"}
                  >
                    {p}
                  </p>
                ))}
              </article>
            </>
          )}
        </main>
      )}
    </div>
  );
});

export default ReaderCanvas;
