'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { getBookMeta, getBookBlob, saveBook } from '@/utils/db';
import { downloadEpub, getCatalogBook } from '@/lib/api';
import Cover from '@/components/ui/Cover';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { pluralize } from '@/lib/format';

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
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadBookData() {
      setLoading(true);
      setLoadError(null);

      try {
        // 1. Local IndexedDB first (downloaded OR metadata-only books)
        const [storedMeta, storedBlob] = await Promise.all([
          getBookMeta(canonicalVaultId).then(
            (m) => m || (rawId !== canonicalVaultId ? getBookMeta(rawId) : null)
          ),
          getBookBlob(canonicalVaultId).then(
            (b) => b || (rawId !== canonicalVaultId ? getBookBlob(rawId) : null)
          ),
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
    showToast(`Downloading "${book.title}" EPUB into offline library…`);
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
      showToast(`Saved "${book.title}" to offline library`);
    } catch (err) {
      console.warn('EPUB download failed:', err);
      showToast(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  const sheetClass =
    'relative z-30 w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-4xl max-h-[92vh] bg-surface/95 backdrop-blur-md rounded-t-[24px] md:rounded-[24px] border border-hairline flex flex-col overflow-hidden';

  const stage = (inner) => (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 overflow-hidden">
      <div
        onClick={handleClose}
        className="absolute inset-0 bg-ink/30 backdrop-blur-sm transition-opacity"
      />
      {inner}
    </div>
  );

  if (loading) {
    return stage(
      <div
        data-overlay="sheet"
        role="dialog"
        aria-modal="true"
        className={`${sheetClass} p-6 sm:p-8 space-y-6`}
      >
        <div className="flex items-center justify-between border-b border-hairline pb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <Skeleton className="w-36 md:w-52 aspect-[2/3] rounded-[12px] shrink-0 mx-auto md:mx-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
            <div className="space-y-2 pt-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadError || !book) {
    return stage(
      <div
        data-overlay="sheet"
        role="dialog"
        aria-modal="true"
        className="relative z-30 w-full max-w-md bg-surface rounded-[24px] border border-hairline p-6 text-center space-y-4"
      >
        <span
          className="material-symbols-outlined text-muted text-[36px]"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
        >
          error_outline
        </span>
        <h2 className="font-serif text-[22px] text-ink font-normal">
          {loadError || 'Volume not found'}
        </h2>
        <p className="text-[14px] text-muted font-sans">
          Could not locate volume information in your offline library or the catalog.
        </p>
        <div className="flex gap-2 w-full pt-2">
          <Button variant="secondary" className="flex-1" onClick={() => router.push('/library')}>
            Library
          </Button>
          <Button variant="primary" className="flex-1" onClick={() => router.push('/browse')}>
            The Commons
          </Button>
        </div>
      </div>
    );
  }

  const formattedSize = formatBytes(book.fileSize);
  const languageNames = book.languages.map(formatLanguage).filter(Boolean);

  return stage(
    <div
      data-overlay="sheet"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
      className={sheetClass}
    >
      {/* Top Bar */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-hairline flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
          {book.gutenbergId ? `Project Gutenberg #${book.gutenbergId}` : 'Offline Library'}
        </span>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/30 transition-colors"
        >
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            close
          </span>
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-6 sm:px-8 py-6 space-y-6">
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Large cover: Left on desktop, Top on phone */}
          <div className="w-36 sm:w-44 md:w-56 aspect-[2/3] shrink-0 mx-auto md:mx-0">
            <Cover
              coverUrl={book.coverUrl}
              title={book.title}
              author={book.authorText}
              size="lg"
              className="w-full h-full"
            />
          </div>

          {/* Details Column */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            <div>
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
                {book.isPublicDomain ? 'Public Domain' : 'Volume'}
              </span>
              <h1 className="font-serif text-[26px] sm:text-[32px] md:text-[36px] text-ink font-normal leading-tight break-words">
                {book.title}
              </h1>
              <p className="text-[15px] sm:text-[16px] text-muted font-sans font-medium mt-1">
                {book.authorText}
              </p>
            </div>

            {/* Primary Action Button */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <Button
                variant="primary"
                size="md"
                onClick={handlePrimaryAction}
                disabled={downloading}
                icon={downloading ? null : savedToLibrary ? 'auto_stories' : 'download'}
                className="w-full sm:w-auto"
              >
                {downloading
                  ? 'Downloading EPUB…'
                  : savedToLibrary
                  ? 'Continue Reading'
                  : 'Save to Library'}
              </Button>
              <Button
                variant="secondary"
                size="md"
                onClick={() => router.push(`/reader/${book.id}`)}
                className="w-full sm:w-auto"
              >
                Open Reader
              </Button>
            </div>

            {/* Metadata as Definition List with Hairlines */}
            <dl className="divide-y divide-hairline border-y border-hairline my-6 text-[14px] font-sans">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
                  Format
                </dt>
                <dd className="text-ink">EPUB</dd>
              </div>

              {book.languages.length > 0 && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
                    Language
                  </dt>
                  <dd className="text-ink">
                    {languageNames.join(', ') || book.languages.join(', ').toUpperCase()}
                  </dd>
                </div>
              )}

              {formattedSize && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
                    File Size
                  </dt>
                  <dd className="text-ink tabular-nums">{formattedSize}</dd>
                </div>
              )}

              {book.totalPages && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
                    Length
                  </dt>
                  <dd className="text-ink tabular-nums">
                    {pluralize(book.totalPages, 'page')}
                  </dd>
                </div>
              )}

              {book.downloadCount > 0 && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
                    Downloads
                  </dt>
                  <dd className="text-ink tabular-nums">
                    {book.downloadCount.toLocaleString()}
                  </dd>
                </div>
              )}

              {book.subjects.length > 0 && (
                <div className="py-2.5">
                  <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium mb-1">
                    Themes &amp; Context
                  </dt>
                  <dd className="text-muted text-[13px] leading-relaxed">
                    {book.subjects
                      .slice(0, 6)
                      .map((s) => s.split('--')[0].trim())
                      .join(' · ')}
                  </dd>
                </div>
              )}
            </dl>

            {/* About This Edition */}
            {book.description && (
              <div className="space-y-2 pt-2">
                <h2 className="font-serif text-[18px] text-ink font-normal">
                  About this edition
                </h2>
                <p
                  className={`text-[14px] leading-relaxed text-muted font-sans ${
                    !showFullSynopsis ? 'line-clamp-4' : ''
                  }`}
                >
                  {book.description}
                </p>
                {book.description.length > 180 && (
                  <button
                    type="button"
                    onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                    className="text-[13px] text-ink font-sans underline decoration-hairline hover:decoration-ink transition-colors"
                  >
                    {showFullSynopsis ? 'Show less' : 'Read full synopsis'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
