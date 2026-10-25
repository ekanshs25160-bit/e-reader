export function getSelectionDetails(win, contents) {
  if (!win) return null;
  const sel = win.getSelection ? win.getSelection() : null;
  const text = sel ? sel.toString().trim() : '';
  if (!text) return null;

  let cfiRange = null;
  if (sel.rangeCount > 0 && typeof contents?.cfiFromRange === 'function') {
    try {
      cfiRange = contents.cfiFromRange(sel.getRangeAt(0));
    } catch (err) {
      console.warn('[ReaderSelection] Failed to derive cfiFromRange:', err);
    }
  }

  let selectionRect = null;
  if (sel.rangeCount > 0) {
    try {
      const range = sel.getRangeAt(0);
      const r = range.getBoundingClientRect();
      let frameTop = 0;
      let frameLeft = 0;
      const fe = win.frameElement;
      if (fe) {
        const fRect = fe.getBoundingClientRect();
        frameTop = fRect.top;
        frameLeft = fRect.left;
      }
      selectionRect = {
        top: frameTop + r.top,
        bottom: frameTop + r.bottom,
        left: frameLeft + r.left,
        right: frameLeft + r.right,
        width: r.width,
        height: r.height,
      };
    } catch (err) {
      console.warn('[ReaderSelection] Failed to calculate selectionRect:', err);
    }
  }

  const anchorText = sel.anchorNode?.textContent || text;
  return {
    text,
    cfiRange,
    contextSentence: anchorText.slice(0, 300),
    selectionRect,
  };
}

export function clearSelection(win) {
  if (win && win.getSelection) {
    try {
      win.getSelection().removeAllRanges();
    } catch {
      // ignore
    }
  }
  if (typeof window !== 'undefined' && window.getSelection) {
    try {
      window.getSelection().removeAllRanges();
    } catch {
      // ignore
    }
  }
}
