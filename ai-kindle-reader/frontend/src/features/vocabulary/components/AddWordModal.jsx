import Button from '@/components/ui/Button';

export function AddWordModal({
  isOpen,
  onClose,
  addWord,
  setAddWord,
  addPhonetic,
  setAddPhonetic,
  addPartOfSpeech,
  setAddPartOfSpeech,
  addDefinition,
  setAddDefinition,
  addSentence,
  setAddSentence,
  lookingUp,
  lookupMessage,
  onLookup,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div
      data-overlay="dialog"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface rounded-[24px] border border-hairline p-6 space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h3 className="font-serif text-[20px] text-ink font-normal">
            Add to Lexicon
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink"
          >
            <span
              className="material-symbols-outlined text-[16px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              close
            </span>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5">
          <div>
            <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
              Word
            </label>
            <div className="flex gap-2">
              <input
                value={addWord}
                onChange={(e) => setAddWord(e.target.value)}
                placeholder="e.g. Ephemeral"
                required
                className="flex-1 bg-surface border border-hairline rounded-[12px] px-3.5 py-2.5 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink"
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onLookup}
                disabled={!addWord.trim() || lookingUp}
              >
                {lookingUp ? 'Looking…' : 'Lookup'}
              </Button>
            </div>
            {lookupMessage && (
              <p className="text-[11px] text-muted font-sans mt-1">{lookupMessage}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
                Phonetic
              </label>
              <input
                value={addPhonetic}
                onChange={(e) => setAddPhonetic(e.target.value)}
                placeholder="/ɪˈfɛmərəl/"
                className="w-full bg-surface border border-hairline rounded-[12px] px-3.5 py-2 text-[13px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink"
              />
            </div>
            <div>
              <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
                Part of Speech
              </label>
              <select
                value={addPartOfSpeech}
                onChange={(e) => setAddPartOfSpeech(e.target.value)}
                className="w-full bg-surface border border-hairline rounded-[12px] px-3 py-2 text-[13px] text-ink focus:outline-none focus:border-ink"
              >
                <option value="noun">Noun</option>
                <option value="verb">Verb</option>
                <option value="adjective">Adjective</option>
                <option value="adverb">Adverb</option>
                <option value="phrase">Phrase</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
              Definition
            </label>
            <textarea
              value={addDefinition}
              onChange={(e) => setAddDefinition(e.target.value)}
              placeholder="Lasting for a very short time…"
              required
              rows={3}
              className="w-full bg-surface border border-hairline rounded-[12px] p-3 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink"
            />
          </div>

          <div>
            <label className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block mb-1">
              Context Sentence
            </label>
            <textarea
              value={addSentence}
              onChange={(e) => setAddSentence(e.target.value)}
              placeholder="Fashions are ephemeral, but style endures…"
              rows={2}
              className="w-full bg-surface border border-hairline rounded-[12px] p-3 text-[14px] text-ink placeholder:text-muted/60 focus:outline-none focus:border-ink font-serif italic"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1">
              Save Term
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
