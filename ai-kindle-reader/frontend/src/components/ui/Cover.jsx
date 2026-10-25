'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

let hasWarnedCoverUrl = false;

/**
 * Cover
 * Editorial book cover component:
 * - Accepts "src" (preferred) or "coverUrl" (deprecated fallback)
 * - Status states: 'loading' | 'loaded' | 'error'
 * - If image source is available and valid: renders image with 1px hairline border & fade-in
 * - Fallback: renders an authentic typographic book jacket in active palette
 * - When size="sm" (or rendered <= 72px wide): renders only a centered serif monogram of the title's first letter
 * - Aspect ratio 2:3, flat surface, no drop shadows or fake gradients
 */
export function Cover({
  src,
  coverUrl,
  title = 'Untitled Book',
  author = 'Unknown Author',
  aspect = 'aspect-[2/3]',
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  const source = src || coverUrl || null;

  if (process.env.NODE_ENV !== 'production' && coverUrl && !hasWarnedCoverUrl) {
    hasWarnedCoverUrl = true;
    console.warn(
      '[Cover] "coverUrl" prop is deprecated. Please use "src" instead.'
    );
  }

  // One status state: 'loading' | 'loaded' | 'error'
  const [status, setStatus] = useState(() => (source ? 'loading' : 'error'));
  const [isCompact, setIsCompact] = useState(size === 'sm');

  // Reset status to loading whenever source changes, and check cached/completed image
  useEffect(() => {
    if (!source) {
      setStatus('error');
      return;
    }

    setStatus('loading');

    if (imgRef.current && imgRef.current.complete) {
      if (imgRef.current.naturalWidth > 0) {
        setStatus('loaded');
      } else {
        setStatus('error');
      }
    }
  }, [source]);

  useIsomorphicLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setIsCompact(w > 0 ? w <= 72 : size === 'sm');
    };

    measure();

    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }
  }, [size]);

  const hasImage = Boolean(source) && status !== 'error';
  const showMonogram = size === 'sm' || isCompact;
  const monogram = (title || 'U').trim().charAt(0).toUpperCase();

  return (
    <div
      ref={containerRef}
      data-cover=""
      className={`relative w-full ${aspect} bg-surface border border-hairline rounded-[10px] overflow-hidden select-none transition-colors ${className}`}
    >
      {hasImage ? (
        <>
          {status === 'loading' && (
            <div className="absolute inset-0 bg-hairline/25 animate-pulse rounded-[9px]" />
          )}
          <img
            ref={imgRef}
            src={source}
            alt={`Cover of ${title}`}
            onLoad={() => setStatus('loaded')}
            onError={() => setStatus('error')}
            className={`w-full h-full object-cover rounded-[9px] transition-opacity duration-300 ease-out ${
              status === 'loaded' ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        </>
      ) : showMonogram ? (
        /* Compact Monogram (size="sm" or <= 72px) */
        <div className="w-full h-full flex items-center justify-center bg-surface text-ink border-l-2 border-l-hairline p-1">
          <span className="font-serif text-[22px] sm:text-[26px] font-normal text-ink select-none leading-none">
            {monogram}
          </span>
        </div>
      ) : (
        /* Typographic Book Jacket (> 72px, size != 'sm') */
        <div className="w-full h-full p-3.5 sm:p-4 flex flex-col justify-between bg-surface text-ink text-left border-l-2 border-l-hairline">
          {/* Top: Author */}
          <div className="min-w-0">
            <span className="block text-[9.5px] sm:text-[10px] uppercase tracking-[0.12em] text-muted font-medium font-sans truncate">
              {author}
            </span>
          </div>

          {/* Center: Title in Serif */}
          <div className="my-auto py-2">
            <p className="font-serif text-[15px] sm:text-[17px] font-normal text-ink leading-snug line-clamp-3 tracking-tight">
              {title}
            </p>
          </div>

          {/* Bottom: Quiet Colophon / Format */}
          <div className="pt-2 border-t border-hairline/60 flex items-center justify-between text-[9px] uppercase tracking-[0.12em] text-muted/70 font-sans">
            <span>FLYLEAF</span>
            <span
              className="material-symbols-outlined text-[13px] text-muted"
              aria-hidden="true"
            >
              auto_stories
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cover;
