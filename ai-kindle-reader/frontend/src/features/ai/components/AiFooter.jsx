export function AiFooter({
  inputRef,
  followUpInput,
  setFollowUpInput,
  onSendFollowUp,
  onKeepAsNote,
  savedNote,
  onShare,
}) {
  return (
    <footer className="p-4 bg-surface/95 border-t border-outline-variant/20 flex flex-col gap-2.5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
      {/* Follow-up query pill input bar */}
      <form
        onSubmit={onSendFollowUp}
        className="flex items-center bg-surface-container rounded-full px-3.5 py-1.5 border border-outline-variant/40 focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary transition-all"
      >
        <span className="material-symbols-outlined text-[18px] text-outline mr-2" data-icon="search">
          search
        </span>
        <input
          ref={inputRef}
          value={followUpInput}
          onChange={(e) => setFollowUpInput(e.target.value)}
          className="w-full bg-transparent border-0 p-0 text-on-surface font-body-ui text-[13px] placeholder:text-outline focus:ring-0 focus:outline-none"
          placeholder="Ask a follow-up about this passage…"
          type="text"
        />
        <button
          type="submit"
          aria-label="Send follow up"
          className="w-7 h-7 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform ml-1 shrink-0"
        >
          <span className="material-symbols-outlined text-[15px]" data-icon="arrow_upward">
            arrow_upward
          </span>
        </button>
      </form>

      {/* Bottom Action Row */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onKeepAsNote}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-primary-container text-on-primary font-label-md text-label-md shadow-xs hover:bg-primary transition-colors active:scale-98"
        >
          <span
            className="material-symbols-outlined text-[16px] text-secondary-fixed"
            data-icon="push_pin"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            push_pin
          </span>
          <span>{savedNote ? 'Pinned to Notes ✓' : 'Keep as Note on this Page'}</span>
        </button>
        <button
          type="button"
          onClick={onShare}
          aria-label="Share insight"
          className="px-3 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant border border-outline-variant/40 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]" data-icon="ios_share">
            ios_share
          </span>
        </button>
      </div>
      <div className="text-center">
        <span className="font-caption text-[10px] text-outline">
          Saves to CFI timeline &amp; margin vault
        </span>
      </div>
    </footer>
  );
}
