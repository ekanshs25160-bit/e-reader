'use client';

import { TYPEFACES } from '../constants';

export default function TextSettingsTab({ current, update }) {
  const currentTypefaceId = current.typeface || current.fontFamily || 'literata';
  const activeTypeface =
    TYPEFACES.find((tf) => tf.id === currentTypefaceId) || TYPEFACES[0];
  const currentFontSize = Math.round(Number(current.fontSize) || 19);

  return (
    <div className="space-y-4">
      {/* 1. Typeface Selector */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span
            style={{ color: 'var(--reader-muted)' }}
            className="font-label-sm text-[11px] font-semibold tracking-wider uppercase"
          >
            Typeface
          </span>
          <span
            style={{ color: 'var(--reader-muted)' }}
            className="font-caption text-caption opacity-80"
          >
            {activeTypeface.category}
          </span>
        </div>

        {/* Typeface Chips Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TYPEFACES.map((tf) => {
            const isSelected = currentTypefaceId === tf.id;
            return (
              <button
                key={tf.id}
                type="button"
                onClick={() => update({ typeface: tf.id, fontFamily: tf.id })}
                style={
                  isSelected
                    ? {
                        backgroundColor: 'var(--reader-fg)',
                        color: 'var(--reader-bg)',
                        borderColor: 'var(--reader-fg)',
                      }
                    : {
                        borderColor: 'var(--reader-border)',
                        backgroundColor: 'rgba(128, 128, 128, 0.06)',
                        color: 'var(--reader-fg)',
                      }
                }
                className="py-2 px-2.5 rounded-xl flex items-center border active:scale-95 transition-all text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none justify-between shadow-xs"
              >
                <span
                  className="text-[13px] font-medium leading-none truncate"
                  style={{ fontFamily: tf.family }}
                >
                  {tf.label}
                </span>
                {isSelected && (
                  <span
                    className="material-symbols-outlined text-[15px] ml-1 shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Editorial Font Caption */}
        <p
          style={{ color: 'var(--reader-muted)' }}
          className="font-caption text-[11px] italic pt-0.5 text-center opacity-80"
        >
          {activeTypeface.caption}
        </p>
      </div>

      {/* 2. Font Size Slider */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span
            style={{ color: 'var(--reader-muted)' }}
            className="font-label-sm text-[11px] font-semibold tracking-wider uppercase"
          >
            Size
          </span>
          <span
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.08)',
              borderColor: 'var(--reader-border)',
              color: 'var(--reader-fg)',
            }}
            className="px-2 py-0.5 rounded-full font-label-sm text-caption font-semibold border"
          >
            {currentFontSize}px
          </span>
        </div>
        <div
          style={{
            backgroundColor: 'rgba(128, 128, 128, 0.06)',
            borderColor: 'var(--reader-border)',
          }}
          className="flex items-center space-x-3 p-2.5 rounded-xl border"
        >
          {/* Small 'A' Indicator */}
          <button
            type="button"
            aria-label="Decrease font size"
            onClick={() => update({ fontSize: Math.max(14, currentFontSize - 1) })}
            style={{ color: 'var(--reader-muted)' }}
            className="font-headline-sm text-[13px] font-medium select-none pl-1 transition-colors hover:opacity-80 active:scale-95"
          >
            A
          </button>
          {/* Horizontal Range Slider */}
          <div className="relative flex-1 flex items-center">
            <input
              aria-label="Font size"
              className="w-full custom-range"
              max="28"
              min="14"
              step="1"
              type="range"
              value={currentFontSize}
              onChange={(e) => update({ fontSize: Number(e.target.value) })}
            />
          </div>
          {/* Large 'A' Indicator */}
          <button
            type="button"
            aria-label="Increase font size"
            onClick={() => update({ fontSize: Math.min(28, currentFontSize + 1) })}
            style={{ color: 'var(--reader-fg)' }}
            className="font-headline-sm text-[20px] font-medium select-none pr-1 transition-colors hover:opacity-80 active:scale-95"
          >
            A
          </button>
        </div>
      </div>
    </div>
  );
}
