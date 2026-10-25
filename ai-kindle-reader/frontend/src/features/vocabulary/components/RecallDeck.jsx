import { HighlightedSentence } from './HighlightedSentence';
import { speakWord } from '../lib/vocabulary-helpers';
import Button from '@/components/ui/Button';

export function RecallDeck({
  activeRecallCard,
  dueCardsCount,
  onSpeak,
  onOpenInReader,
  onRecallAction,
}) {
  if (!activeRecallCard) return null;

  return (
    <section className="border border-hairline bg-surface rounded-[12px] p-5 sm:p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-hairline pb-2.5">
        <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
          Due for Recall · {dueCardsCount} in queue
        </span>
        <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
          {activeRecallCard.partOfSpeech}
        </span>
      </div>

      <div className="flex items-baseline gap-3">
        {/* Serif Word */}
        <h2 className="font-serif text-[26px] sm:text-[30px] font-normal text-ink leading-tight">
          {activeRecallCard.word}
        </h2>
        {activeRecallCard.phonetic && (
          <span className="text-[13px] text-muted font-sans font-normal">
            {activeRecallCard.phonetic}
          </span>
        )}
        <button
          type="button"
          onClick={() => onSpeak(activeRecallCard.word)}
          className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/30 transition-colors"
          title="Pronounce word"
          aria-label="Pronounce word"
        >
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            volume_up
          </span>
        </button>
      </div>

      <p className="text-[14.5px] font-sans text-ink leading-relaxed">
        {activeRecallCard.definition}
      </p>

      {/* Saved sentence in italic serif with word underlined in bronze */}
      {activeRecallCard.contextSentence && (
        <div
          onClick={() =>
            onOpenInReader(activeRecallCard.bookId, activeRecallCard.cfi)
          }
          className={`p-3.5 rounded-[12px] border border-hairline bg-background/50 ${
            activeRecallCard.bookId ? 'cursor-pointer hover:border-ink/30' : ''
          } transition-colors`}
        >
          <HighlightedSentence
            sentence={activeRecallCard.contextSentence}
            word={activeRecallCard.word}
          />
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-hairline text-muted">
            <span className="text-[11px] font-sans">
              {activeRecallCard.bookTitle}{' '}
              {activeRecallCard.chapter ? `· ${activeRecallCard.chapter}` : ''}
            </span>
            {activeRecallCard.bookId && (
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                open_in_new
              </span>
            )}
          </div>
        </div>
      )}

      {/* Review buttons as secondary hairline pills */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onRecallAction(false)}
          icon="update"
        >
          Review Soon
        </Button>
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => onRecallAction(true)}
          icon="check"
        >
          Remembered
        </Button>
      </div>
    </section>
  );
}
