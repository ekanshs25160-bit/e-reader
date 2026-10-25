'use client';

import { pluralize } from '@/lib/format';

export default function ReaderFooter({
  showHud,
  activeOverlay,
  setActiveOverlay,
  isShortLandscape,
  selectedData,
  pct,
  pageInfo,
  minutesLeftInChapter,
  chapterDisplayName,
  chapterProgressPercent,
  endOfChapterHint,
  handleToggleHud,
}) {
  const isContentsOpen = activeOverlay === 'contents';
  const isSettingsOpen = activeOverlay === 'settings';

  return (
    <>
      {/* Top progress capsule visible when controls are hidden */}
      {!showHud && activeOverlay === 'none' && !selectedData && (
        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Reading progress: ${pct}%`}
          style={{
            top: 'max(8px, env(safe-area-inset-top, 8px))',
            backgroundColor: 'var(--reader-bg)',
            borderColor: 'var(--reader-border)',
            color: 'var(--reader-fg)',
          }}
          className="fixed left-1/2 -translate-x-1/2 z-30 max-w-[68ch] w-[90vw] sm:w-[92vw] h-1 rounded-full p-[1px] backdrop-blur-sm border pointer-events-none transition-all duration-300 shadow-xs"
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              backgroundColor: 'var(--reader-accent)',
              width: `${Math.max(0, Math.min(100, pct))}%`,
            }}
          />
        </div>
      )}

      {/* Reading Progress Subtle Indicator Bar */}
      {showHud && activeOverlay === 'none' && !selectedData && (
        <div
          aria-label={`${minutesLeftInChapter} minutes left in ${chapterDisplayName}`}
          style={{ color: 'var(--reader-muted)' }}
          className={`fixed left-1/2 -translate-x-1/2 z-20 pointer-events-none flex flex-col items-center justify-center space-y-1 text-center transition-all duration-300 w-[92vw] max-w-xs ${
            isShortLandscape ? 'bottom-12' : 'bottom-20'
          }`}
        >
          <div
            style={{ backgroundColor: 'var(--reader-border)' }}
            className="w-full max-w-xs rounded-full h-1 overflow-hidden"
          >
            <div
              className="h-1 rounded-full transition-all duration-300"
              style={{
                backgroundColor: 'var(--reader-accent)',
                width: `${chapterProgressPercent}%`,
              }}
            />
          </div>
          <span
            style={{ color: 'var(--reader-muted)' }}
            className="font-label-sm text-[10px] tracking-widest uppercase truncate max-w-full"
          >
            {pageInfo?.current === pageInfo?.total && (pageInfo?.total || 1) > 1
              ? `< 1 minute left in ${chapterDisplayName}`
              : `${pluralize(minutesLeftInChapter, 'minute')} left in ${chapterDisplayName}`}
          </span>
        </div>
      )}

      {/* End of Chapter 2-second Non-Modal Hint Banner */}
      {endOfChapterHint && activeOverlay === 'none' && (
        <div
          role="status"
          aria-live="polite"
          style={{
            backgroundColor: 'var(--reader-bg)',
            borderColor: 'var(--reader-border)',
            color: 'var(--reader-fg)',
          }}
          className="fixed bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-full border font-label-md text-xs font-medium shadow-lg backdrop-blur-md pointer-events-none transition-all duration-200 flex items-center gap-2 select-none"
        >
          <span
            style={{ color: 'var(--reader-accent)' }}
            className="material-symbols-outlined text-[16px]"
          >
            arrow_forward
          </span>
          <span>End of chapter · swipe to continue</span>
        </div>
      )}

      {/* BottomNavBar */}
      <nav
        style={{
          backgroundColor: 'var(--reader-bg)',
          borderColor: 'var(--reader-border)',
          color: 'var(--reader-fg)',
        }}
        className={`fixed bottom-0 left-0 right-0 w-full z-40 flex justify-between items-center px-gutter ${
          isShortLandscape ? 'h-10' : 'h-16'
        } bg-opacity-90 backdrop-blur-md border-t shadow-sm transition-all duration-300 ease-in-out ${
          showHud
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Item 1: Contents */}
        <button
          type="button"
          onClick={() => setActiveOverlay((prev) => (prev === 'contents' ? 'none' : 'contents'))}
          aria-label="Table of contents (C)"
          title="Table of contents (C)"
          style={{ color: isContentsOpen ? 'var(--reader-accent)' : 'var(--reader-muted)' }}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span style={{ color: "inherit" }} className="material-symbols-outlined" data-icon="menu_book">
            menu_book
          </span>
          <span style={{ color: "inherit" }} className="font-label-sm text-label-sm mt-0.5">Contents</span>
        </button>

        {/* Item 2: Active Reading Progress */}
        <button
          type="button"
          onClick={handleToggleHud}
          aria-label={`Reading progress: Page ${pageInfo?.current || 1} of ${pageInfo?.total || 1}, ${pct}%`}
          title={`Reading progress: Page ${pageInfo?.current || 1} of ${pageInfo?.total || 1} · ${pct}%`}
          style={{ color: 'var(--reader-fg)' }}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center font-medium hover:opacity-80 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <div className="flex items-center space-x-1.5">
            <span
              style={{ color: 'var(--reader-accent)' }}
              className="material-symbols-outlined text-[16px]"
              data-icon="article"
            >
              article
            </span>
            <span style={{ color: "var(--reader-fg)" }} className="font-label-sm text-[11px] tracking-wider font-semibold">
              PAGE {pageInfo.current} OF {pageInfo.total} · {pct}%
            </span>
          </div>
          <div
            style={{ backgroundColor: 'var(--reader-border)' }}
            className="w-16 h-1 rounded-full mt-1 overflow-hidden"
          >
            <div
              style={{
                backgroundColor: 'var(--reader-accent)',
                width: `${Math.max(2, Math.min(100, pct))}%`,
              }}
              className="h-full rounded-full transition-all duration-300"
            />
          </div>
        </button>

        {/* Item 3: Appearance */}
        <button
          type="button"
          onClick={() => setActiveOverlay((prev) => (prev === 'settings' ? 'none' : 'settings'))}
          aria-label="Appearance settings (A)"
          title="Appearance settings (A)"
          style={{ color: isSettingsOpen ? 'var(--reader-accent)' : 'var(--reader-muted)' }}
          className="min-w-[44px] min-h-[44px] flex flex-col items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 py-1 px-3 rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span style={{ color: "inherit" }} className="material-symbols-outlined" data-icon="format_size">
            format_size
          </span>
          <span style={{ color: "inherit" }} className="font-label-sm text-label-sm mt-0.5">Appearance</span>
        </button>
      </nav>
    </>
  );
}
