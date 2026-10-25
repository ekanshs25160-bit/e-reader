'use client';

import { useCallback, useEffect } from 'react';

export function useReaderHighlights({ renditionRef, isReady, highlights }) {
  const renderHighlight = useCallback(
    (cfiRange, color = 'var(--theme-accent, var(--reader-accent))', id = null) => {
      if (renditionRef.current && cfiRange) {
        try {
          renditionRef.current.annotations.highlight(
            cfiRange,
            { id: id || `hl-${Date.now()}` },
            () => {},
            'flyleaf-highlight',
            {
              fill: color || 'var(--theme-accent, var(--reader-accent))',
              'fill-opacity': '0.42',
              'mix-blend-mode': 'multiply',
            }
          );
        } catch {}
      }
    },
    [renditionRef]
  );

  useEffect(() => {
    if (!isReady || !renditionRef.current || !Array.isArray(highlights)) return;
    highlights.forEach((h) => {
      if (h.cfiRange) renderHighlight(h.cfiRange, h.color, h.id);
    });
  }, [isReady, highlights, renderHighlight, renditionRef]);

  return { renderHighlight };
}
