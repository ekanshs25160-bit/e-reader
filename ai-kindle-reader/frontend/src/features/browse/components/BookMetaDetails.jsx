import { formatBytes, formatLanguage } from '../lib/browse-helpers';
import { pluralize } from '@/lib/format';

export function BookMetaDetails({
  book,
  showFullSynopsis,
  setShowFullSynopsis,
}) {
  const formattedSize = formatBytes(book.fileSize);
  const languageNames = book.languages.map(formatLanguage).filter(Boolean);

  return (
    <>
      {/* Metadata as Definition List with Hairlines */}
      <dl className="divide-y divide-hairline border-y border-hairline my-6 text-[14px] font-sans">
        <div className="flex items-center justify-between py-2.5">
          <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
            Format
          </dt>
          <dd className="text-ink">EPUB</dd>
        </div>

        {book.languages.length > 0 && (
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
              Language
            </dt>
            <dd className="text-ink">
              {languageNames.join(', ') || book.languages.join(', ').toUpperCase()}
            </dd>
          </div>
        )}

        {formattedSize && (
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
              File Size
            </dt>
            <dd className="text-ink tabular-nums">{formattedSize}</dd>
          </div>
        )}

        {book.totalPages && (
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
              Length
            </dt>
            <dd className="text-ink tabular-nums">
              {pluralize(book.totalPages, 'page')}
            </dd>
          </div>
        )}

        {book.downloadCount > 0 && (
          <div className="flex items-center justify-between py-2.5">
            <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium">
              Downloads
            </dt>
            <dd className="text-ink tabular-nums">
              {book.downloadCount.toLocaleString()}
            </dd>
          </div>
        )}

        {book.subjects.length > 0 && (
          <div className="py-2.5">
            <dt className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium mb-1">
              Themes &amp; Context
            </dt>
            <dd className="text-muted text-[13px] leading-relaxed">
              {book.subjects
                .slice(0, 6)
                .map((s) => s.split('--')[0].trim())
                .join(' · ')}
            </dd>
          </div>
        )}
      </dl>

      {/* About This Edition */}
      {book.description && (
        <div className="space-y-2 pt-2">
          <h2 className="font-serif text-[18px] text-ink font-normal">
            About this edition
          </h2>
          <p
            className={`text-[14px] leading-relaxed text-muted font-sans ${
              !showFullSynopsis ? 'line-clamp-4' : ''
            }`}
          >
            {book.description}
          </p>
          {book.description.length > 180 && (
            <button
              type="button"
              onClick={() => setShowFullSynopsis(!showFullSynopsis)}
              className="text-[13px] text-ink font-sans underline decoration-hairline hover:decoration-ink transition-colors"
            >
              {showFullSynopsis ? 'Show less' : 'Read full synopsis'}
            </button>
          )}
        </div>
      )}
    </>
  );
}
