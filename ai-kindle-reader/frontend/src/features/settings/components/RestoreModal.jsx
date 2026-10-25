import Button from '@/components/ui/Button';

export function RestoreModal({
  isOpen,
  pendingRestore,
  onClose,
  onConfirm,
  isRestoring,
}) {
  if (!isOpen || !pendingRestore) return null;

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
        <div className="flex items-center justify-between border-b border-hairline pb-3">
          <h3 className="font-serif text-[20px] text-ink font-normal">
            Restore Vault Archive
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

        <p className="text-[13.5px] text-muted font-sans">
          Archive <strong className="text-ink">{pendingRestore.fileName}</strong> validated.
          Records to merge:
        </p>

        <div className="grid grid-cols-2 gap-2 p-3 rounded-[12px] border border-hairline bg-background text-[12.5px] font-sans">
          <div className="flex justify-between p-2 rounded-[8px] bg-surface border border-hairline">
            <span className="text-muted">Volumes:</span>
            <span className="font-medium text-ink tabular-nums">{pendingRestore.booksCount}</span>
          </div>
          <div className="flex justify-between p-2 rounded-[8px] bg-surface border border-hairline">
            <span className="text-muted">Files:</span>
            <span className="font-medium text-ink">
              {pendingRestore.hasBinaries ? 'Included' : 'Metadata'}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded-[8px] bg-surface border border-hairline">
            <span className="text-muted">Highlights:</span>
            <span className="font-medium text-ink tabular-nums">
              {pendingRestore.highlightsCount}
            </span>
          </div>
          <div className="flex justify-between p-2 rounded-[8px] bg-surface border border-hairline">
            <span className="text-muted">Vocabulary:</span>
            <span className="font-medium text-ink tabular-nums">{pendingRestore.wordsCount}</span>
          </div>
        </div>

        <p className="text-[12px] text-muted font-sans">
          Existing volumes and notes will be merged by ID with the archive contents.
        </p>

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
            className="flex-1"
            onClick={onConfirm}
            disabled={isRestoring}
          >
            {isRestoring ? 'Restoring…' : 'Restore Archive'}
          </Button>
        </div>
      </div>
    </div>
  );
}
