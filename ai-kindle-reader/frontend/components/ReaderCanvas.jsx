'use client';

import React, {
  useEffect,
  useRef,
  useState,
  useImperativeHandle,
  forwardRef,
  useCallback,
} from 'react';
import { PALETTES, TYPEFACES } from './SettingsMenu';

const PALETTE_THEME_RULES = {
  paper: {
    body: {
      background: '#FAF8F5 !important',
      color: '#1E1C1A !important',
      padding: '0 20px !important',
      margin: '0 auto !important',
    },
    'p, span, div, li': {
      color: '#1E1C1A !important',
    },
    'a, a:link, a:visited': {
      color: '#855224 !important',
      'text-decoration': 'none !important',
    },
    '::selection': {
      background: '#ffbb84 !important',
      color: '#152a41 !important',
    },
  },
  sepia: {
    body: {
      background: '#F4ECD8 !important',
      color: '#2C2214 !important',
      padding: '0 20px !important',
      margin: '0 auto !important',
    },
    'p, span, div, li': {
      color: '#2C2214 !important',
    },
    'a, a:link, a:visited': {
      color: '#7B4D22 !important',
      'text-decoration': 'none !important',
    },
    '::selection': {
      background: '#dfcda6 !important',
      color: '#2C2214 !important',
    },
  },
  night: {
    body: {
      background: '#141824 !important',
      color: '#E6E4DD !important',
      padding: '0 20px !important',
      margin: '0 auto !important',
    },
    'p, span, div, li': {
      color: '#E6E4DD !important',
    },
    'a, a:link, a:visited': {
      color: '#D8A868 !important',
      'text-decoration': 'none !important',
    },
    '::selection': {
      background: '#2B384E !important',
      color: '#F3F1EC !important',
    },
  },
  oled: {
    body: {
      background: '#050505 !important',
      color: '#CFCFCF !important',
      padding: '0 20px !important',
      margin: '0 auto !important',
    },
    'p, span, div, li': {
      color: '#CFCFCF !important',
    },
    'a, a:link, a:visited': {
      color: '#D8A868 !important',
      'text-decoration': 'none !important',
    },
    '::selection': {
      background: '#333333 !important',
      color: '#FFFFFF !important',
    },
  },
};

