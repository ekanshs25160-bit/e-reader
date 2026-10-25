export function AiDefinitionView({
  cleanWord,
  bookTitle,
  dictResult,
  dictLoading,
  dictError,
  onAskAi,
}) {
  return (
    <div className="bg-surface-container-lowest/80 backdrop-blur-sm rounded-xl p-4 border border-outline-variant/35 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
        <div className="flex items-baseline gap-2">
          <h3 className="font-headline-md text-[18px] text-primary tracking-tight font-medium">
            {dictResult?.word || cleanWord}
          </h3>
          <span className="font-body-ui text-[12px] text-outline font-mono">
            {dictResult?.phonetic || '/—/'}
          </span>
        </div>
        {dictResult?.partsOfSpeech?.[0] && (
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-label-sm tracking-wider bg-surface-container-high text-on-surface-variant">
            {dictResult.partsOfSpeech[0]}
          </span>
        )}
      </div>

      {dictLoading ? (
        <div className="py-6 text-center text-caption text-on-surface-variant animate-pulse flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span>Looking up dictionary entry…</span>
        </div>
      ) : dictError ? (
        <div className="py-4 text-center text-xs text-on-surface-variant">
          <p>{dictError}</p>
          <button
            type="button"
            onClick={onAskAi}
            className="mt-2 text-secondary underline font-medium"
          >
            Ask AI to analyze this excerpt
          </button>
        </div>
      ) : dictResult?.definition ? (
        <ol className="space-y-2 text-[13.5px] leading-relaxed list-decimal list-inside text-on-surface font-body-ui">
          {dictResult.definition.slice(0, 3).map((def, idx) => (
            <li key={idx} className="text-on-surface-variant">
              <span className="text-on-surface">{def}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="font-body-ui text-[13.5px] text-on-surface-variant leading-relaxed">
          Contextual usage in {bookTitle}: &ldquo;{cleanWord}&rdquo; conveys the tone of the passage.
        </p>
      )}

      <div className="pt-2 flex items-center gap-1.5 text-on-surface-variant font-caption text-caption border-t border-outline-variant/20">
        <span className="material-symbols-outlined text-[15px] text-secondary" data-icon="policy">
          policy
        </span>
        <span>Dictionary API Grounding</span>
      </div>
    </div>
  );
}
