'use client';

import React, { useState } from 'react';

/**
 * Cover
 * Editorial book cover component:
 * - If image source is available and valid: renders image with 1px hairline border
 * - Fallback: renders an authentic typographic book jacket in active palette
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
  const [imgError, setImgError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const hasImage = Boolean(src) && !imgError;

  return (
    <div
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
      ) : (
        /* Typographic Book Jacket */
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
