'use client';

export function ReaderInitialLoadingState() {
  return (
    <div className="w-full h-dvh bg-surface text-ink flex items-center justify-center p-6">
      <div className="flex flex-col items-center gap-4 max-w-sm w-full">
        <div className="w-16 h-24 rounded-[4px] border border-hairline bg-hairline/25 animate-pulse mb-1" />
        <div className="w-40 h-3 bg-hairline/35 rounded-full animate-pulse" />
        <p className="font-sans text-[13px] text-muted font-normal mt-2">Opening volume…</p>
      </div>
    </div>
  );
}

export function ReaderLoadingOverlay({ activePalette }) {
  return (
    <div
      style={{ backgroundColor: `var(--reader-bg, ${activePalette.outer || activePalette.bg})` }}
      className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-opacity-90 backdrop-blur-md"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-18 rounded-[4px] border border-hairline bg-hairline/25 animate-pulse mb-1" />
        <div className="w-32 h-2.5 bg-hairline/35 rounded-full animate-pulse" />
        <p style={{ color: `var(--reader-muted, ${activePalette.text})` }} className="font-sans text-xs">
          Opening book pages…
        </p>
      </div>
    </div>
  );
}

export function ReaderErrorOverlay({ error, onRetry }) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-surface/95 backdrop-blur-md text-on-surface">
      <span className="material-symbols-outlined text-[26px] text-error mb-2">error_outline</span>
      <h3 className="font-headline-md text-headline-sm text-primary mb-1">Unable to Open Book</h3>
      <p className="font-body-ui text-error text-xs max-w-md leading-relaxed mb-4">{error}</p>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-md"
      >
        <span className="material-symbols-outlined text-[16px]">refresh</span>
        <span>Retry Opening</span>
      </button>
    </div>
  );
}

export function ReaderDownloadState({ bookMeta, onDownload, isDownloading, error }) {
  return (
    <div className="w-full h-dvh bg-surface text-on-surface flex flex-col items-center justify-center px-6 text-center select-none">
      <div className="max-w-md w-full bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-8 backdrop-blur-xl flex flex-col items-center">
        <span className="material-symbols-outlined text-[32px] text-secondary mb-3">cloud_off</span>
        <h2 className="font-headline-md text-headline-sm text-primary mb-2">
          {bookMeta?.title || 'Book Not Downloaded'}
        </h2>
        <p className="font-body-ui text-xs text-on-surface-variant mb-6">
          The EPUB file is missing from your offline vault.
        </p>
        {error && <p className="text-xs text-error mb-4">{error}</p>}
        <button
          type="button"
          onClick={onDownload}
          disabled={isDownloading}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-semibold flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">
            {isDownloading ? 'hourglass_top' : 'download'}
          </span>
          <span>{isDownloading ? 'Downloading…' : 'Download EPUB'}</span>
        </button>
      </div>
    </div>
  );
}
