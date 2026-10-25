'use client';

import Link from 'next/link';
import { Card, SectionHeader, Button, Cover } from '@/components/ui';

export function RecentBooksShelf({ otherBooks, fellOutItem }) {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <SectionHeader
          title="Recent volumes"
          action={
            <Link
              href="/library"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
            >
              <Button variant="ghost" size="sm">
                Shelf view
              </Button>
            </Link>
          }
        />

        {otherBooks.length > 0 ? (
          <div className="grid grid-cols-3 gap-3.5">
            {otherBooks.map((b) => (
              <Link
                key={b.id}
                href={`/book/${encodeURIComponent(b.id)}`}
                className="group flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-[10px]"
                aria-label={`${b.title} by ${b.author}`}
              >
                <Cover
                  src={b.coverUrl}
                  title={b.title}
                  author={b.author}
                  aspect="aspect-[2/3]"
                />
                <p className="font-serif text-[13px] text-ink mt-2 line-clamp-1 group-hover:text-accent transition-colors">
                  {b.title}
                </p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted truncate mt-0.5">
                  {b.author || 'Author'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-5 text-center">
            <p className="font-serif text-[14.5px] text-muted">
              No other volumes in vault yet.
            </p>
          </Card>
        )}
      </div>

      {fellOutItem && (
        <Card className="p-6 space-y-3">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block">
            {fellOutItem.type === 'word' ? 'Lexicon Card' : 'From Your Marginalia'}
          </span>

          {fellOutItem.type === 'word' ? (
            <div>
              <h3 className="font-serif text-[18px] text-ink font-normal mb-1">
                {fellOutItem.word}
              </h3>
              <p className="font-sans text-[13.5px] text-muted leading-relaxed">
                {fellOutItem.definition}
              </p>
            </div>
          ) : (
            <div>
              <blockquote className="font-serif italic text-ink text-[15px] leading-relaxed mb-2">
                “{fellOutItem.text}”
              </blockquote>
              <p className="font-sans text-[11px] uppercase tracking-[0.12em] text-muted">
                — {fellOutItem.bookTitle || 'Recent Reading'}
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default RecentBooksShelf;
