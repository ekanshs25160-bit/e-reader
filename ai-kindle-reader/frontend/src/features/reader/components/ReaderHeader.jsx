'use client';

import { useRouter } from 'next/navigation';

export default function ReaderHeader({
  bookMeta,
  pageInfo,
  showHud,
  activeOverlay,
  setActiveOverlay,
  isShortLandscape,
  isCurrentBookmarked,
  handleToggleBookmark,
  isFullscreen,
  handleToggleFullscreen,
  contentsBtnRef,
  highlightsBtnRef,
}) {
  const router = useRouter();

  return (
    <header
      style={{
        backgroundColor: 'var(--reader-bg)',
        borderColor: 'var(--reader-border)',
        color: 'var(--reader-fg)',
      }}
      className={`fixed top-0 left-0 w-full z-40 flex justify-between items-center px-4 sm:px-6 ${
        isShortLandscape ? 'h-9' : 'h-14'
      } bg-opacity-90 backdrop-blur-md border-b shadow-sm transition-all duration-300 ease-in-out ${
        showHud || activeOverlay !== 'none'
          ? 'translate-y-0 opacity-100 pointer-events-auto'
          : '-translate-y-full opacity-0 pointer-events-none'
      }`}
    >
      {/* Leading Actions: Back, Contents, Highlights */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => router.push('/library')}
          aria-label="Return to library"
          title="Return to library"
          style={{ color: 'var(--reader-fg)' }}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]" data-icon="arrow_back">
            arrow_back
          </span>
        </button>

        <button
          ref={contentsBtnRef}
          type="button"
          onClick={() => setActiveOverlay((prev) => (prev === 'contents' ? 'none' : 'contents'))}
          aria-label="Contents (C)"
          title="Contents (C)"
          style={{
            color: activeOverlay === 'contents' ? 'var(--reader-accent)' : 'var(--reader-fg)',
            backgroundColor: activeOverlay === 'contents' ? 'var(--reader-accent-alpha, rgba(133,82,36,0.12))' : 'transparent',
          }}
          className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]" data-icon="menu_book">
            menu_book
          </span>
        </button>

        <button
          ref={highlightsBtnRef}
          type="button"
          onClick={() => setActiveOverlay((prev) => (prev === 'highlights' ? 'none' : 'highlights'))}
          aria-label="Highlights and notes"
          title="Highlights and notes"
          style={{
            color: activeOverlay === 'highlights' ? 'var(--reader-accent)' : 'var(--reader-fg)',
            backgroundColor: activeOverlay === 'highlights' ? 'var(--reader-accent-alpha, rgba(133,82,36,0.12))' : 'transparent',
          }}
          className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]" data-icon="rate_review">
            rate_review
          </span>
        </button>
      </div>

      {/* Title / Brand Pill with Chapter Subtitle */}
      <div className="flex flex-col items-center justify-center max-w-[50vw] sm:max-w-md min-w-0">
        <div
          style={{
            backgroundColor: 'var(--reader-bg)',
            borderColor: 'var(--reader-border)',
          }}
          className="flex items-center px-3.5 py-0.5 rounded-full border shadow-xs max-w-full truncate"
        >
          <span
            style={{ color: 'var(--reader-fg)' }}
            className="font-headline-sm text-label-md tracking-normal font-medium truncate"
          >
            {bookMeta?.title || 'Reading'}
          </span>
          {bookMeta?.author && (
            <>
              <span style={{ color: 'var(--reader-muted)' }} className="mx-1.5 text-[10px] shrink-0">•</span>
              <span
                style={{ color: 'var(--reader-muted)' }}
                className="font-label-md text-caption truncate shrink-0"
              >
                {bookMeta.author}
              </span>
            </>
          )}
        </div>
        <span
          style={{ color: 'var(--reader-muted)' }}
          className="font-label-sm text-[10px] tracking-wide mt-0.5 truncate"
        >
          {`Chapter ${pageInfo?.current || 1} / ${pageInfo?.total || 1}`}
        </span>
      </div>

      {/* Trailing Actions: Search + Bookmark + Appearance + Fullscreen */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          disabled
          aria-label="Search"
          title="Search (Coming soon)"
          style={{ color: 'var(--reader-fg)' }}
          className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center opacity-40 cursor-not-allowed select-none"
        >
          <span className="material-symbols-outlined text-[20px]" data-icon="search">
            search
          </span>
        </button>

        <button
          type="button"
          onClick={handleToggleBookmark}
          aria-label={isCurrentBookmarked ? 'Remove bookmark (B)' : 'Bookmark this page (B)'}
          title={isCurrentBookmarked ? 'Remove bookmark (B)' : 'Bookmark this page (B)'}
          style={{ color: isCurrentBookmarked ? 'var(--reader-accent)' : 'var(--reader-fg)' }}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span
            className={`material-symbols-outlined text-[20px] ${
              isCurrentBookmarked ? 'fill-icon' : ''
            }`}
            data-icon="bookmark"
            style={{
              fontVariationSettings: isCurrentBookmarked ? "'FILL' 1" : "'FILL' 0",
              color: isCurrentBookmarked ? 'var(--reader-accent)' : 'var(--reader-fg)',
            }}
          >
            bookmark
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveOverlay((prev) => (prev === 'settings' ? 'none' : 'settings'))}
          aria-label="Appearance settings (A)"
          title="Appearance settings (A)"
          style={{
            color: activeOverlay === 'settings' ? 'var(--reader-accent)' : 'var(--reader-fg)',
            backgroundColor: activeOverlay === 'settings' ? 'var(--reader-accent-alpha, rgba(133,82,36,0.12))' : 'transparent',
          }}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span style={{ color: "var(--reader-fg)" }} className="material-symbols-outlined text-[20px]" data-icon="settings">settings</span>
        </button>

        <button
          type="button"
          onClick={handleToggleFullscreen}
          aria-label={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
          title={isFullscreen ? 'Exit fullscreen (F)' : 'Enter fullscreen (F)'}
          style={{ color: 'var(--reader-fg)' }}
          className="hidden lg:flex w-10 h-10 rounded-full items-center justify-center hover:opacity-80 active:scale-95 transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="material-symbols-outlined text-[20px]" data-icon={isFullscreen ? 'fullscreen_exit' : 'fullscreen'}>
            {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
          </span>
        </button>
      </div>
    </header>
  );
}
