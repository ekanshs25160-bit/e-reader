import ReactMarkdown from 'react-markdown';

export function AiAnalysisView({
  analysisTitle,
  currentTabState,
  onRetry,
}) {
  return (
    <div className="bg-surface-container-lowest/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/35 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
        <h3 className="font-headline-sm text-[18px] text-primary tracking-tight font-medium flex items-center gap-1.5">
          <span>{analysisTitle}</span>
        </h3>
        <span className="font-caption text-caption text-outline">Marginalia</span>
      </div>

      {/* Skeleton before first token */}
      {currentTabState.isStreaming && !currentTabState.text && (
        <div className="space-y-3 py-3 animate-pulse">
          <div className="h-4 bg-surface-container-high rounded-md w-3/4"></div>
          <div className="h-3.5 bg-surface-container-high rounded-md w-full"></div>
          <div className="h-3.5 bg-surface-container-high rounded-md w-5/6"></div>
          <div className="flex items-center gap-2 pt-2 text-secondary text-xs font-label-sm">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span>Consulting literary intelligence…</span>
          </div>
        </div>
      )}

      {/* Error state with Retry button */}
      {currentTabState.error && !currentTabState.isStreaming && (
        <div className="p-4 rounded-xl bg-error-container/20 border border-error/30 text-center space-y-2.5 my-2">
          <div className="flex items-center justify-center gap-2 text-error text-sm font-semibold">
            <span className="material-symbols-outlined text-[18px]">error_outline</span>
            <span>Analysis Failed</span>
          </div>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto">
            {currentTabState.error}
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-label-md hover:opacity-90 active:scale-95 transition"
          >
            <span className="material-symbols-outlined text-[15px]">refresh</span>
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Rendered Markdown with copper dot bullets */}
      {currentTabState.text && (
        <div className="text-[13.5px] leading-[22px] text-on-surface font-body-ui space-y-2.5">
          <ReactMarkdown
            components={{
              li: ({ children }) => (
                <div className="flex items-start gap-2 my-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0 mt-2"></span>
                  <div className="flex-1">{children}</div>
                </div>
              ),
              strong: ({ children }) => (
                <strong className="font-body-ui-bold text-primary">{children}</strong>
              ),
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            }}
          >
            {currentTabState.text}
          </ReactMarkdown>
          {currentTabState.isStreaming && (
            <span className="inline-block w-[2px] h-3.5 bg-secondary ml-1 cursor-pulse align-middle" />
          )}
        </div>
      )}

      {/* Grounding Verification Bar */}
      <div className="pt-2 flex items-center justify-between text-on-surface-variant font-caption text-caption border-t border-outline-variant/20">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-secondary" data-icon="policy">
            policy
          </span>
          <span>Grounding: Textual analysis &amp; historical grounding</span>
        </div>
        {!currentTabState.isStreaming && currentTabState.text && (
          <button
            type="button"
            onClick={onRetry}
            className="text-[11px] font-label-sm text-secondary hover:underline flex items-center gap-1"
            title="Regenerate insight"
          >
            <span className="material-symbols-outlined text-[13px]">refresh</span>
            <span>Regenerate</span>
          </button>
        )}
      </div>
    </div>
  );
}
