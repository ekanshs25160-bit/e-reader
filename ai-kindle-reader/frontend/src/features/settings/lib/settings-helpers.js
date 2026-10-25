export function resizeAvatarTo256(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;
          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, 256, 256);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function getInitials(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'R';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const THEME_OPTIONS = [
  { id: 'auto', value: 'auto', label: 'Auto' },
  { id: 'paper', value: 'paper', label: 'Paper' },
  { id: 'sepia', value: 'sepia', label: 'Sepia' },
  { id: 'night', value: 'night', label: 'Night' },
  { id: 'oled', value: 'oled', label: 'OLED' },
];

export function downloadArchiveJson(archive) {
  const jsonStr = JSON.stringify(archive, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateTag = new Date().toISOString().split('T')[0];
  a.download = `flyleaf-vault-backup-${dateTag}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseRestorePayload(jsonString, fileName) {
  const parsed = JSON.parse(jsonString);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('File does not contain valid JSON');
  }

  const books = Array.isArray(parsed.books) ? parsed.books : [];
  const words = Array.isArray(parsed.vocabulary)
    ? parsed.vocabulary
    : Array.isArray(parsed.words)
    ? parsed.words
    : [];
  const highlightsCount = Array.isArray(parsed.highlights)
    ? parsed.highlights.reduce((acc, g) => acc + (g.items?.length || 0), 0)
    : 0;
  const bookmarksCount = Array.isArray(parsed.bookmarks)
    ? parsed.bookmarks.reduce((acc, g) => acc + (g.items?.length || 0), 0)
    : 0;
  const sessionsCount = Array.isArray(parsed.sessions) ? parsed.sessions.length : 0;
  const hasBinaries = Boolean(parsed.binaries && Object.keys(parsed.binaries).length > 0);

  return {
    data: parsed,
    fileName,
    booksCount: books.length,
    wordsCount: words.length,
    highlightsCount,
    bookmarksCount,
    sessionsCount,
    hasBinaries,
  };
}
