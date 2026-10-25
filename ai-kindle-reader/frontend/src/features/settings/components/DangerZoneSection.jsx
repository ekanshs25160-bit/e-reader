export function DangerZoneSection({ onOpenEraseModal }) {
  return (
    <section className="space-y-2">
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-red-800 dark:text-red-400 font-sans font-medium block px-1">
        DANGER ZONE
      </span>
      <div className="border border-hairline bg-surface rounded-[12px] overflow-hidden">
        <button
          type="button"
          onClick={onOpenEraseModal}
          className="w-full flex items-center justify-between p-4 text-left text-red-800 dark:text-red-400 hover:bg-red-500/5 transition-colors min-h-[44px]"
        >
          <span className="font-sans text-[14.5px] font-medium">
            Erase everything on this device
          </span>
          <span
            className="material-symbols-outlined text-[18px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
          >
            chevron_right
          </span>
        </button>
      </div>
    </section>
  );
}
