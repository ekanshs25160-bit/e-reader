import { toAuthors } from './browse-helpers';
import { getBookMeta, getBookBlob } from '@/lib/storage';
import { getCatalogBook } from '@/lib/api';

export async function fetchBookDetail({ rawId, canonicalVaultId, numericGutenbergId }) {
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

    return {
      book: {
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
      },
      hasFile,
    };
  }

  // 2. Catalog lookup for Gutenberg books
  if (numericGutenbergId) {
    const catalogData = await getCatalogBook(numericGutenbergId);
    if (catalogData) {
      const authors = toAuthors(catalogData);
      return {
        book: {
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
        },
        hasFile: false,
      };
    }
  }

  return { book: null, hasFile: false };
}