const ReaderCanvas = forwardRef(function ReaderCanvas(
  {
    file = null, // ArrayBuffer | Blob | string (URL)
    initialCfi = null,
    settings = {
      palette: 'paper',
      fontSize: 18.5,
      typeface: 'literata',
      align: 'justify',
      lineHeight: '1.75',
      margins: 'normal',
    },
    onLocationChange,
    onTextSelected,
    onReady,
    fallbackContent = null,
    className = '',
    children,
  },
  ref
) {
  const containerRef = useRef(null);
  const bookRef = useRef(null);
  const renditionRef = useRef(null);

  const [isLoading, setIsLoading] = useState(Boolean(file));
  const [loadError, setLoadError] = useState(null);
  const [hasBinary, setHasBinary] = useState(Boolean(file));

  // Expose imperative API for parent controllers
  useImperativeHandle(ref, () => ({
    next: () => renditionRef.current?.next(),
    prev: () => renditionRef.current?.prev(),
    goToCfi: (cfi) => renditionRef.current?.display(cfi),
    goToPercentage: (pct) => {
      if (!renditionRef.current || !bookRef.current) return;
      try {
        const locations = bookRef.current.locations;
        if (locations && locations.total) {
          const targetCfi = locations.cfiFromPercentage(pct / 100);
          if (targetCfi) renditionRef.current.display(targetCfi);
        }
      } catch (err) {
        console.warn('[ReaderCanvas] Go to percentage failed:', err);
      }
    },
    getRendition: () => renditionRef.current,
    getBook: () => bookRef.current,
  }));

  const applyStyles = useCallback(
    (rendition, currentSettings) => {
      if (!rendition) return;
      try {
        const pal = currentSettings.palette || 'paper';
        const tf = TYPEFACES.find((t) => t.id === currentSettings.typeface) || TYPEFACES[0];

        // Register themes
        Object.entries(PALETTE_THEME_RULES).forEach(([themeKey, rules]) => {
          rendition.themes.register(themeKey, rules);
        });

        rendition.themes.select(pal);
        rendition.themes.fontSize(`${currentSettings.fontSize || 18.5}px`);
        rendition.themes.font(tf.family);

        // Apply alignment and line-height overrides
        rendition.themes.override('line-height', `${currentSettings.lineHeight || 1.75} !important`);
        rendition.themes.override('text-align', `${currentSettings.align || 'justify'} !important`);
      } catch (err) {
        console.warn('[ReaderCanvas] Failed applying styles to rendition:', err);
      }
    },
    []
  );

  // Initialize and mount epub.js when `file` is provided
  useEffect(() => {
    let isCancelled = false;

    if (!file) {
      setHasBinary(false);
      setIsLoading(false);
      return;
    }

    setHasBinary(true);
    setIsLoading(true);
    setLoadError(null);

    async function initEpub() {
      try {
        const ePubModule = await import('epubjs');
        const ePub = ePubModule.default || ePubModule;

        if (isCancelled || !containerRef.current) return;

        // Clean previous instances if any
        if (renditionRef.current) {
          try {
            renditionRef.current.destroy();
          } catch {}
          renditionRef.current = null;
        }
        if (bookRef.current) {
          try {
            bookRef.current.destroy();
          } catch {}
          bookRef.current = null;
        }

        containerRef.current.innerHTML = '';

        const book = ePub(file);
        bookRef.current = book;

        const rendition = book.renderTo(containerRef.current, {
          width: '100%',
          height: '100%',
          flow: 'paginated',
          spread: 'none',
          manager: 'default',
        });
        renditionRef.current = rendition;

        // Apply visual themes
        applyStyles(rendition, settings);

        // Track text selection for Dictionary & AI Companion
        rendition.on('selected', (cfiRange, contents) => {
          const selection = contents.window.getSelection();
          const selectedText = selection ? selection.toString().trim() : '';
          if (selectedText && onTextSelected) {
            onTextSelected(selectedText, cfiRange);
          }
        });

        // Track page turns and location changes
        rendition.on('relocated', (location) => {
          if (!location) return;
          const percentage = book.locations?.total
            ? Math.round(book.locations.percentageFromCfi(location.start.cfi) * 100)
            : Math.round((location.start.percentage || 0) * 100);

          let chapterTitle = 'Chapter';
          try {
            const currentNav = book.navigation?.get(location.start.href);
            if (currentNav?.label) {
              chapterTitle = currentNav.label.trim();
            }
          } catch {}

          if (onLocationChange) {
            onLocationChange({
              cfi: location.start.cfi,
              percentage,
              chapter: chapterTitle,
              displayed: location.start.displayed,
            });
          }
        });

        // Keyboard arrow navigation
        const handleKeyDown = (e) => {
          if (e.key === 'ArrowRight' || e.key === 'PageDown') {
            rendition.next();
          } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
            rendition.prev();
          }
        };

        rendition.on('keydown', handleKeyDown);
        window.addEventListener('keydown', handleKeyDown);

        // Generate locations for percentage calculation
        book.ready
          .then(async () => {
            if (isCancelled) return;
            try {
              await book.locations.generate(1024);
            } catch (locErr) {
              console.warn('[ReaderCanvas] Location generation warning:', locErr);
            }

            const metadata = await book.loaded.metadata;
            const navigation = await book.loaded.navigation;

            if (onReady) {
              onReady({
                metadata,
                toc: navigation?.toc || [],
                rendition,
                book,
              });
            }

            setIsLoading(false);
          })
          .catch((err) => {
            if (!isCancelled) {
              console.warn('[ReaderCanvas] Book ready warning:', err);
              setIsLoading(false);
            }
          });

        // Display initial CFI or start
        await rendition.display(initialCfi || undefined);
      } catch (err) {
        if (!isCancelled) {
          console.error('[ReaderCanvas] Error loading EPUB binary:', err);
          setLoadError(err.message || 'Failed to render EPUB file');
          setIsLoading(false);
        }
      }
    }

    initEpub();

    return () => {
      isCancelled = true;
      if (renditionRef.current) {
        try {
          renditionRef.current.destroy();
        } catch {}
        renditionRef.current = null;
      }
      if (bookRef.current) {
        try {
          bookRef.current.destroy();
        } catch {}
        bookRef.current = null;
      }
    };
  }, [file]);

  // Update styles whenever settings change
  useEffect(() => {
    if (renditionRef.current) {
      applyStyles(renditionRef.current, settings);
    }
  }, [settings, applyStyles]);

  // If a real .epub file is present, render the epub.js canvas container
  if (hasBinary) {
    const activePalette = PALETTES.find((p) => p.id === settings.palette) || PALETTES[0];
    return (
      <div
        className={`relative w-full h-full flex flex-col items-center justify-center select-text transition-colors duration-200 ${className}`}
        style={{
          backgroundColor: activePalette.readerBg,
          color: activePalette.readerText,
        }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-surface/80 backdrop-blur-xs">
            <div className="w-9 h-9 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="font-caption text-caption text-on-surface-variant animate-pulse">
              Opening in Sanctuary Reader...
            </p>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center gap-2">
            <span className="material-symbols-outlined text-[32px] text-error">error</span>
            <p className="font-body-ui-bold text-on-surface">Unable to load EPUB file</p>
            <p className="font-caption text-caption text-on-surface-variant max-w-sm">{loadError}</p>
          </div>
        )}

        {/* EPUB.js iframe mounts into this container */}
        <div
          ref={containerRef}
          className="w-full h-full flex-1 overflow-hidden"
          style={{
            maxWidth:
              settings.margins === 'compact'
                ? '900px'
                : settings.margins === 'wide'
                ? '640px'
                : '760px',
          }}
        />
      </div>
    );
  }

  // Graceful fallback for built-in sample chapters when no binary .epub is mounted
  const activePalette = PALETTES.find((p) => p.id === settings.palette) || PALETTES[0];
  const activeTypeface = TYPEFACES.find((t) => t.id === settings.typeface) || TYPEFACES[0];

  return (
    <div
      className={`w-full mx-auto select-text transition-colors duration-200 ${className}`}
      style={{
        backgroundColor: activePalette.readerBg,
        color: activePalette.readerText,
      }}
    >
      {children ? (
        children
      ) : fallbackContent ? (
        <article
          className="relative max-w-full"
          style={{
            fontFamily: activeTypeface.family,
            fontSize: `${settings.fontSize || 18.5}px`,
            lineHeight: settings.lineHeight || 1.75,
            textAlign: settings.align || 'justify',
            color: activePalette.readerText,
          }}
        >
          {fallbackContent.chapterHeading && (
            <header className="text-center my-8 space-y-2">
              <span className="text-secondary/70 font-label-sm tracking-widest text-caption uppercase">
                {fallbackContent.chapterLabel || 'Chapter'}
              </span>
              <h2 className="font-headline-lg text-headline-lg tracking-tight font-normal">
                {fallbackContent.chapterHeading}
              </h2>
              <div className="w-12 h-px bg-outline-variant/40 mx-auto mt-4"></div>
            </header>
          )}

          {fallbackContent.paragraphs?.map((para, idx) => (
            <p key={idx} className="book-paragraph mb-4 leading-relaxed">
              {idx === 0 && (
                <span className="float-left text-5xl font-headline-lg leading-none pt-1 pr-3 font-normal text-primary">
                  {para.charAt(0)}
                </span>
              )}
              {idx === 0 ? para.slice(1) : para}
            </p>
          ))}
        </article>
      ) : (
        <div className="py-12 text-center text-on-surface-variant font-caption">
          No content to display
        </div>
      )}
    </div>
  );
});

export default ReaderCanvas;
