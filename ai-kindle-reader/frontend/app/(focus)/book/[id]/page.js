'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { getBookMeta, getBookBlob, saveBook } from '@/utils/db';
import { downloadEpub, getCatalogBook } from '@/lib/api';

const SPINE_PALETTES = [
  { bg: '#223348', text: '#e3e9f0', accent: '#97acc8' },
  { bg: '#53232b', text: '#f7e6e8', accent: '#e8b4b8' },
  { bg: '#2d4237', text: '#e2ede6', accent: '#a3c2b0' },
  { bg: '#8a4e28', text: '#fdece2', accent: '#f5c6aa' },
  { bg: '#1c232c', text: '#d6dade', accent: '#9da7b3' },
  { bg: '#4a5859', text: '#ecefed', accent: '#b0c2c3' },
  { bg: '#3a2e39', text: '#eddfe7', accent: '#cbb3c2' },
  { bg: '#5c4033', text: '#f5ebe6', accent: '#d2b48c' },
];

function hashString(str) {
  let hash = 0;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getBookPalette(id) {
  return SPINE_PALETTES[hashString(id) % SPINE_PALETTES.length];
}

function getAuthorInitials(author) {
  const parts = String(author || 'Unknown').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatBytes(bytes) {
  const b = Number(bytes);
  if (!b || isNaN(b) || b <= 0) return null;
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
}

const LANGUAGE_NAMES = {
  en: 'English',
  fr: 'French',
  de: 'German',
  es: 'Spanish',
  it: 'Italian',
  la: 'Latin',
  el: 'Greek',
  ru: 'Russian',
  zh: 'Chinese',
  ja: 'Japanese',
  pt: 'Portuguese',
  nl: 'Dutch',
  da: 'Danish',
  sv: 'Swedish',
};

function formatLanguage(code) {
  if (!code) return null;
  const clean = String(code).toLowerCase().trim();
  return LANGUAGE_NAMES[clean] || clean.toUpperCase();
}

const SLUG_TO_GUTENBERG = {
  'crime-and-punishment': '2554',
  'frankenstein': '84',
  'odyssey': '1727',
  'meditations': '2680',
  'moby-dick': '2701',
  'dracula': '345',
  'pride-and-prejudice': '1342',
  'dorian-gray': '174',
  'metamorphosis': '5200',
  'alice-in-wonderland': '11',
};

function toAuthors(src) {
  if (Array.isArray(src?.authors) && src.authors.length) return src.authors;
  if (src?.author) return [src.author];
  return [];
}

export default function BookDetailPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const params = useParams();
  const router = useRouter();
  const { showToast } = useTheme();

  const rawId = params?.id ? decodeURIComponent(String(params.id)) : '';
  const mappedGutenbergId = SLUG_TO_GUTENBERG[rawId] || null;
  const numericGutenbergId = rawId.startsWith('gutenberg_')
    ? rawId.replace('gutenberg_', '')
    : /^\d+$/.test(rawId)
    ? rawId
    : mappedGutenbergId;
  const canonicalVaultId = numericGutenbergId ? `gutenberg_${numericGutenbergId}` : rawId;

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savedToLibrary, setSavedToLibrary] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBookData() {
      setLoading(true);
      setLoadError(null);
      setImgFailed(false);

      try {
        // 1. Local IndexedDB first (downloaded OR metadata-only books)
        const [storedMeta, storedBlob] = await Promise.all([
          getBookMeta(canonicalVaultId).then((m) => m || (rawId !== canonicalVaultId ? getBookMeta(rawId) : null)),
          getBookBlob(canonicalVaultId).then((b) => b || (rawId !== canonicalVaultId ? getBookBlob(rawId) : null)),
        ]);

        if (storedMeta) {
          const hasFile = Boolean(storedBlob || storedMeta.hasBinary);
          const gId = storedMeta.gutenbergId || numericGutenbergId || null;
          const authors = toAuthors(storedMeta);

          let languages = Array.isArray(storedMeta.languages)
            ? storedMeta.languages
            : storedMeta.language
            ? [storedMeta.language]
            : [];
          let subjects = Array.isArray(storedMeta.subjects) ? storedMeta.subjects : [];
          let downloadCount = storedMeta.downloadCount ?? null;
          let copyright = storedMeta.copyright ?? null;
          let description = storedMeta.description || storedMeta.synopsis || null;

          // Enrich missing catalog fields for Gutenberg books (does not overwrite stored values)
          if (gId && (!languages.length || !subjects.length || copyright === null)) {
            try {
              const cat = await getCatalogBook(gId);
              if (cat) {
                if (!languages.length && Array.isArray(cat.languages)) languages = cat.languages;
                if (!subjects.length && Array.isArray(cat.subjects)) subjects = cat.subjects;
                if (downloadCount === null) downloadCount = cat.downloadCount ?? null;
                if (copyright === null) copyright = cat.copyright ?? null;
                if (!description) description = cat.description || null;
              }
            } catch (enrichErr) {
              console.warn('Catalog enrichment failed:', enrichErr);
            }
          }
          if (!active) return;

          setBook({
            id: storedMeta.id || canonicalVaultId,
            title: storedMeta.title || 'Untitled Book',
            authors,
            authorText: authors.join(', ') || 'Unknown Author',
            coverUrl: storedMeta.coverUrl || null,
            gutenbergId: gId ? String(gId) : null,
            languages,
            subjects,
            downloadCount,
            copyright,
            isPublicDomain: copyright === false,
            fileSize: storedBlob?.size || storedMeta.fileSize || null,
            totalPages: Number(storedMeta.totalPages) > 1 ? Number(storedMeta.totalPages) : null,
            progress: Number(storedMeta.progressPercentage ?? storedMeta.progress) || 0,
            description,
            hasBinary: hasFile,
          });
          setSavedToLibrary(hasFile);
          setLoading(false);
          return;
        }

        // 2. Not stored: catalog lookup for Gutenberg books
        if (numericGutenbergId) {
          try {
            const catalogData = await getCatalogBook(numericGutenbergId);
            if (!active) return;
            if (catalogData) {
              const authors = toAuthors(catalogData);
              setBook({
                id: canonicalVaultId,
                title: catalogData.title || `Gutenberg Book #${numericGutenbergId}`,
                authors,
                authorText: authors.join(', ') || 'Unknown Author',
                coverUrl: catalogData.coverUrl || null,
                gutenbergId: String(numericGutenbergId),
                languages: Array.isArray(catalogData.languages) ? catalogData.languages : [],
                subjects: Array.isArray(catalogData.subjects) ? catalogData.subjects : [],
                downloadCount: catalogData.downloadCount ?? null,
                copyright: catalogData.copyright ?? null,
                isPublicDomain: catalogData.copyright === false,
                fileSize: null,
                totalPages: null,
                progress: 0,
                description: catalogData.description || null,
                hasBinary: false,
              });
              setSavedToLibrary(false);
              setLoading(false);
              return;
            }
          } catch (catalogErr) {
            console.warn('Catalog lookup failed:', catalogErr);
          }
        }

        // 3. Not found
        if (!active) return;
        setLoadError('Book details could not be found.');
      } catch (err) {
        if (!active) return;
        setLoadError(err.message || 'Failed to load book');
      } finally {
        if (active) setLoading(false);
      }
    }

    if (rawId) {
      loadBookData();
    } else {
      setLoadError('No book identifier specified');
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [rawId, canonicalVaultId, numericGutenbergId]);

  const palette = useMemo(() => getBookPalette(canonicalVaultId), [canonicalVaultId]);

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/browse');
    }
  };

  const handlePrimaryAction = async () => {
    if (!book) return;

    if (savedToLibrary) {
      router.push(`/reader/${book.id}`);
      return;
    }

    const downloadTargetId = book.gutenbergId || numericGutenbergId;
    if (!downloadTargetId) {
      showToast('This book cannot be downloaded automatically without a Gutenberg ID.');
      return;
    }

    setDownloading(true);
    showToast(`Downloading "${book.title}" EPUB into offline library...`);
    try {
      const epubBlob = await downloadEpub(downloadTargetId);

      await saveBook(
        {
          id: canonicalVaultId,
          title: book.title,
          author: book.authorText,
          authors: book.authors,
          coverUrl: book.coverUrl,
          gutenbergId: String(downloadTargetId),
          languages: book.languages,
          subjects: book.subjects,
          downloadCount: book.downloadCount,
          copyright: book.copyright,
          fileSize: epubBlob.size,
          status: 'to-read',
          progress: 0,
          progressPercentage: 0,
          addedAt: Date.now(),
        },
        epubBlob
      );

      setBook((prev) =>
        prev ? { ...prev, id: canonicalVaultId, hasBinary: true, fileSize: epubBlob.size } : prev
      );
      setSavedToLibrary(true);
      showToast(`Saved "${book.title}" to your offline Library!`);
    } catch (err) {
      console.warn('EPUB download failed:', err);
      showToast(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  /* Responsive shell: bottom sheet on phones, centred modal on tablets/desktops */
  const shell = (children) => (
    <div className="fixed inset-0 overflow-hidden bg-background text-on-surface antialiased font-body-ui selection:bg-secondary-container/40 selection:text-secondary">
      <BackgroundBackdrop />
      {children}
    </div>
  );

  const sheetClass =
    'relative z-30 w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl h-[91%] max-h-[780px] md:max-h-[820px] bg-surface rounded-t-[28px] md:rounded-[28px] border-t md:border border-outline-variant/50 shadow-[0_-8px_32px_rgba(21,42,65,0.18)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300';

  const stage = (inner, onScrimClick) => (
    <div className="absolute inset-0 z-20 flex items-end md:items-center justify-center">
      <div
        onClick={onScrimClick}
        className="absolute inset-0 bg-[#121c26]/40 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
      />
      {inner}
    </div>
  );

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  if (loading) {
    return shell(
      stage(
        <div className={`${sheetClass} animate-pulse`}>
          <div className="pt-2.5 pb-2 px-5 border-b border-outline-variant/20 flex flex-col">
            <div className="w-10 h-1.5 bg-outline-variant/70 rounded-full mx-auto mb-2 md:hidden" />
            <div className="h-5 w-36 bg-surface-container-high rounded" />
          </div>
          <div className="p-5 space-y-5">
            <div className="flex gap-4">
              <div className="w-28 sm:w-32 md:w-40 aspect-[3/4.2] rounded-lg bg-surface-container-high" />
              <div className="flex-1 space-y-2 pt-2">
                <div className="h-4 w-20 bg-surface-container-high rounded-full" />
                <div className="h-6 w-3/4 bg-surface-container-high rounded" />
                <div className="h-4 w-1/2 bg-surface-container-high rounded" />
              </div>
            </div>
            <div className="h-14 bg-surface-container-low rounded-xl" />
            <div className="h-28 bg-surface-container-low rounded-xl" />
          </div>
        </div>,
        handleClose
      )
    );
  }

  if (loadError || !book) {
    return shell(
      stage(
        <div className="relative z-30 w-full max-w-md bg-surface rounded-t-[28px] md:rounded-[28px] border border-outline-variant/50 shadow-[0_-8px_32px_rgba(21,42,65,0.18)] p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-error-container/30 text-error flex items-center justify-center">
            <span className="material-symbols-outlined text-[24px]">error_outline</span>
          </div>
          <h2 className="font-headline-md text-headline-sm font-semibold text-primary">
            {loadError || 'Book Not Found'}
          </h2>
          <p className="text-body-ui text-sm text-on-surface-variant max-w-xs">
            Could not load book information from your offline library or the catalog.
          </p>
          <div className="flex gap-2 w-full pt-2">
            <button
              type="button"
              onClick={() => router.push('/library')}
              className="flex-1 py-2.5 rounded-full border border-outline-variant/50 text-sm font-medium hover:bg-surface-container transition-all"
            >
              My Library
            </button>
            <button
              type="button"
              onClick={() => router.push('/browse')}
              className="flex-1 py-2.5 rounded-full bg-primary text-on-primary text-sm font-medium hover:bg-primary-container transition-all"
            >
              Browse Books
            </button>
          </div>
        </div>,
        handleClose
      )
    );
  }

  const formattedSize = formatBytes(book.fileSize);
  const languageNames = book.languages.map(formatLanguage).filter(Boolean);
  const firstSubject = book.subjects[0] ? book.subjects[0].split('--')[0].trim() : null;
  const provenance = [
    book.downloadCount > 0 ? `${book.downloadCount.toLocaleString()} downloads` : null,
    languageNames[0] || null,
    firstSubject,
  ].filter(Boolean);

  return shell(
    stage(
      <div onClick={(e) => e.stopPropagation()} className={sheetClass}>
        {/* Drag handle & header */}
        <div className="flex-shrink-0 pt-2.5 pb-2 px-5 md:px-8 flex flex-col border-b border-outline-variant/20 bg-surface/90 backdrop-blur-md">
          <div className="w-10 h-1.5 bg-outline-variant/70 rounded-full mx-auto mb-2 md:hidden" />
          <div className="flex items-center justify-between md:py-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="material-symbols-outlined text-[16px] text-secondary">book</span>
              <span className="text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider font-semibold truncate">
                {book.gutenbergId ? `Project Gutenberg #${book.gutenbergId}` : 'Imported EPUB'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close book details"
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-container-highest active:scale-95 transition-all text-on-surface-variant flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-5 md:px-8 pt-4 pb-56 sm:pb-52 md:pb-44 space-y-5">
          {/* Hero */}
          <div className="flex items-start gap-4 md:gap-6 pt-1">
            <div className="relative flex-shrink-0 w-28 sm:w-32 md:w-44 aspect-[3/4.2] rounded-lg overflow-hidden book-spine-effect border border-black/10 bg-primary-container">
              {book.coverUrl && !imgFailed ? (
                <img
                  alt={`${book.title} cover`}
                  className="w-full h-full object-cover select-none"
                  src={book.coverUrl}
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div
                  className="w-full h-full p-2.5 md:p-4 flex flex-col justify-between select-none"
                  style={{ backgroundColor: palette.bg, color: palette.text }}
                >
                  <div className="text-[10px] md:text-xs uppercase font-mono tracking-widest opacity-70">
                    {getAuthorInitials(book.authorText)}
                  </div>
                  <div className="space-y-1">
                    <div className="font-headline-sm text-[11px] md:text-base leading-tight font-bold line-clamp-4">
                      {book.title}
                    </div>
                    <div className="text-[9px] md:text-xs opacity-80 truncate" style={{ color: palette.accent }}>
                      {book.authorText}
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute inset-y-0 left-0 w-3 bg-gradient-to-r from-black/40 via-white/10 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none" />
            </div>

            <div className="flex-1 flex flex-col justify-start min-w-0">
              {book.isPublicDomain && (
                <div className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-secondary-fixed/50 border border-secondary/20 mb-1.5">
                  <span className="material-symbols-outlined text-[12px] text-secondary">public</span>
                  <span className="text-label-sm font-label-sm text-secondary font-semibold tracking-tight">
                    PUBLIC DOMAIN
                  </span>
                </div>
              )}

              <h1 className="font-headline-md md:font-headline-lg text-headline-md md:text-headline-lg text-primary tracking-tight leading-tight mb-1 break-words">
                {book.title}
              </h1>

              <p className="font-label-md text-label-md text-on-surface-variant tracking-wider font-semibold uppercase mb-2 break-words">
                {book.authorText}
              </p>

              {provenance.length > 0 && (
                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-caption font-caption text-on-surface-variant">
                  {provenance.map((item, i) => (
                    <span key={i} className="flex items-center gap-1.5">
                      {i > 0 && <span>·</span>}
                      <span className={i === 0 && book.downloadCount > 0 ? 'font-semibold text-on-surface' : ''}>
                        {item}
                      </span>
                    </span>
                  ))}
                </div>
              )}

              {book.hasBinary === false && (
                <p className="mt-2 text-caption font-caption text-outline italic">Not downloaded yet</p>
              )}
            </div>
          </div>

          {/* Metadata strip (real values only) */}
          <div className="grid grid-cols-3 divide-x divide-outline-variant/30 bg-surface-container-lowest/80 border border-outline-variant/40 rounded-xl py-2.5 px-1 shadow-sm text-center">
            <div className="flex flex-col items-center px-2 min-w-0">
              <span className="font-headline-sm text-headline-sm text-primary font-semibold leading-none mb-1 truncate max-w-full">
                {book.languages[0] ? String(book.languages[0]).toUpperCase() : '—'}
              </span>
              <span className="text-label-sm font-label-sm text-outline tracking-wider uppercase">Language</span>
            </div>
            <div className="flex flex-col items-center px-2 min-w-0">
              <span className="font-headline-sm text-headline-sm text-primary font-semibold leading-none mb-1 truncate max-w-full">
                {formattedSize || '—'}
              </span>
              <span className="text-label-sm font-label-sm text-outline tracking-wider uppercase">File Size</span>
            </div>
            <div className="flex flex-col items-center px-2 min-w-0">
              <span className="font-headline-sm text-headline-sm text-primary font-semibold leading-none mb-1 truncate max-w-full">
                {book.totalPages || '—'}
              </span>
              <span className="text-label-sm font-label-sm text-outline tracking-wider uppercase">Pages</span>
            </div>
          </div>

          {/* Lower content: single column on phones, two columns on desktop */}
          <div className="grid gap-5 lg:grid-cols-2 lg:gap-8">
            <div className="space-y-5 min-w-0">
              {book.subjects.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-label-sm font-label-sm text-outline uppercase tracking-wider block">
                    Themes &amp; Context
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {book.subjects.slice(0, 8).map((subj, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/40 text-on-surface-variant text-label-md font-label-md break-words max-w-full"
                      >
                        {subj}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-1 border-t border-outline-variant/20">
                <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight">
                  About this edition
                </h2>
                <p
                  className={`font-body-reading text-[16px] leading-[26px] text-on-surface/90 ${
                    !showFullSynopsis ? 'line-clamp-4' : ''
                  }`}
                >
                  {book.description || 'No synopsis is available for this edition.'}
                </p>
                {book.description && book.description.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                    className="inline-flex items-center gap-1 text-label-md font-label-md text-primary font-semibold hover:underline"
                  >
                    <span>{showFullSynopsis ? 'Show less' : 'Read full synopsis'}</span>
                    <span
                      className={`material-symbols-outlined text-[16px] transition-transform ${
                        showFullSynopsis ? 'rotate-180' : ''
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-5 min-w-0">
              <div className="bg-secondary-fixed/30 border border-secondary-container rounded-xl p-3.5 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary-container/40 flex items-center justify-center flex-shrink-0 text-secondary">
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <span className="text-label-md font-label-md text-on-secondary-container font-semibold">
                      Local AI Reading Companion
                    </span>
                    <span className="text-[10px] bg-secondary text-on-secondary px-1.5 py-0.2 rounded font-mono font-medium">
                      OFFLINE
                    </span>
                  </div>
                  <p className="text-caption font-caption text-on-secondary-fixed-variant leading-relaxed">
                    Includes spoiler-free AI X-Ray, historical character guide &amp; instant dictionary — entirely offline in your local vault.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-center justify-between gap-2 text-on-surface-variant">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[18px] text-outline">font_download</span>
                  <span className="text-caption font-caption">Pre-formatted in Literata Book</span>
                </div>
                <span className="text-label-sm font-label-sm text-secondary font-medium shrink-0">
                  Optimized Typometry
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky footer */}
        <footer className="absolute bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))] px-5 md:px-8 border-t border-outline-variant/30 flex flex-col gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handlePrimaryAction}
              disabled={downloading}
              className="w-full sm:flex-[2] py-3.5 px-5 rounded-full bg-primary hover:bg-primary-container text-on-primary font-body-ui-bold text-body-ui-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-150 disabled:opacity-75"
            >
              {downloading ? (
                <>
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>Downloading EPUB...</span>
                </>
              ) : savedToLibrary ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">auto_stories</span>
                  <span>Continue Reading</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>Save to Library (Offline EPUB)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push(`/reader/${book.id}`)}
              className="w-full sm:flex-1 py-2.5 sm:py-3.5 px-4 rounded-full border border-outline-variant/60 bg-surface-container-lowest/70 hover:bg-surface-container text-on-surface font-body-ui text-body-ui text-center active:scale-[0.98] transition-all duration-150"
            >
              Read Preview
            </button>
          </div>

          <div className="flex items-center justify-center gap-1.5 pt-0.5 text-caption font-caption text-outline text-center">
            <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
            <span>Saved locally on device · No tracking or cloud required</span>
          </div>
        </footer>
      </div>,
      handleClose
    )
  );
}

/**
 * Dimmed/blurred "The Commons" header and skeleton backdrop (decorative, no data)
 */
function BackgroundBackdrop() {
  return (
    <div className="absolute inset-0 flex flex-col pointer-events-none select-none filter blur-[2px] opacity-75">
      <header className="bg-surface/80 backdrop-blur-md shadow-sm border-b border-outline-variant/30 sticky top-0 z-10 flex justify-between items-center w-full px-margin md:px-margin-desktop h-14">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[22px]">local_library</span>
          <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
            The Commons
          </span>
        </div>
        <span className="text-label-md font-label-md text-primary bg-surface-container-high px-3 py-1 rounded-full border border-outline-variant/40">
          Import
        </span>
      </header>

      <div className="p-4 md:px-margin-desktop space-y-4 overflow-hidden max-w-5xl w-full mx-auto">
        <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl px-3 py-2.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-outline text-[20px]">search</span>
          <span className="text-on-surface-variant font-body-ui text-body-ui">
            Search title, author, or subject...
          </span>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-headline-sm text-headline-sm text-primary">Curated Classics</span>
            <span className="text-caption font-caption text-secondary">See all</span>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`bg-surface-container rounded-lg h-36 border border-outline-variant/30 p-2 flex flex-col justify-end gap-1 ${
                  i > 2 ? 'hidden md:flex' : ''
                }`}
              >
                <div className="w-3/4 h-3 bg-surface-variant rounded" />
                <div className="w-1/2 h-2.5 bg-surface-variant rounded" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <span className="font-headline-sm text-headline-sm text-primary block mb-2">Philosophy &amp; Thought</span>
          <div className="h-28 bg-surface-container-low rounded-xl border border-outline-variant/30 p-3">
            <div className="w-2/3 h-4 bg-surface-variant rounded mb-2"></div>
            <div className="w-1/2 h-3 bg-surface-variant rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
