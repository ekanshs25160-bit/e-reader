import { clearSelection, getSelectionDetails } from './selection';

export const SWIPE_COMMIT_PX = 45;
export const SWIPE_FLICK_PX = 20;
export const SWIPE_FLICK_MAX_MS = 250;
export const SWIPE_ANIM_DURATION_MS = 220;

export function setupReaderGestures({
  doc,
  win,
  contents,
  viewerRef,
  containerRef,
  cbRef,
  handleNext,
  handlePrev,
  lastWheelTurnTimeRef,
  lastTouchTimestampRef,
  getIsCancelled,
}) {
  const notifyInteraction = () => {
    cbRef.current?.onUserInteraction?.();
  };

  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;
  let touchLastX = 0;
  let isTouchDragging = false;
  let lastTouchEndTimestamp = 0;

  const checkSelection = () => {
    notifyInteraction();
    setTimeout(() => {
      if (getIsCancelled && getIsCancelled()) return;
      const details = getSelectionDetails(win, contents);
      if (details) {
        cbRef.current?.onTextSelect?.(details);
        cbRef.current?.onTextSelected?.(details.text, details.cfiRange, details);
      }
    }, 60);
  };

  const handleTouchStart = (e) => {
    notifyInteraction();
    if (e.touches && e.touches.length === 1) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      touchLastX = touchStartX;
      touchStartTime = Date.now();
      isTouchDragging = false;
    }
  };

  const handleTouchMove = (e) => {
    if (!touchStartX && !touchStartY) return;
    if (e.touches && e.touches.length === 1) {
      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      touchLastX = currentX;
      const dx = currentX - touchStartX;
      const dy = currentY - touchStartY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (!isTouchDragging) {
        if (absDx > 8 && absDx > 1.2 * absDy) {
          isTouchDragging = true;
          clearSelection(win);
        }
      }

      if (isTouchDragging) {
        if (e.cancelable) e.preventDefault();
        clearSelection(win);
        const prefersReducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        if (!prefersReducedMotion && viewerRef.current) {
          viewerRef.current.style.transition = 'none';
          viewerRef.current.style.transform = `translateX(${dx}px)`;
        }
      }
    }
  };

  const handleTouchEnd = (e) => {
    notifyInteraction();
    lastTouchEndTimestamp = Date.now();
    if (lastTouchTimestampRef) lastTouchTimestampRef.current = Date.now();

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

    if (isTouchDragging) {
      isTouchDragging = false;
      const dx = touchLastX - touchStartX;
      const absDx = Math.abs(dx);
      const duration = Date.now() - touchStartTime;

      const shouldTurn = absDx > SWIPE_COMMIT_PX || (absDx > SWIPE_FLICK_PX && duration < SWIPE_FLICK_MAX_MS);
      if (shouldTurn) {
        const isNext = dx < 0;
        if (!prefersReducedMotion && viewerRef.current) {
          const targetX = isNext ? -Math.min(window.innerWidth, 500) : Math.min(window.innerWidth, 500);
          viewerRef.current.style.transition = `transform ${SWIPE_ANIM_DURATION_MS}ms cubic-bezier(0.25, 1, 0.5, 1)`;
          viewerRef.current.style.transform = `translateX(${targetX}px)`;
          setTimeout(() => {
            if (viewerRef.current) {
              viewerRef.current.style.transition = 'none';
              viewerRef.current.style.transform = 'none';
            }
            if (isNext) handleNext();
            else handlePrev();
          }, SWIPE_ANIM_DURATION_MS);
        } else {
          if (viewerRef.current) {
            viewerRef.current.style.transition = 'none';
            viewerRef.current.style.transform = 'none';
          }
          if (isNext) handleNext();
          else handlePrev();
        }
      } else {
        if (!prefersReducedMotion && viewerRef.current) {
          viewerRef.current.style.transition = `transform ${SWIPE_ANIM_DURATION_MS}ms cubic-bezier(0.25, 1, 0.5, 1)`;
          viewerRef.current.style.transform = 'translateX(0px)';
          setTimeout(() => {
            if (viewerRef.current) {
              viewerRef.current.style.transition = 'none';
              viewerRef.current.style.transform = 'none';
            }
          }, SWIPE_ANIM_DURATION_MS);
        } else if (viewerRef.current) {
          viewerRef.current.style.transition = 'none';
          viewerRef.current.style.transform = 'none';
        }
      }
      touchStartX = 0;
      touchStartY = 0;
      return;
    }

    const duration = Date.now() - touchStartTime;
    touchStartX = 0;
    touchStartY = 0;

    if (duration >= 500) {
      checkSelection();
      return;
    }

    if (e.target?.closest?.('a, button')) return;

    const sel = win.getSelection?.();
    if (sel && sel.toString().trim().length > 0) {
      checkSelection();
      return;
    }

    const touch = e.changedTouches ? e.changedTouches[0] : null;
    const clientX = touch ? touch.clientX : touchLastX;
    let frameLeft = 0;
    try {
      const fe = win.frameElement;
      if (fe) frameLeft = fe.getBoundingClientRect().left;
    } catch {
      frameLeft = 0;
    }
    const zoneEl = viewerRef.current || containerRef.current;
    const zoneRect = zoneEl
      ? zoneEl.getBoundingClientRect()
      : { left: 0, width: window.innerWidth };
    const screenX = frameLeft + clientX;
    const xRatio = (screenX - zoneRect.left) / Math.max(1, zoneRect.width);

    if (xRatio < 0.3) {
      handlePrev();
    } else if (xRatio > 0.7) {
      handleNext();
    } else {
      cbRef.current?.onToggleMenu?.();
    }
  };

  const handleClick = (e) => {
    if (Date.now() - lastTouchEndTimestamp < 600) return;
    if (lastTouchTimestampRef && Date.now() - lastTouchTimestampRef.current < 600) return;
    if (e.target?.closest?.('a, button')) return;

    const sel = win.getSelection?.();
    if (sel && sel.toString().trim().length > 0) return;

    let frameLeft = 0;
    try {
      const fe = win.frameElement;
      if (fe) frameLeft = fe.getBoundingClientRect().left;
    } catch {
      frameLeft = 0;
    }
    const zoneEl = viewerRef.current || containerRef.current;
    const zoneRect = zoneEl
      ? zoneEl.getBoundingClientRect()
      : { left: 0, width: window.innerWidth };
    const screenX = frameLeft + e.clientX;
    const xRatio = (screenX - zoneRect.left) / Math.max(1, zoneRect.width);

    if (xRatio < 0.3) {
      handlePrev();
    } else if (xRatio > 0.7) {
      handleNext();
    } else {
      cbRef.current?.onToggleMenu?.();
    }
  };

  const handleIframeWheel = (e) => {
    if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) return;
    if (Math.abs(e.deltaX) > 20) {
      if (e.cancelable) e.preventDefault();
      const now = Date.now();
      if (now - (lastWheelTurnTimeRef?.current || 0) >= 350) {
        if (lastWheelTurnTimeRef) lastWheelTurnTimeRef.current = now;
        if (e.deltaX > 0) handleNext();
        else handlePrev();
      }
    }
  };

  const handleIframePointerMove = (e) => {
    let frameTop = 0;
    let frameLeft = 0;
    try {
      const fe = win.frameElement;
      if (fe) {
        const rect = fe.getBoundingClientRect();
        frameTop = rect.top;
        frameLeft = rect.left;
      }
    } catch {
      frameTop = 0;
      frameLeft = 0;
    }
    cbRef.current?.onIframeMouseMove?.({
      clientX: frameLeft + e.clientX,
      clientY: frameTop + e.clientY,
    });
  };

  doc.addEventListener('pointermove', handleIframePointerMove);
  doc.addEventListener('touchstart', handleTouchStart, { passive: false });
  doc.addEventListener('touchmove', handleTouchMove, { passive: false });
  doc.addEventListener('touchend', handleTouchEnd);
  doc.addEventListener('mouseup', checkSelection);
  doc.addEventListener('click', handleClick);
  doc.addEventListener('wheel', handleIframeWheel, { passive: false });
  doc.addEventListener('keydown', (e) => {
    notifyInteraction();
    cbRef.current?.onKeyDown?.(e);
  });
}
