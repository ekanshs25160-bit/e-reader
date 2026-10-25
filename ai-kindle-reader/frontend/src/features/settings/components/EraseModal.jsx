import Button from '@/components/ui/Button';

export function EraseModal({
  isOpen,
  eraseConfirmInput,
  setEraseConfirmInput,
  onClose,
  onConfirm,
  isErasing,
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
        className="w-full max-w-md bg-surface text-ink rounded-[24px] border border-hairline p-6 space-y-4"
      >
        <div className="border-b border-hairline pb-3">
          <h3 className="font-serif text-[20px] text-red-600 dark:text-red-400 font-normal">
            Erase all local data?
          </h3>
        </div>

        <p className="text-[13.5px] text-muted font-sans leading-relaxed">
          This action is <strong className="text-red-600 dark:text-red-400">irreversible</strong>.
          All downloaded EPUBs, reading sessions, highlights, and saved vocabulary will be permanently removed from this browser.
        </p>

        <div className="space-y-1.5 pt-1">
          <label className="text-[11px] uppercase tracking-[0.12em] text-muted font-sans block">
            Type <strong className="text-red-600 dark:text-red-400 font-mono">ERASE</strong> to confirm:
          </label>
          <input
            value={eraseConfirmInput}
            onChange={(e) => setEraseConfirmInput(e.target.value)}
            placeholder="ERASE"
            className="w-full rounded-[12px] bg-background border border-hairline px-3.5 py-2.5 font-mono text-[14px] uppercase text-ink focus:outline-none focus:border-red-600"
            autoFocus
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            className="flex-1 bg-semantic-error text-contrast hover:opacity-90"
            onClick={onConfirm}
            disabled={eraseConfirmInput !== 'ERASE' || isErasing}
          >
            {isErasing ? 'Erasing…' : 'Confirm Erase'}
          </Button>
        </div>
      </div>
    </div>
  );
}
