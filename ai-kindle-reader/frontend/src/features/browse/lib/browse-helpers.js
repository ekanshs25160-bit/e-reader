import { LANGUAGE_NAMES } from '../constants';

export function formatBytes(bytes) {
  const b = Number(bytes);
  if (!b || isNaN(b) || b <= 0) return null;
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  if (b >= 1024) return `${Math.round(b / 1024)} KB`;
  return `${b} B`;
}

export function formatLanguage(code) {
  if (!code) return null;
  const clean = String(code).toLowerCase().trim();
  return LANGUAGE_NAMES[clean] || clean.toUpperCase();
}

export function toAuthors(src) {
  if (Array.isArray(src?.authors) && src.authors.length) return src.authors;
  if (src?.author) return [src.author];
  return [];
}

export function mapGutenbergBook(b, topic = 'Project Gutenberg') {
  return {
    id: `gutenberg_${b.id}`,
    gutenbergId: String(b.id),
    title: b.title,
    author: b.authors?.[0] || 'Classic Author',
    authors: b.authors || [],
    languages: Array.isArray(b.languages) ? b.languages : [],
    subjects: Array.isArray(b.subjects) ? b.subjects : [],
    downloadCount: b.downloadCount ?? null,
    copyright: b.copyright ?? null,
    meta: `Gutenberg #${b.id} · EPUB`,
    topic,
    coverUrl: b.coverUrl || null,
    isStatic: false,
  };
}
