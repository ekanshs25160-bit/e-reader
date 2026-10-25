'use client';

import Link from 'next/link';
import { FlatShelfSpine } from './FlatShelfSpine';
import { Cover, ProgressLine } from '@/components/ui';

export function LibraryViews({ filteredBooks, viewMode }) {
  if (viewMode === 'shelf') {
    return (
      <div className="space-y-4">
        <div className="flex items-end gap-1.5 overflow-x-auto pb-1 pt-6 px-2 scrollbar-none">
          {filteredBooks.map((book) => (
            <FlatShelfSpine key={book.id} book={book} />
          ))}
        </div>
        <div className="w-full border-b border-hairline" />
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="border border-hairline rounded-[12px] bg-surface overflow-hidden divide-y divide-hairline">
        {filteredBooks.map((book) => (
          <Link
            key={book.id}
            href={`/reader/${encodeURIComponent(book.id)}`}
            className="p-4 sm:p-5 flex items-center justify-between gap-4 hover:bg-hairline/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`Read ${book.title} by ${book.author}`}
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 aspect-[2/3] shrink-0">
                <Cover
                  src={book.coverUrl}
                  title={book.title}
                  author={book.author}
                  aspect="aspect-[2/3]"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-serif text-[16px] text-ink font-normal leading-snug truncate">
                  {book.title}
                </h3>
                <p className="font-sans text-[13px] text-muted truncate mt-0.5">
                  {book.author || 'Unknown Author'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              <div className="w-24 hidden sm:block">
                <ProgressLine value={book.progressPercentage || 0} />
              </div>
              <span className="text-[12px] font-sans font-medium text-muted tabular-nums">
                {book.progressPercentage || 0}%
              </span>
              <span className="material-symbols-outlined text-[18px] text-muted group-hover:text-ink transition-colors">
                arrow_forward
              </span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {filteredBooks.map((book) => (
        <Link
          key={book.id}
          href={`/reader/${encodeURIComponent(book.id)}`}
          className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[10px]"
          aria-label={`Read ${book.title} by ${book.author}`}
        >
          <Cover
            src={book.coverUrl}
            title={book.title}
            author={book.author}
            aspect="aspect-[2/3]"
          />
          <ProgressLine
            value={book.progressPercentage || 0}
            className="mt-3"
          />
          <h3 className="font-serif text-[15px] sm:text-[16.5px] text-ink font-normal leading-snug line-clamp-2 mt-2 group-hover:text-accent transition-colors">
            {book.title}
          </h3>
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mt-1 truncate">
            {book.author || 'Unknown Author'}
          </span>
        </Link>
      ))}
    </div>
  );
}

export default LibraryViews;
