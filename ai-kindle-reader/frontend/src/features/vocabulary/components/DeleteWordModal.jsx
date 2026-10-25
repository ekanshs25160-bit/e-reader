import Button from '@/components/ui/Button';

export function DeleteWordModal({
  deleteConfirmId,
  words,
  onClose,
  onDelete,
}) {
  if (!deleteConfirmId) return null;

  const target = words.find((w) => w.id === deleteConfirmId);

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
        className="w-full max-w-sm bg-surface rounded-[24px] border border-hairline p-6 space-y-4"
      >
        <h3 className="font-serif text-[18px] text-ink font-normal">
          Remove from lexicon?
        </h3>
        <p className="text-[13px] text-muted font-sans">
          This entry and its review progress will be removed from your vault.
        </p>
        <div className="flex gap-2 pt-2">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={() => onDelete(deleteConfirmId, target?.word || 'term')}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
