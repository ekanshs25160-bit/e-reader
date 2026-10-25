export function AiQuoteCard({ cleanQuote, chapterDisplay }) {
  if (!cleanQuote) return null;

  return (
    <div className="bg-surface-container-lowest/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/35 border-l-[3.5px] border-l-secondary shadow-sm space-y-2">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
        <div className="flex items-center gap-1.5">
          <span
            className="material-symbols-outlined text-[16px] text-secondary"
            data-icon="format_quote"
          >
            format_quote
          </span>
          <span className="font-label-sm text-[11px] tracking-wider uppercase text-secondary font-semibold">
            Highlighted Passage
          </span>
        </div>
        <span className="font-caption text-caption text-outline">
          {chapterDisplay}
        </span>
      </div>
      <div className="max-h-32 overflow-y-auto hide-scrollbar">
        <p className="font-body-reading text-[14px] leading-[23px] italic text-on-surface text-left select-text">
          &ldquo;{cleanQuote}&rdquo;
        </p>
      </div>
    </div>
  );
}
