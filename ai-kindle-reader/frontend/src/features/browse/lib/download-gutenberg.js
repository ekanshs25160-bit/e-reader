import { saveBook, getBookBlob } from '@/lib/storage';
import { downloadEpub } from '@/lib/api';

export async function downloadGutenbergEpub(book) {
  const gutenbergId =
    book.gutenbergId ||
    (book.id && String(book.id).startsWith('gutenberg_')
      ? String(book.id).replace('gutenberg_', '')
      : null);

  if (!gutenbergId) {
    throw new Error('Download is unavailable for this title');
  }

  const bookKey = `gutenberg_${gutenbergId}`;

  // Check existing blob
  const existingBlob =
    (await getBookBlob(bookKey)) ||
    (book.id ? await getBookBlob(String(book.id)) : null);

  if (existingBlob) {
    return { bookKey, gutenbergId, alreadyDownloaded: true };
  }

  const epubBlob = await downloadEpub(gutenbergId);
  const authorName = Array.isArray(book.authors)
    ? book.authors.join(', ')
    : book.author || 'Classic Author';

  const bookMeta = {
    id: bookKey,
    gutenbergId: String(gutenbergId),
    title: book.title,
    author: authorName,
    authors: Array.isArray(book.authors) ? book.authors : undefined,
    languages: book.languages,
    subjects: book.subjects,
    downloadCount: book.downloadCount,
    copyright: book.copyright,
    coverUrl: book.coverUrl || null,
    fileSize: epubBlob.size,
    progressPercentage: 0,
    progress: 0,
    status: 'to-read',
    category: 'The Commons',
    addedAt: Date.now(),
  };

  await saveBook(bookKey, bookMeta, epubBlob);

  return { bookKey, gutenbergId, alreadyDownloaded: false };
}
