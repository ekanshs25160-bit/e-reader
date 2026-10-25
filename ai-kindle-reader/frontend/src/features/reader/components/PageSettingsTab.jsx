'use client';

import { MARGIN_STEPS } from '../constants';

const selectedBtnStyle = {
  backgroundColor: 'var(--reader-fg)',
  color: 'var(--reader-bg)',
  borderColor: 'var(--reader-fg)',
};
const unselectedBtnStyle = {
  borderColor: 'var(--reader-border)',
  backgroundColor: 'rgba(128, 128, 128, 0.06)',
  color: 'var(--reader-muted)',
};

export default function PageSettingsTab({ current, update, canOfferTwoPages }) {
  const currentAlign = current.align || current.textAlign || 'justify';
  const currentLineHeight = String(current.lineHeight || '1.75');
  const rawMargins = current.margins === 'compact' ? 'narrow' : current.margins || 'normal';
  const marginStepIndex = Math.max(0, MARGIN_STEPS.indexOf(rawMargins));
  const currentSpread = current.spread || 'auto';

  return (
    <div className="space-y-4 pt-1">
      {/* 1. Text Alignment */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--reader-muted)' }} className="font-label-sm text-[11px] font-semibold tracking-wider uppercase">
            Alignment
          </span>
          <span style={{ color: 'var(--reader-accent)' }} className="font-caption text-caption capitalize font-medium">
            {currentAlign}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'left', icon: 'format_align_left', label: 'Left' },
            { id: 'justify', icon: 'format_align_justify', label: 'Justify' },
            { id: 'center', icon: 'format_align_center', label: 'Center' },
          ].map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => update({ align: a.id, textAlign: a.id })}
              style={currentAlign === a.id ? selectedBtnStyle : unselectedBtnStyle}
              className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs border transition-all active:scale-95 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Line Height */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--reader-muted)' }} className="font-label-sm text-[11px] font-semibold tracking-wider uppercase">
            Line Height
          </span>
          <span style={{ color: 'var(--reader-accent)' }} className="font-caption text-caption font-medium">
            {currentLineHeight === '1.4' ? 'Compact (1.4)' : currentLineHeight === '2.0' ? 'Spacious (2.0)' : 'Standard (1.75)'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: '1.4', label: '1.4 · Compact' },
            { id: '1.75', label: '1.75 · Standard' },
            { id: '2.0', label: '2.0 · Spacious' },
          ].map((lh) => {
            const isSelected = currentLineHeight === lh.id || (lh.id === '1.75' && (currentLineHeight === '1.6' || !currentLineHeight));
            return (
              <button
                key={lh.id}
                type="button"
                onClick={() => update({ lineHeight: lh.id })}
                style={isSelected ? selectedBtnStyle : unselectedBtnStyle}
                className="py-2 px-2.5 rounded-xl font-label-md text-xs border transition-all active:scale-95 text-center shadow-xs"
              >
                {lh.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Page Margins (Stepped Slider) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--reader-muted)' }} className="font-label-sm text-[11px] font-semibold tracking-wider uppercase">
            Margins
          </span>
          <span style={{ color: 'var(--reader-accent)' }} className="font-caption text-caption capitalize font-medium">
            {rawMargins}
          </span>
        </div>
        <div style={{ backgroundColor: 'rgba(128, 128, 128, 0.06)', borderColor: 'var(--reader-border)' }} className="p-3 rounded-xl border space-y-2">
          <input
            aria-label="Margins stepped slider"
            type="range"
            min="0"
            max="2"
            step="1"
            value={marginStepIndex}
            onChange={(e) => update({ margins: MARGIN_STEPS[Number(e.target.value)] })}
            className="w-full custom-range"
          />
          <div className="flex justify-between text-caption font-label-sm px-1">
            {MARGIN_STEPS.map((m, idx) => (
              <button
                key={m}
                type="button"
                onClick={() => update({ margins: m })}
                style={{
                  color: marginStepIndex === idx ? 'var(--reader-fg)' : 'var(--reader-muted)',
                  fontWeight: marginStepIndex === idx ? 700 : 500,
                }}
                className="capitalize transition-colors hover:opacity-80"
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Page layout: Auto / Single / Two pages */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span style={{ color: 'var(--reader-muted)' }} className="font-label-sm text-[11px] font-semibold tracking-wider uppercase">
            Page Layout
          </span>
          <span style={{ color: 'var(--reader-accent)' }} className="font-caption text-caption capitalize font-medium">
            {currentSpread === 'auto' ? 'Auto' : currentSpread === 'two' ? 'Two Pages' : 'Single Page'}
          </span>
        </div>
        <div className={`grid ${canOfferTwoPages ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
          <button
            type="button"
            onClick={() => update({ spread: 'auto' })}
            style={currentSpread === 'auto' ? selectedBtnStyle : unselectedBtnStyle}
            className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs border transition-all active:scale-95 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">auto_mode</span>
            <span>Auto</span>
          </button>
          <button
            type="button"
            onClick={() => update({ spread: 'none' })}
            style={currentSpread === 'none' ? selectedBtnStyle : unselectedBtnStyle}
            className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs border transition-all active:scale-95 shadow-xs"
          >
            <span className="material-symbols-outlined text-[18px]">crop_portrait</span>
            <span>Single</span>
          </button>
          {canOfferTwoPages && (
            <button
              type="button"
              onClick={() => update({ spread: 'two' })}
              style={currentSpread === 'two' ? selectedBtnStyle : unselectedBtnStyle}
              className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs border transition-all active:scale-95 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">auto_stories</span>
              <span>Two Pages</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
