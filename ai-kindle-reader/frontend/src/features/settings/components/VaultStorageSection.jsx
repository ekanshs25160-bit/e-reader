import { pluralize } from '@/lib/format';

export function VaultStorageSection({
  storageSummary,
  handleExportVault,
  isExporting,
  includeBinaries,
  setIncludeBinaries,
  restoreInputRef,
  handleRestoreFileChosen,
}) {
  return (
    <section className="space-y-2">
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block px-1">
        LOCAL STORAGE &amp; ARCHIVE
      </span>
      <div className="border border-hairline bg-surface rounded-[12px] divide-y divide-hairline">
        {/* Kept on this device */}
        <div className="flex items-center justify-between p-4">
          <span className="font-sans text-[14.5px] text-ink">Kept on this device</span>
          <span className="text-[12px] text-muted font-sans tabular-nums text-right">
            {pluralize(storageSummary.booksCount, 'volume')} ·{' '}
            {pluralize(storageSummary.highlightsCount, 'highlight')} ·{' '}
            {pluralize(storageSummary.vocabularyCount, 'term')} · {storageSummary.storageFormatted}
          </span>
        </div>

        {/* Last Saved */}
        <div className="flex items-center justify-between p-4">
          <span className="font-sans text-[14.5px] text-ink">Last saved</span>
          <span className="text-[12px] text-muted font-sans">
            {storageSummary.lastSavedFormatted}
          </span>
        </div>

        {/* Export JSON Backup */}
        <div className="p-4 space-y-2.5">
          <div
            onClick={handleExportVault}
            className="flex items-center justify-between cursor-pointer"
          >
            <div>
              <p className="font-sans text-[14.5px] text-ink font-medium">
                Export library archive (.json)
              </p>
              <p className="text-[11.5px] text-muted font-sans">
                Complete local backup of notes, highlights, and lexicon
              </p>
            </div>
            <button
              type="button"
              disabled={isExporting}
              aria-label="Download backup archive"
              className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/40 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
              ) : (
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  download
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            role="checkbox"
            aria-checked={includeBinaries}
            onClick={() => setIncludeBinaries(!includeBinaries)}
            className="flex items-center gap-2.5 cursor-pointer pt-1 text-[12px] text-muted hover:text-ink select-none min-h-[44px]"
          >
            <span
              className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors shrink-0 ${
                includeBinaries
                  ? 'bg-ink border-ink'
                  : 'border-hairline bg-surface'
              }`}
            >
              {includeBinaries && (
                <span
                  className="material-symbols-outlined text-[13px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300", color: 'var(--theme-contrast)' }}
                >
                  check
                </span>
              )}
            </span>
            <span>Include downloaded EPUB binaries in archive</span>
          </button>
        </div>

        {/* Restore from Backup */}
        <div
          onClick={() => restoreInputRef.current?.click()}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-hairline/10 transition-colors"
        >
          <input
            ref={restoreInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleRestoreFileChosen}
          />
          <div>
            <p className="font-sans text-[14.5px] text-ink font-medium">
              Restore from archive
            </p>
            <p className="text-[11.5px] text-muted font-sans">
              Import volumes, notes, bookmarks, and vocabulary
            </p>
          </div>
          <button
            type="button"
            aria-label="Upload backup archive"
            className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/40 transition-colors"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
            >
              upload
            </span>
          </button>
        </div>
      </div>
    </section>
  );
}
