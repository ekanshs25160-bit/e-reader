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
  day: { bg: "#faf9f6", text: "#1a1c1a" },
  paper: { bg: "#faf9f6", text: "#1a1c1a" },
  sepia: { bg: "#f4ecd8", text: "#2c2214" },
  night: { bg: "#141824", text: "#e6e4dd" },
  oled: { bg: "#000000", text: "#cfcfcf" },
  dark: { bg: "#121c26", text: "#e3e2df" },
};

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

  // Keep latest callbacks in a ref so listeners registered once at mount never go stale
  const cbRef = useRef({});
  cbRef.current = {
    onToggleMenu,
    onUserInteraction,
    onLocationChange,
    onTextSelect,
    onTextSelected,
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

  // 1. Mount & Load EPUB with 20s timeout, cancel safety, and blob identity dependency
  useEffect(() => {
    let isCancelled = false;

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

        const rendition = book.renderTo(viewerRef.current, {
          width: "100%",
          height: "100%",
          flow: "paginated",
          manager: "default",
          spread: "none",
          allowScriptedContent: true,
        });
        renditionRef.current = rendition;

        // Attach relocated listener immediately
        rendition.on("relocated", (location) => {
          if (isCancelled || !location?.start) return;

          const cfi = location.start.cfi;
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

          cbRef.current.onLocationChange &&
            cbRef.current.onLocationChange({
              cfi,
              progress,
              percentage: progress,
              chapter: chapterLabel,
              page: displayedPage,
              totalPages: displayedTotal,
            });
        });

        // Hook directly into rendered chapter iframes for Selection, Taps, and Swipes
        rendition.hooks.content.register((contents) => {
          if (isCancelled) return;
          const doc = contents.document;
          const win = contents.window;

          const notifyInteraction = () => {
            cbRef.current.onUserInteraction && cbRef.current.onUserInteraction();
          };

          let startX = 0;
          let startY = 0;
          let startTime = 0;
          let isDragOrSwipe = false;
          let lastTouchTimestamp = 0;

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

                const anchorText = sel.anchorNode?.textContent || text;
                const payload = {
                  text,
                  cfiRange,
                  contextSentence: anchorText.slice(0, 300),
                };
                if (cbRef.current.onTextSelect) cbRef.current.onTextSelect(payload);
                if (cbRef.current.onTextSelected) cbRef.current.onTextSelected(text, cfiRange, payload);
              }
            }, 60);
          };

          const handlePointerDown = (e) => {
            notifyInteraction();
            startX = e.clientX;
            startY = e.clientY;
            startTime = Date.now();
            isDragOrSwipe = false;
          };

          const handlePointerMove = (e) => {
            if (!startX && !startY) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.hypot(dx, dy) > 12) {
              isDragOrSwipe = true;
            }
          };

          const handleGestureEnd = (clientX, clientY, target) => {
            notifyInteraction();

            // Ignore clicks on links or buttons inside the book
            if (target && target.closest && (target.closest("a") || target.closest("button"))) {
              return;
            }

            // If text was selected, do not turn page or toggle menu
            const sel = win.getSelection ? win.getSelection() : null;
            if (sel && sel.toString().trim().length > 0) {
              return;
            }

            const duration = Date.now() - startTime;
            const deltaX = clientX - startX;
            const deltaY = clientY - startY;
            const absDeltaX = Math.abs(deltaX);
            const absDeltaY = Math.abs(deltaY);

            // 1. Swipe detection (horizontal swipe >= 40px)
            if (absDeltaX > 40 && absDeltaX > absDeltaY * 1.5 && duration < 600) {
              if (deltaX < 0) {
                handleNext();
              } else {
                handlePrev();
              }
              return;
            }

            // 2. Ignore long-presses or drag gestures
            if (isDragOrSwipe || duration > 500) {
              return;
            }

            // 3. Tap zones measured in real screen coordinates.
            // The epub iframe is wider than the screen in paginated mode, so convert the
            // iframe-relative clientX into viewport space before comparing to the viewer.
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

          const handleTouchStart = (e) => {
            notifyInteraction();
            if (e.touches && e.touches.length === 1) {
              startX = e.touches[0].clientX;
              startY = e.touches[0].clientY;
              startTime = Date.now();
              isDragOrSwipe = false;
            }
          };

          const handleTouchMove = (e) => {
            if (e.touches && e.touches.length === 1) {
              const dx = e.touches[0].clientX - startX;
              const dy = e.touches[0].clientY - startY;
              if (Math.hypot(dx, dy) > 12) {
                isDragOrSwipe = true;
              }
            }
          };

          const handleTouchEnd = (e) => {
            checkSelection();
            lastTouchTimestamp = Date.now();
            const touch = e.changedTouches ? e.changedTouches[0] : null;
            if (!touch) return;
            // Delay slightly so win.getSelection() is populated if text was selected
            setTimeout(() => {
              if (isCancelled) return;
              handleGestureEnd(touch.clientX, touch.clientY, e.target);
            }, 20);
          };

          const handleClick = (e) => {
            // Prevent synthetic click from firing right after touchend
            if (Date.now() - lastTouchTimestamp < 600) return;
            handleGestureEnd(e.clientX, e.clientY, e.target);
          };

          doc.addEventListener("pointerdown", handlePointerDown);
          doc.addEventListener("pointermove", handlePointerMove);
          doc.addEventListener("touchstart", handleTouchStart, { passive: true });
          doc.addEventListener("touchmove", handleTouchMove, { passive: true });
          doc.addEventListener("mouseup", checkSelection);
          doc.addEventListener("touchend", handleTouchEnd);
          doc.addEventListener("click", handleClick);

          // Keyboard support inside iframe
          doc.addEventListener("keyup", (e) => {
            notifyInteraction();
            if (e.key === "ArrowRight") handleNext();
            if (e.key === "ArrowLeft") handlePrev();
          });
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

        if (isCancelled) return;
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

    const chosenTheme = settings?.palette || theme;
    const chosenFontSize = settings?.fontSize || fontSize;
    const chosenFontFamily = settings?.typeface || fontFamily;
    const chosenAlign = settings?.align || "justify";
    const chosenLineHeight = settings?.lineHeight || "1.75";
    const chosenMargins = settings?.margins || "normal";

    const paddingX =
      chosenMargins === "compact"
        ? "8px"
        : chosenMargins === "wide"
        ? "28px"
        : "16px";

    const palette = THEME_PALETTES[chosenTheme] || THEME_PALETTES.paper;
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
        : "'Literata', Georgia, serif";

    rendition.themes.default({
      "html, body": {
        background: `${palette.bg} !important`,
        color: `${palette.text} !important`,
        "font-family": `${fontStack} !important`,
        padding: `0 ${paddingX} !important`,
        "-webkit-user-select": "text !important",
        "user-select": "text !important",
        cursor: "default !important",
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
      },
      "p:first-of-type": {
        "text-indent": "0 !important",
      },
      "a, h1, h2, h3, h4, span, div": {
        color: `${palette.text} !important`,
      },
    });
    rendition.themes.fontSize(`${chosenFontSize}px`);
  }, [theme, fontSize, fontFamily, settings, isReady]);

  // 3. Render Book Highlights on Load and Updates
  useEffect(() => {
    if (!isReady || !renditionRef.current || !Array.isArray(highlights)) return;
    highlights.forEach((h) => {
      if (h.cfiRange) {
        renderHighlight(h.cfiRange, h.color, h.id);
      }
    });
  }, [isReady, highlights, renderHighlight]);

  // 4. Window Keyboard Arrow Listener
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev]);

  // Handle tap / click gestures on outer container margins
  const handleContainerClick = (e) => {
    // If clicked inside an interactive button, ignore
    if (e.target && e.target.closest && (e.target.closest("button") || e.target.closest("a"))) {
      return;
    }
    const sel = window.getSelection ? window.getSelection() : null;
    if (sel && sel.toString().trim().length > 0) return;

    const width = window.innerWidth;
    const xRatio = e.clientX / width;

    if (xRatio < 0.30) {
      handlePrev();
    } else if (xRatio > 0.70) {
      handleNext();
    } else {
      onToggleMenu && onToggleMenu();
    }
  };

  const activeTheme = settings?.palette || theme;
  const activePalette = THEME_PALETTES[activeTheme] || THEME_PALETTES.paper;

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="relative w-full h-dvh overflow-hidden flex flex-col transition-colors duration-300 select-none cursor-default"
      style={{ backgroundColor: activePalette.bg, color: activePalette.text }}
    >
      {/* Loading State: Active only while waiting for initial page render */}
      {!isReady && !loadError && activeBlob && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface/85 backdrop-blur-md text-on-surface">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="font-body-ui text-sm text-on-surface-variant font-medium">Opening book pages...</p>
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
            className="px-4 py-2 rounded-xl bg-primary hover:opacity-90 text-on-primary text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-md"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            <span>Retry Opening</span>
          </button>
        </div>
      )}

      {/* EPUB Viewport Container */}
      <div ref={viewerRef} className="w-full flex-1 pt-14 pb-16 px-2 sm:px-4" />

      {/* Static Fallback Container matching 03-reader-viewport.html */}
      {!activeBlob && (fallbackContent || children) && (
        <main className="w-full max-w-[68ch] mx-auto pt-20 pb-28 px-6 sm:px-8 select-text overflow-y-auto flex-1">
          {children || (
            <>
              <header className="text-center my-10 space-y-2">
                {fallbackContent?.volume && (
                  <div className="inline-flex items-center justify-center">
                    <span className="text-secondary/70 font-label-sm tracking-widest text-caption uppercase">
                      {fallbackContent.volume}
                    </span>
                  </div>
                )}
                <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-normal">
                  {fallbackContent?.chapter || fallbackContent?.title || "CHAPTER I."}
                </h1>
                <div className="w-12 h-px bg-outline-variant/40 mx-auto mt-4"></div>
              </header>
              <article className="font-body-reading text-body-reading text-on-surface text-justify leading-relaxed relative space-y-4">
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

      {/* EDGE PAGE-FLIP BUTTONS */}
      <button
        type="button"
        aria-label="Previous Page"
        onClick={(e) => {
          e.stopPropagation();
          handlePrev();
        }}
        className="fixed left-0 top-14 bottom-16 w-12 z-20 flex items-center justify-start pl-1 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity focus:outline-none pointer-events-auto"
      >
        <span className="w-8 h-12 rounded-r-xl bg-surface-container-high/80 text-primary dark:text-inverse-primary flex items-center justify-center backdrop-blur-md shadow-md border border-outline-variant/20 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </span>
      </button>

      <button
        type="button"
        aria-label="Next Page"
        onClick={(e) => {
          e.stopPropagation();
          handleNext();
        }}
        className="fixed right-0 top-14 bottom-16 w-12 z-20 flex items-center justify-end pr-1 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity focus:outline-none pointer-events-auto"
      >
        <span className="w-8 h-12 rounded-l-xl bg-surface-container-high/80 text-primary dark:text-inverse-primary flex items-center justify-center backdrop-blur-md shadow-md border border-outline-variant/20 active:scale-95 transition-transform">
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </span>
      </button>
    </div>
  );
});

export default ReaderCanvas;
