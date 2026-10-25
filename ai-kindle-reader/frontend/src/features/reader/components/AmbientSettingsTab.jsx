'use client';

import { PALETTES } from '../constants';

export default function AmbientSettingsTab({
  currentPaletteId,
  activePalette,
  handlePaletteSelect,
}) {
  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center justify-between">
        <span
          style={{ color: 'var(--reader-muted)' }}
          className="font-label-sm text-[11px] font-semibold tracking-wider uppercase"
        >
          Palette
        </span>
        <span
          style={{ color: 'var(--reader-accent)' }}
          className="font-caption text-caption font-medium"
        >
          {activePalette.subtitle}
        </span>
      </div>

      {/* Grid of Palette Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {PALETTES.map((p) => {
          const isSelected = currentPaletteId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              data-theme={p.id !== 'auto' ? p.id : undefined}
              onClick={() => handlePaletteSelect(p.id)}
              className={`flex flex-col items-center p-2 rounded-xl bg-surface border ${
                isSelected
                  ? 'border-accent ring-2 ring-accent'
                  : 'border-hairline hover:border-hairline/80'
              } active:scale-95 transition-all text-left group focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none`}
            >
              <div className="w-full h-8 rounded-lg bg-surface-container border border-hairline flex items-center justify-center mb-1.5">
                {p.isAuto ? (
                  <span className="material-symbols-outlined text-[18px] text-muted">
                    brightness_auto
                  </span>
                ) : (
                  <span className="font-headline-sm text-sm font-medium text-ink">
                    Aa
                  </span>
                )}
              </div>
              <span
                className={`font-label-sm text-[11px] ${
                  isSelected ? 'font-semibold' : 'font-medium'
                } text-ink truncate`}
              >
                {p.label}
              </span>
              <span className="font-caption text-[10px] text-muted truncate">
                {p.subtitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
