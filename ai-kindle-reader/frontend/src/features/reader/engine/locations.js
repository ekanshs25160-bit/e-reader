export function getChapterText(rendition, book) {
  try {
    if (rendition) {
      const contents = rendition.getContents?.() || [];
      if (contents.length > 0) {
        let text = '';
        for (const content of contents) {
          const doc = content.document;
          if (doc?.body) {
            text += (doc.body.innerText || doc.body.textContent || '') + '\n';
          }
        }
        if (text.trim()) {
          return text.trim().slice(0, 50000);
        }
      }
    }
    if (book) {
      const location = rendition?.currentLocation?.();
      const href = location?.start?.href;
      if (href) {
        const item = book.spine?.get?.(href);
        if (item?.document?.body) {
          const text = item.document.body.innerText || item.document.body.textContent || '';
          if (text.trim()) return text.trim().slice(0, 50000);
        }
      }
    }
  } catch (err) {
    console.warn('[ReaderLocations] Failed to get chapter text:', err);
  }
  return '';
}

export function computeLocationProgress(location, book) {
  if (!location?.start) return { cfi: null, progress: 0, chapter: '', page: 1, totalPages: 1 };

  const cfi = location.start.cfi;
  const displayedPage = location.start.displayed?.page || 1;
  const displayedTotal = location.start.displayed?.total || 1;

  let progress = 0;
  if (book?.locations && book.locations.length() > 0) {
    progress = book.locations.percentageFromCfi(cfi) || 0;
  } else {
    progress = displayedPage / Math.max(1, displayedTotal);
  }

  let chapterLabel = '';
  if (book?.navigation) {
    const navItem = book.navigation.get(location.start.href);
    if (navItem?.label) chapterLabel = navItem.label.trim();
  }

  return {
    cfi,
    progress,
    chapter: chapterLabel,
    page: displayedPage,
    totalPages: displayedTotal,
  };
}
