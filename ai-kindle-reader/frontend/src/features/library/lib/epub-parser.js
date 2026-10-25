import ePub from 'epubjs';

export async function blobUrlToBase64(blobUrl) {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function parseEpubPackage(file) {
  const arrayBuffer = await file.arrayBuffer();
  const book = ePub(arrayBuffer);

  const metadata = await book.loaded.metadata;
  const title =
    metadata?.title || file.name.replace(/\.epub$/i, '').replace(/[-_]+/g, ' ').trim();
  const rawAuthor = metadata?.creator;
  const author =
    typeof rawAuthor === 'string'
      ? rawAuthor
      : rawAuthor?.name || 'Unknown Author';

  let coverUrl = null;
  try {
    const rawCoverUrl = await book.coverUrl();
    if (rawCoverUrl) {
      coverUrl = await blobUrlToBase64(rawCoverUrl);
    }
  } catch (coverErr) {
    console.warn('[Uploader] Cover extraction skipped:', coverErr);
  }

  book.destroy();

  return {
    title,
    author,
    coverUrl,
    language: metadata?.language || 'EN',
    synopsis: metadata?.description || `Locally uploaded e-book: ${file.name}`,
  };
}
