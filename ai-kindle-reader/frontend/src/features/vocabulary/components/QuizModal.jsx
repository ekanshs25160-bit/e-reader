import Button from '@/components/ui/Button';

export function QuizModal({
  isOpen,
  onClose,
  activeQuizCard,
  quizIndex,
  totalWords,
  quizFlipped,
  setQuizFlipped,
  quizFinished,
  quizStats,
  onQuizAnswer,
}) {
  if (!isOpen || !activeQuizCard) return null;

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
        className="w-full max-w-md bg-surface rounded-[24px] border border-hairline p-6 space-y-5"
      >
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
            Card {quizIndex + 1} of {Math.min(totalWords, 10)}
          </span>
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

        {quizFinished ? (
          <div className="text-center py-6 space-y-4">
            <h3 className="font-serif text-[24px] text-ink font-normal">
              Quiz complete
            </h3>
            <p className="text-[14px] text-muted font-sans">
              {quizStats.remembered} remembered · {quizStats.reviewSoon} scheduled for review
            </p>
            <Button
              variant="primary"
              className="w-full"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <div
              onClick={() => setQuizFlipped(!quizFlipped)}
              className="min-h-[160px] p-6 rounded-[12px] border border-hairline bg-background/50 flex flex-col items-center justify-center cursor-pointer space-y-2 select-none"
            >
              <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium">
                {activeQuizCard.partOfSpeech}
              </span>
              <h3 className="font-serif text-[28px] text-ink font-normal">
                {activeQuizCard.word}
              </h3>
              {quizFlipped ? (
                <p className="text-[14px] text-muted font-sans pt-2">
                  {activeQuizCard.definition}
                </p>
              ) : (
                <span className="text-[11px] text-muted font-sans pt-2">
                  Click to reveal definition
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => onQuizAnswer(false)}
              >
                Review Soon
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={() => onQuizAnswer(true)}
              >
                Remembered
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
