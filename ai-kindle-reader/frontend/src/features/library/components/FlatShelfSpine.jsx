'use client';

import { useMemo } from 'react';
import Link from 'next/link';

function getAuthorInitials(author) {
  const parts = String(author || 'Unknown').trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function FlatShelfSpine({ book }) {
  const authorInitials = useMemo(() => getAuthorInitials(book.author), [book.author]);

  const pages = Number(book.totalPages || book.pages) || 0;
  const heightPx =
    pages > 0
      ? Math.min(195, Math.max(145, 145 + Math.round(((pages - 100) / 700) * 50)))
      : 165;

  return (
    <Link
      href={`/reader/${encodeURIComponent(book.id)}`}
      style={{
        height: `${heightPx}px`,
      }}
      className="group relative flex-shrink-0 w-11 rounded-t-[4px] p-2 flex flex-col justify-between bg-surface border-l border-t border-r border-hairline text-ink select-none transition-transform duration-200 hover:-translate-y-2 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      title={`${book.title} by ${book.author}`}
      aria-label={`${book.title} by ${book.author}`}
    >
      <div className="flex justify-between items-center w-full border-b border-hairline pb-1">
        <span className="text-[7.5px] font-sans tracking-widest uppercase truncate max-w-[24px] text-muted">
          {book.year ? String(book.year).slice(-2) : '•'}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden py-1">
        <span className="font-serif text-[11px] tracking-wider uppercase font-normal truncate -rotate-90 whitespace-nowrap block text-ink">
          {book.title}
        </span>
      </div>

      <div className="border-t border-hairline pt-1 text-center">
        <span className="font-sans font-medium text-[8px] tracking-wider text-muted">
          {authorInitials}
        </span>
      </div>
    </Link>
  );
}

export default FlatShelfSpine;
