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
  day: { bg: "#FDFBF7", text: "#111111" },
  paper: { bg: "#FDFBF7", text: "#111111" },
  sepia: { bg: "#F4ECD8", text: "#2C2214" },
  night: { bg: "#000000", text: "#A0A0A0" },
  oled: { bg: "#000000", text: "#A0A0A0" },
  dark: { bg: "#000000", text: "#A0A0A0" },
};

const ReaderCanvas = forwardRef(function ReaderCanvas(
  {
    bookBlob,
    file, // alias for bookBlob
    fallbackUrl,
    initialCfi,
    theme = "night",
    fontSize = 18,
    fontFamily = "serif",
    settings,
    onLocationChange,
    onTextSelect,
    onTextSelected,
    onToggleMenu,
    onReady,
    fallbackContent = null,
    children,
  },
  ref
) {
  const activeBlob = bookBlob || file;
  const viewerRef = useRef(null);
  const renditionRef = useRef(null);
  const bookRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pageInfo, setPageInfo] = useState({ current: 1, total: 1, chapter: "" });

  const handleNext = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.next();
    }
  }, []);

  const handlePrev = useCallback(() => {
    if (renditionRef.current) {
      renditionRef.current.prev();
    }
  }, []);

  const handleGoToCfi = useCallback((targetCfi) => {
    if (renditionRef.current && targetCfi) {
      renditionRef.current.display(targetCfi);
    }
  }, []);

  const handleGoToPercentage = useCallback((percentage) => {
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
  }, []);

  // Expose imperative API for parent HUD controls (Scrubber, Bottom bar, TOC jump)
  useImperativeHandle(ref, () => ({
    prev: handlePrev,
    next: handleNext,
    goToCfi: handleGoToCfi,
    goToPercentage: handleGoToPercentage,
    getRendition: () => renditionRef.current,
    getBook: () => bookRef.current,
  }));

  // 1. Mount & Load EPUB (Converts Blob -> ArrayBuffer so epub.js never fails)
  useEffect(() => {
    let isMounted = true;

    async function initEpub() {
      if (!viewerRef.current) return;
      if (!activeBlob && !fallbackUrl) return;

      setIsReady(false);
      setLoadError("");
      viewerRef.current.innerHTML = "";

      try {
        let bookInput = fallbackUrl;

        // CRITICAL FIX: epub.js requires an ArrayBuffer when loading from IndexedDB Blob/File
        if (activeBlob) {
          if (activeBlob instanceof ArrayBuffer) {
            bookInput = activeBlob;
          } else if (typeof activeBlob.arrayBuffer === "function") {
            bookInput = await activeBlob.arrayBuffer();
          } else {
            bookInput = activeBlob;
          }
        }

        const book = ePub(bookInput);
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

        // Attach relocated listener IMMEDIATELY (do not wait for locations.generate)
        rendition.on("relocated", (location) => {
          if (!isMounted || !location?.start) return;

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

          onLocationChange &&
            onLocationChange({
              cfi,
              progress,
              percentage: progress,
              chapter: chapterLabel,
              page: displayedPage,
              totalPages: displayedTotal,
            });
        });

        // Hook directly into every rendered chapter iframe for reliable Selection & Taps
        rendition.hooks.content.register((contents) => {
          const doc = contents.document;
          const win = contents.window;

          // Detect word or sentence selection on both desktop (mouseup) & mobile (touchend)
          const checkSelection = () => {
            setTimeout(() => {
              const sel = win.getSelection();
              const text = sel ? sel.toString().trim() : "";
              if (text.length > 0) {
                // Grab surrounding sentence for context
                const anchorText = sel.anchorNode?.textContent || text;
                const payload = {
                  text,
                  contextSentence: anchorText.slice(0, 300),
                };
                if (onTextSelect) onTextSelect(payload);
                if (onTextSelected) onTextSelected(text, null, payload);
              }
            }, 60);
          };

          doc.addEventListener("mouseup", checkSelection);
          doc.addEventListener("touchend", checkSelection);

          // Keyboard support inside iframe
          doc.addEventListener("keyup", (e) => {
            if (e.key === "ArrowRight") rendition.next();
            if (e.key === "ArrowLeft") rendition.prev();
          });
        });

        // Also listen to epub.js native click event for tap-zones inside iframe
        rendition.on("click", (event) => {
          const win = event.view || window;
          const sel = win.getSelection?.();
          if (sel && sel.toString().trim().length > 0) return;

          const width = win.innerWidth || window.innerWidth;
          const xRatio = event.clientX / width;

          if (xRatio > 0.72) {
            rendition.next();
          } else if (xRatio < 0.28) {
            rendition.prev();
          } else {
            onToggleMenu && onToggleMenu();
          }
        });

        await rendition.display(initialCfi || undefined);
        if (isMounted) setIsReady(true);

        // Generate global book locations in background for accurate 0-100% progress
        book.ready
          .then(() => {
            if (onReady) onReady(book);
            return book.locations.generate(1600);
          })
          .catch((readyErr) => {
            console.warn("[ReaderCanvas] Background location notice:", readyErr);
          });
      } catch (err) {
        console.error("EPUB Render Error:", err);
        if (isMounted) {
          setLoadError("Failed to render book file. Please re-import the EPUB.");
        }
      }
    }

    initEpub();

    return () => {
      isMounted = false;
      if (bookRef.current) {
        bookRef.current.destroy();
      }
    };
  }, [activeBlob, fallbackUrl]);

  // 2. Apply Theme, Font Size & Family Dynamically
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    const chosenTheme = settings?.palette || theme;
    const chosenFontSize = settings?.fontSize || fontSize;
    const chosenFontFamily = settings?.typeface || fontFamily;

    const palette = THEME_PALETTES[chosenTheme] || THEME_PALETTES.night;
    const fontStack =
      chosenFontFamily === "sans" || chosenFontFamily === "inter"
        ? "'Inter', -apple-system, sans-serif"
        : chosenFontFamily === "newsreader"
        ? "'NewsreaderVariable', 'Newsreader', Georgia, serif"
        : chosenFontFamily === "literata"
        ? "'LiterataVariable', 'Literata', Georgia, serif"
        : "'Merriweather', 'Georgia', serif";

    rendition.themes.default({
      "html, body": {
        background: `${palette.bg} !important`,
        color: `${palette.text} !important`,
        "font-family": `${fontStack} !important`,
        padding: "0 12px !important",
        "-webkit-user-select": "text !important",
        "user-select": "text !important",
      },
      p: {
        "text-align": "justify !important",
        "line-height": "1.65 !important",
        "font-size": `${chosenFontSize}px !important`,
        "text-indent": "1.25em !important",
        "margin-top": "0 !important",
        "margin-bottom": "0.35em !important",
      },
      "a, h1, h2, h3, h4, span, div": {
        color: `${palette.text} !important`,
      },
    });
    rendition.themes.fontSize(`${chosenFontSize}px`);
  }, [theme, fontSize, fontFamily, settings, isReady]);

  // 3. Window Keyboard Arrow Listener
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext, handlePrev]);

  const activeTheme = settings?.palette || theme;
  const activePalette = THEME_PALETTES[activeTheme] || THEME_PALETTES.night;

  return (
    <div
      className="relative w-full h-dvh overflow-hidden flex flex-col transition-colors duration-300"
      style={{ backgroundColor: activePalette.bg, color: activePalette.text }}
    >
      {/* Loading State */}
      {!isReady && !loadError && (activeBlob || fallbackUrl) && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-zinc-300">Opening book pages...</p>
        </div>
      )}

      {/* Error State */}
      {loadError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-red-400 text-sm mb-3">{loadError}</p>
        </div>
      )}

      {/* EPUB Viewport Container */}
      <div ref={viewerRef} className="w-full flex-1 pt-10 pb-8 px-2" />

      {/* Static Fallback Container when no EPUB binary is loaded yet */}
      {!activeBlob && !fallbackUrl && (fallbackContent || children) && (
        <div className="w-full flex-1 overflow-y-auto pt-10 pb-16 px-4">
          {children || (
            <div className="max-w-prose mx-auto space-y-4">
              <h2 className="text-2xl font-serif text-center mb-2">
                {fallbackContent.title}
              </h2>
              <p className="text-center text-sm opacity-70 mb-6">
                By {fallbackContent.author}
              </p>
              {fallbackContent.paragraphs?.map((p, idx) => (
                <p key={idx} className="leading-relaxed text-justify indent-6">
                  {p}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* GUARANTEED EDGE PAGE-FLIP BUTTONS (Works even if iframe swallows clicks) */}
      <button
        type="button"
        aria-label="Previous Page"
        onClick={handlePrev}
        className="fixed left-0 top-14 bottom-12 w-10 z-10 flex items-center justify-start pl-1 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
      >
        <span className="bg-zinc-900/70 text-white text-xs px-1.5 py-3 rounded-r-md backdrop-blur-sm">
          ‹
        </span>
      </button>

      <button
        type="button"
        aria-label="Next Page"
        onClick={handleNext}
        className="fixed right-0 top-14 bottom-12 w-12 z-10 flex items-center justify-end pr-1 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity"
      >
        <span className="bg-zinc-900/70 text-white text-xs px-1.5 py-3 rounded-l-md backdrop-blur-sm">
          ›
        </span>
      </button>

      {/* Real-Time Kindle Bottom Status Bar */}
      <div className="w-full px-6 py-2 flex items-center justify-between text-[11px] opacity-60 pointer-events-none">
        <span className="truncate max-w-[55%]">
          {pageInfo.chapter || "Reading"}
        </span>
        <span>
          Page {pageInfo.current} of {pageInfo.total}
        </span>
      </div>
    </div>
  );
});

export default ReaderCanvas;
