import { HighlightedSentence } from './HighlightedSentence';
import { pluralize } from '@/lib/format';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';

export function WordListTable({
  filteredLexicon,
  searchQuery,
  onResetFilters,
  onOpenAddModal,
  onSpeak,
  onOpenInReader,
  onOpenAiMargin,
  onDeleteRequest,
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between border-b border-hairline pb-2">
        <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
          Saved Lexicon ({pluralize(filteredLexicon.length, 'term')})
        </span>
        <span className="text-[11px] text-muted font-sans">Chronological</span>
      </div>

      {filteredLexicon.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={searchQuery ? 'search_off' : 'spellcheck'}
            title={searchQuery ? 'No matching words found' : 'Your lexicon is empty'}
            description={
              searchQuery
                ? `No terms match “${searchQuery}”.`
                : 'Capture unfamiliar words while reading to build your personal lexicon.'
            }
            action={
              searchQuery ? (
                <Button variant="secondary" onClick={onResetFilters}>
                  Reset filters
                </Button>
              ) : (
                <Button variant="primary" onClick={onOpenAddModal} icon="add">
                  Add term
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredLexicon.map((entry) => (
            <article
              key={entry.id}
              className="border border-hairline bg-surface rounded-[12px] p-4 flex flex-col justify-between space-y-3 hover:border-ink/25 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    {/* Serif Word */}
                    <h4 className="font-serif text-[20px] font-normal text-ink leading-tight">
                      {entry.word}
                    </h4>
                    {entry.phonetic && (
                      <span className="text-[12px] text-muted font-sans">
                        {entry.phonetic}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onSpeak(entry.word)}
                      className="text-muted hover:text-ink transition-colors min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center"
                      title="Pronounce word"
                      aria-label={`Pronounce ${entry.word}`}
                    >
                      <span
                        className="material-symbols-outlined text-[15px]"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                      >
                        volume_up
                      </span>
                    </button>
                  </div>
                  {/* Part of speech as micro-label */}
                  <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium shrink-0">
                    {entry.partOfSpeech}
                  </span>
                </div>

                <p className="text-[13.5px] text-muted font-sans mt-1 leading-relaxed">
                  {entry.definition}
                </p>

                {/* Saved sentence in italic serif with word underlined in bronze */}
                {entry.contextSentence && (
                  <div className="mt-3 p-3 rounded-[8px] border border-hairline bg-background/50">
                    <HighlightedSentence
                      sentence={entry.contextSentence}
                      word={entry.word}
                    />
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-hairline flex items-center justify-between text-[11px] text-muted">
                <span className="truncate max-w-[180px] font-sans">
                  {entry.bookTitle} {entry.chapter ? `· ${entry.chapter}` : ''}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onOpenAiMargin(entry)}
                    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-full text-muted hover:text-ink transition-colors flex items-center justify-center"
                    title="Explain in AI Margin"
                    aria-label="Explain in AI Margin"
                  >
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                    >
                      auto_awesome
                    </span>
                  </button>
                  {entry.bookId && (
                    <button
                      type="button"
                      onClick={() => onOpenInReader(entry.bookId, entry.cfi)}
                      className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-full text-muted hover:text-ink transition-colors flex items-center justify-center"
                      title="Open book passage"
                      aria-label="Open book passage"
                    >
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                      >
                        open_in_new
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteRequest(entry.id)}
                    className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 p-1.5 rounded-full text-muted hover:text-red-600 transition-colors flex items-center justify-center"
                    title="Delete word"
                    aria-label="Delete word"
                  >
                    <span
                      className="material-symbols-outlined text-[16px]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                    >
                      delete
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
