'use client';

import React, { useState } from 'react';

export default function BookCover({
  coverUrl,
  title = 'Untitled Volume',
  author = 'Unknown Author',
  year,
  progress,
  className = '',
  aspect = 'aspect-[2/3]',
  showProgress = false,
  priority = false,
}) {
  const [imageFailed, setImageFailed] = useState(false);

  const hasImage = Boolean(coverUrl) && !imageFailed;

  if (hasImage) {
    return (
      <div
        className={`relative ${aspect} w-full rounded-md shadow-md overflow-hidden bg-surface-container border border-outline-variant/30 ${className}`}
      >
        <img
          src={coverUrl}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={() => setImageFailed(true)}
          loading={priority ? 'eager' : 'lazy'}
        />
        {/* Tactile spine depth shadow */}
        <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/35 via-black/10 to-transparent pointer-events-none"></div>

        {/* Progress badge */}
        {showProgress && progress !== undefined && progress > 0 && (
          <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-body-ui text-white shadow-xs">
            {progress}%
          </div>
        )}
      </div>
    );
  }

  // Minimalist typographic cover fallback for custom uploads or missing covers
  return (
    <div
      className={`relative ${aspect} w-full rounded-md shadow-md overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 border border-white/10 p-3 flex flex-col justify-between text-left select-none transition-transform duration-300 group-hover:scale-105 ${className}`}
    >
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-400">
            {year || 'EPUB'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-500"></span>
        </div>
        <h4 className="font-serif text-white font-medium text-[13px] sm:text-sm leading-snug line-clamp-4">
          {title}
        </h4>
      </div>

      <div>
        <div className="w-6 h-px bg-zinc-600 mb-1.5"></div>
        <p className="text-[11px] font-sans text-zinc-300 truncate">
          {author}
        </p>
      </div>

      {/* Tactile book spine depth shadow */}
      <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-r from-black/50 via-black/20 to-transparent pointer-events-none"></div>

      {/* Progress badge */}
      {showProgress && progress !== undefined && progress > 0 && (
        <div className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-[9px] font-body-ui text-white shadow-xs">
          {progress}%
        </div>
      )}
    </div>
  );
}
