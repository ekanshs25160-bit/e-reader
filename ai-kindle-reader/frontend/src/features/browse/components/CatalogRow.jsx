import Link from 'next/link';
import Cover from '@/components/ui/Cover';

export function CatalogRow({
  book,
  isSaved,
  isDownloading,
  onOpenReader,
  onDownload,
}) {
  const hasDownloadId = Boolean(
    book.gutenbergId ||
      (book.id && String(book.id).startsWith('gutenberg_'))
  );
  const bookKey = book.gutenbergId
    ? `gutenberg_${book.gutenbergId}`
    : String(book.id);

  return (
    <div className="border border-hairline bg-surface rounded-[12px] p-3 sm:p-3.5 flex items-center justify-between gap-3.5 hover:border-ink/25 transition-colors group">
      <Link
        href={`/book/${encodeURIComponent(bookKey)}`}
        className="flex items-center gap-3.5 min-w-0 flex-1 focus:outline-none"
      >
        <div className="w-12 aspect-[2/3] shrink-0">
          <Cover
            coverUrl={book.coverUrl}
            title={book.title}
            author={book.author}
            size="sm"
          />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium truncate block">
            {book.author}
          </span>
          <h3 className="font-serif text-[16px] sm:text-[17px] text-ink font-normal leading-snug truncate mt-0.5 group-hover:underline">
            {book.title}
          </h3>
          <p className="text-[11.5px] text-muted font-sans tabular-nums mt-0.5 truncate">
            {book.meta}
          </p>
        </div>
      </Link>

      {/* Quiet Download Icon Button */}
      <div className="shrink-0 flex items-center">
        {isDownloading ? (
          <div
            className="min-w-[44px] min-h-[44px] flex items-center justify-center px-2"
            aria-label="Downloading EPUB"
          >
            <div className="w-10 h-1.5 bg-hairline rounded-full overflow-hidden">
              <div className="w-2/3 h-full bg-accent animate-pulse rounded-full" />
            </div>
          </div>
        ) : isSaved ? (
          <button
            type="button"
            onClick={() => onOpenReader(bookKey)}
            className="min-w-[44px] min-h-[44px] px-3 py-1.5 rounded-full border border-hairline bg-surface text-ink text-[12px] font-sans flex items-center gap-1.5 hover:border-ink/40 transition-colors"
            title="In offline library — Open reader"
            aria-label="In offline library — Open reader"
          >
            <span
              className="material-symbols-outlined text-[16px] text-accent"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              check
            </span>
            <span className="hidden sm:inline text-muted">In Library</span>
          </button>
        ) : hasDownloadId ? (
          <button
            type="button"
            onClick={(e) => onDownload(e, book)}
            className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-hairline bg-surface text-muted hover:text-ink hover:border-ink/40 transition-colors flex items-center justify-center"
            title="Save to Library"
            aria-label={`Save "${book.title}" to Library`}
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              download
            </span>
          </button>
        ) : (
          <div
            className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-hairline/50 text-muted/30 flex items-center justify-center cursor-not-allowed"
            title="Download unavailable"
            aria-label="Download unavailable"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              block
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
