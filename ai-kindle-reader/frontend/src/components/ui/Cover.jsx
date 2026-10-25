'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * Cover
 * Editorial book cover component:
 * - If image source is available and valid: renders image with 1px hairline border
 * - Fallback: renders an authentic typographic book jacket in active palette
 * - When rendered at <= 72px wide: renders a centered serif monogram of the title's first letter
 * - Aspect ratio 2:3, flat surface, no drop shadows or fake gradients
 */
export function Cover({
  src,
  title = 'Untitled Book',
  author = 'Unknown Author',
  aspect = 'aspect-[2/3]',
  size = 'md', // 'sm' | 'md' | 'lg'
  className = '',
}) {
  const containerRef = useRef(null);
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [isCompact, setIsCompact] = useState(size === 'sm');

  const hasImage = Boolean(src) && !imgError;

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

  const monogram = (title || 'U').trim().charAt(0).toUpperCase();

  return (
    <div
      ref={containerRef}
      data-cover=""
      className={`relative w-full ${aspect} bg-surface border border-hairline rounded-[10px] overflow-hidden select-none transition-colors ${className}`}
    >
      {hasImage ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-hairline/25 animate-pulse rounded-[9px]" />
          )}
          <img
            src={src}
            alt={`Cover of ${title}`}
            onLoad={() => setLoaded(true)}
            onError={() => setImgError(true)}
            className={`w-full h-full object-cover rounded-[9px] transition-opacity duration-200 ease-out ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading="lazy"
          />
        </>
      ) : isCompact ? (
        /* Compact Monogram (<= 72px) */
        <div className="w-full h-full flex items-center justify-center bg-surface text-ink border-l-2 border-l-hairline p-1">
          <span className="font-serif text-[22px] sm:text-[26px] font-normal text-ink select-none leading-none">
            {monogram}
          </span>
        </div>
      ) : (
        /* Typographic Book Jacket (> 72px) */
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
            <span className="material-symbols-outlined text-[13px] text-muted" aria-hidden="true">
              auto_stories
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cover;
