'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/common/ThemeProvider';

const PALETTES = [
  { id: 'paper', label: 'Paper', subtitle: 'Natural Warmth', isDark: false },
  { id: 'sepia', label: 'Sepia', subtitle: 'Warm Parchment', isDark: false },
  { id: 'night', label: 'Night', subtitle: 'Deep Charcoal', isDark: true },
  { id: 'oled', label: 'OLED', subtitle: 'Pitch Black', isDark: true },
  { id: 'auto', label: 'Auto', subtitle: 'Follow System', isDark: false, isAuto: true },
];

const TYPEFACES = [
  {
    id: 'literata',
    label: 'Literata',
    family: "'Literata', serif",
    category: 'Editorial Serif',
    caption: '“The default. Drawn for screens, at every size.”',
  },
  {
    id: 'garamond',
    label: 'Garamond',
    family: "'EB Garamond', serif",
    category: 'Classic Renaissance',
    caption: '“Classic renaissance proportions, refined and poetic.”',
  },
  {
    id: 'source-serif',
    label: 'Source Serif',
    family: "'Source Serif 4', serif",
    category: 'Contemporary Book',
    caption: '“Rationalized forms optimized for long-form reading.”',
  },
  {
    id: 'newsreader',
    label: 'Newsreader',
    family: "'Newsreader', serif",
    category: 'Continuous Editorial',
    caption: '“Designed specifically for continuous on-screen text.”',
  },
  {
    id: 'lora',
    label: 'Lora',
    family: "'Lora', serif",
    category: 'Calligraphic Serif',
    caption: '“Contemporary serif with brushed, calligraphic curves.”',
  },
  {
    id: 'inter',
    label: 'Inter',
    family: "'Inter', sans-serif",
    category: 'Modern Sans',
    caption: '“Neutral, highly legible modern sans-serif.”',
  },
  {
    id: 'opendyslexic',
    label: 'OpenDyslexic',
    family: "'OpenDyslexic', sans-serif",
    category: 'Specialized Legibility',
    caption: '“Weighted bottoms to prevent letter inversion and confusion.”',
  },
];

const MARGIN_STEPS = ['narrow', 'normal', 'wide'];

