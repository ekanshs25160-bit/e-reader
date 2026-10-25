export function AiHeader({
  spoilersOff,
  setSpoilersOff,
  chapterDisplay,
  onClose,
}) {
  return (
    <>
      {/* Tactile Drag Handle (Mobile only) */}
      <div className="md:hidden w-full flex justify-center pt-2.5 pb-1">
        <div className="w-10 h-1 rounded-full bg-outline-variant/60"></div>
      </div>

      {/* Drawer Header Bar */}
      <header className="px-5 py-2.5 flex items-center justify-between border-b border-outline-variant/20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary border border-outline-variant/30 shadow-xs">
            <span
              className="material-symbols-outlined text-[18px]"
              data-icon="auto_stories"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              auto_stories
            </span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight leading-tight">
              Literary Companion
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Spoiler Protection Indicator */}
          <button
            type="button"
            onClick={() => setSpoilersOff((v) => !v)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/40 text-on-surface-variant font-label-sm text-label-sm hover:bg-surface-container transition-colors min-h-[44px]"
          >
            <span
              className="material-symbols-outlined text-[14px] text-secondary"
              data-icon="shield"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield
            </span>
            <span>{spoilersOff ? `Spoilers: Off (${chapterDisplay})` : 'Spoilers: All'}</span>
          </button>
          {/* Dismiss Button */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close drawer"
            className="w-11 h-11 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <span className="material-symbols-outlined text-[20px]" data-icon="close">
              close
            </span>
          </button>
        </div>
      </header>
    </>
  );
}
