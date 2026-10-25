'use client';

export default function SelectionQuickActions({
  handleKeep,
  handleCopy,
  handleExplain,
  handleContext,
  handleFind,
}) {
  return (
    <div
      style={{ backgroundColor: 'var(--reader-bg)', borderColor: 'var(--reader-border)' }}
      className="grid grid-cols-5 divide-x text-center py-1"
    >
      <button
        type="button"
        onClick={handleKeep}
        aria-label="Keep word or passage note"
        title="Keep note"
        style={{ color: 'var(--reader-muted)', borderColor: 'var(--reader-border)' }}
        className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <span className="material-symbols-outlined text-[18px]" data-icon="sticky_note_2">sticky_note_2</span>
        <span className="font-label-sm text-[10px] mt-0.5">Keep</span>
      </button>
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy to clipboard"
        title="Copy to clipboard"
        style={{ color: 'var(--reader-muted)', borderColor: 'var(--reader-border)' }}
        className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <span className="material-symbols-outlined text-[18px]" data-icon="content_copy">content_copy</span>
        <span className="font-label-sm text-[10px] mt-0.5">Copy</span>
      </button>
      <button
        type="button"
        onClick={handleExplain}
        aria-label="Explain with AI"
        title="Explain with AI"
        style={{ color: 'var(--reader-accent)', borderColor: 'var(--reader-border)' }}
        className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <span className="material-symbols-outlined text-[18px]" data-icon="auto_awesome">auto_awesome</span>
        <span className="font-label-sm text-[10px] mt-0.5 font-medium">Explain</span>
      </button>
      <button
        type="button"
        onClick={handleContext}
        aria-label="Historical context with AI"
        title="Context with AI"
        style={{ color: 'var(--reader-muted)', borderColor: 'var(--reader-border)' }}
        className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <span className="material-symbols-outlined text-[18px]" data-icon="history_edu">history_edu</span>
        <span className="font-label-sm text-[10px] mt-0.5">Context</span>
      </button>
      <button
        type="button"
        onClick={handleFind}
        aria-label="Search on Google"
        title="Search on Google"
        style={{ color: 'var(--reader-muted)', borderColor: 'var(--reader-border)' }}
        className="flex flex-col items-center justify-center py-2.5 min-h-[44px] hover:opacity-80 active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        <span className="material-symbols-outlined text-[18px]" data-icon="search">search</span>
        <span className="font-label-sm text-[10px] mt-0.5">Find</span>
      </button>
    </div>
  );
}