export default function SettingsMenu({
  open = true,
  onClose,
  settings,
  onChangeSettings,
}) {
  const [activeTab, setActiveTab] = useState('TEXT');
  const [canOfferTwoPages, setCanOfferTwoPages] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(min-width: 1100px) and (orientation: landscape)');
    setCanOfferTwoPages(mq.matches);
    const handler = (e) => setCanOfferTwoPages(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const current = settings || {
    palette: 'paper',
    theme: 'paper',
    fontSize: 19,
    typeface: 'literata',
    fontFamily: 'literata',
    align: 'justify',
    lineHeight: '1.75',
    margins: 'normal',
    spread: 'auto',
  };

  const { setThemeMode } = useTheme();
  const handlePaletteSelect = (id) => { setThemeMode(id); update({ palette: id, theme: id }); };

  const update = (patch) => {
    if (onChangeSettings) {
      onChangeSettings({ ...current, ...patch });
    }
  };

  if (!open) return null;

  const currentPaletteId = current.palette || current.theme || 'paper';
  const activePalette =
    PALETTES.find((p) => p.id === currentPaletteId) || PALETTES[0];

  const currentTypefaceId = current.typeface || current.fontFamily || 'literata';
  const activeTypeface =
    TYPEFACES.find((tf) => tf.id === currentTypefaceId) || TYPEFACES[0];

  const currentAlign = current.align || current.textAlign || 'justify';
  const currentLineHeight = String(current.lineHeight || '1.75');
  const currentFontSize = Math.round(Number(current.fontSize) || 19);

  const rawMargins = current.margins === 'compact' ? 'narrow' : current.margins || 'normal';
  const marginStepIndex = Math.max(0, MARGIN_STEPS.indexOf(rawMargins));

  const currentSpread = current.spread || 'auto';

  return (
    <aside
      aria-label="Appearance settings"
      style={{
        backgroundColor: 'var(--reader-bg)',
        borderColor: 'var(--reader-border)',
        color: 'var(--reader-fg)',
      }}
      className="fixed z-50 flex flex-col select-none overflow-hidden transition-all duration-300
        /* Phone: docked bottom sheet (rounded-t-3xl, up to 58% height) */
        max-md:bottom-0 max-md:inset-x-0 max-md:h-[58dvh] max-md:max-h-[58dvh] max-md:rounded-t-3xl max-md:border-t max-md:shadow-[0_-12px_40px_rgba(21,42,65,0.18)]
        /* Tablet & Desktop: right-docked panel 380px wide, rounded-l-3xl */
        md:top-0 md:right-0 md:bottom-0 md:w-[380px] md:h-full md:rounded-l-3xl md:border-l md:shadow-2xl"
    >
      {/* Header */}
      <header className="relative pt-3 pb-2 flex items-center justify-between px-5 shrink-0">
        {/* On mobile: Tactile smooth center drag bar. On desktop: Appearance title */}
        <div className="md:hidden w-6" />
        <div
          style={{ backgroundColor: 'var(--reader-border)' }}
          className="md:hidden w-10 h-1 rounded-full transition-colors"
        />
        <div className="hidden md:flex items-center gap-2">
          <span style={{ color: 'var(--reader-fg)' }} className="material-symbols-outlined text-[20px]">tune</span>
          <h2 style={{ color: 'var(--reader-fg)' }} className="font-headline-sm text-sm font-semibold tracking-tight">Appearance</h2>
        </div>

        {/* Close Button */}
        <button
          aria-label="Close appearance settings"
          title="Close appearance settings"
          onClick={onClose}
          style={{ color: 'var(--reader-muted)' }}
          className="w-7 h-7 rounded-full flex items-center justify-center hover:opacity-80 transition-colors active:scale-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </header>

      {/* Top Segmented Tabs: TEXT / PAGE / AMBIENT */}
      <div className="px-5 pt-1 pb-3 shrink-0">
        <div
          style={{
            borderColor: 'var(--reader-border)',
            backgroundColor: 'rgba(128, 128, 128, 0.08)',
          }}
          className="p-1 rounded-full border flex items-center shadow-inner"
        >
          {['TEXT', 'PAGE', 'AMBIENT'].map((tab) => {
            const isTabActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={
                  isTabActive
                    ? {
                        backgroundColor: 'var(--reader-fg)',
                        color: 'var(--reader-bg)',
                      }
                    : {
                        color: 'var(--reader-muted)',
                      }
                }
                className="flex-1 py-1.5 px-3 rounded-full font-label-md text-label-md transition-all duration-150 text-center font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shadow-xs"
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Tab Content Container */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-5 space-y-4">
        {/* ============================================================ */}
        {/* TAB 1: TEXT                                                 */}
        {/* ============================================================ */}
        {activeTab === 'TEXT' && (
          <>
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
          </>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PAGE                                                 */}
        {/* ============================================================ */}
        {activeTab === 'PAGE' && (
          <div className="space-y-4 pt-1">
            {/* 1. Text Alignment */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span
                  style={{ color: 'var(--reader-muted)' }}
                  className="font-label-sm text-[11px] font-semibold tracking-wider uppercase"
                >
                  Alignment
                </span>
                <span
                  style={{ color: 'var(--reader-accent)' }}
                  className="font-caption text-caption capitalize font-medium"
                >
                  {currentAlign}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'left', icon: 'format_align_left', label: 'Left' },
                  { id: 'justify', icon: 'format_align_justify', label: 'Justify' },
                  { id: 'center', icon: 'format_align_center', label: 'Center' },
                ].map((a) => {
                  const isSelected = currentAlign === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => update({ align: a.id, textAlign: a.id })}
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
                              color: 'var(--reader-muted)',
                            }
                      }
                      className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs border transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                      <span>{a.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Line Height */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span
                  style={{ color: 'var(--reader-muted)' }}
                  className="font-label-sm text-[11px] font-semibold tracking-wider uppercase"
                >
                  Line Height
                </span>
                <span
                  style={{ color: 'var(--reader-accent)' }}
                  className="font-caption text-caption font-medium"
                >
                  {currentLineHeight === '1.4'
                    ? 'Compact (1.4)'
                    : currentLineHeight === '2.0'
                    ? 'Spacious (2.0)'
                    : 'Standard (1.75)'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1.4', label: '1.4 · Compact' },
                  { id: '1.75', label: '1.75 · Standard' },
                  { id: '2.0', label: '2.0 · Spacious' },
                ].map((lh) => {
                  const isSelected =
                    currentLineHeight === lh.id ||
                    (lh.id === '1.75' && (currentLineHeight === '1.6' || !currentLineHeight));
                  return (
                    <button
                      key={lh.id}
                      type="button"
                      onClick={() => update({ lineHeight: lh.id })}
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
                              color: 'var(--reader-muted)',
                            }
                      }
                      className="py-2 px-2.5 rounded-xl font-label-md text-xs border transition-all active:scale-95 text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shadow-xs"
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
                <span
                  style={{ color: 'var(--reader-muted)' }}
                  className="font-label-sm text-[11px] font-semibold tracking-wider uppercase"
                >
                  Margins
                </span>
                <span
                  style={{ color: 'var(--reader-accent)' }}
                  className="font-caption text-caption capitalize font-medium"
                >
                  {rawMargins}
                </span>
              </div>
              <div
                style={{
                  backgroundColor: 'rgba(128, 128, 128, 0.06)',
                  borderColor: 'var(--reader-border)',
                }}
                className="p-3 rounded-xl border space-y-2"
              >
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
                        color:
                          marginStepIndex === idx
                            ? 'var(--reader-fg)'
                            : 'var(--reader-muted)',
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

            {/* 4. Page layout: Auto / Single / Two pages (two pages only offered at >= 1100px landscape) */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span
                  style={{ color: 'var(--reader-muted)' }}
                  className="font-label-sm text-[11px] font-semibold tracking-wider uppercase"
                >
                  Page Layout
                </span>
                <span
                  style={{ color: 'var(--reader-accent)' }}
                  className="font-caption text-caption capitalize font-medium"
                >
                  {currentSpread === 'auto'
                    ? 'Auto'
                    : currentSpread === 'two'
                    ? 'Two Pages'
                    : 'Single Page'}
                </span>
              </div>
              <div className={`grid ${canOfferTwoPages ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                <button
                  type="button"
                  onClick={() => update({ spread: 'auto' })}
                  style={
                    currentSpread === 'auto'
                      ? {
                          backgroundColor: 'var(--reader-fg)',
                          color: 'var(--reader-bg)',
                          borderColor: 'var(--reader-fg)',
                        }
                      : {
                          borderColor: 'var(--reader-border)',
                          backgroundColor: 'rgba(128, 128, 128, 0.06)',
                          color: 'var(--reader-muted)',
                        }
                  }
                  className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs border transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">auto_mode</span>
                  <span>Auto</span>
                </button>
                <button
                  type="button"
                  onClick={() => update({ spread: 'none' })}
                  style={
                    currentSpread === 'none'
                      ? {
                          backgroundColor: 'var(--reader-fg)',
                          color: 'var(--reader-bg)',
                          borderColor: 'var(--reader-fg)',
                        }
                      : {
                          borderColor: 'var(--reader-border)',
                          backgroundColor: 'rgba(128, 128, 128, 0.06)',
                          color: 'var(--reader-muted)',
                        }
                  }
                  className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs border transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">crop_portrait</span>
                  <span>Single</span>
                </button>
                {canOfferTwoPages && (
                  <button
                    type="button"
                    onClick={() => update({ spread: 'two' })}
                    style={
                      currentSpread === 'two'
                        ? {
                            backgroundColor: 'var(--reader-fg)',
                            color: 'var(--reader-bg)',
                            borderColor: 'var(--reader-fg)',
                          }
                        : {
                            borderColor: 'var(--reader-border)',
                            backgroundColor: 'rgba(128, 128, 128, 0.06)',
                            color: 'var(--reader-muted)',
                          }
                    }
                    className="py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs border transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                    <span>Two Pages</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: AMBIENT                                              */}
        {/* ============================================================ */}
        {activeTab === 'AMBIENT' && (
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
                    <div
                      className="w-full h-8 rounded-lg bg-surface-container border border-hairline flex items-center justify-center mb-1.5"
                    >
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
        )}
      </div>
    </aside>
  );
}

export { PALETTES, TYPEFACES };