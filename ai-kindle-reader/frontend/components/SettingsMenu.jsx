'use client';

import { useState, useEffect } from 'react';

const PALETTES = [
  {
    id: 'paper',
    label: 'Paper Day',
    subtitle: 'Natural Warmth',
    cardBg: 'bg-[#FDFBF7]',
    chipBg: 'bg-[#FAF8F5]',
    chipText: 'text-[#111111]',
    labelClass: 'text-primary',
    isDark: false,
    readerBg: '#faf9f6',
    readerText: '#1a1c1a',
  },
  {
    id: 'sepia',
    label: 'Sepia',
    subtitle: 'Warm Parchment',
    cardBg: 'bg-[#F4ECD8]',
    chipBg: 'bg-[#EFE4CB]',
    chipText: 'text-[#2C2214]',
    labelClass: 'text-[#5B472C]',
    isDark: false,
    readerBg: '#f4ecd8',
    readerText: '#2c2214',
  },
  {
    id: 'night',
    label: 'Night',
    subtitle: 'Deep Charcoal',
    cardBg: 'bg-[#141824]',
    chipBg: 'bg-[#1B2132]',
    chipText: 'text-[#EAEAEA]',
    labelClass: 'text-[#9EABBD]',
    isDark: true,
    readerBg: '#141824',
    readerText: '#e6e4dd',
  },
  {
    id: 'oled',
    label: 'OLED',
    subtitle: 'Pitch Black',
    cardBg: 'bg-[#000000]',
    chipBg: 'bg-[#101010]',
    chipText: 'text-[#A0A0A0]',
    labelClass: 'text-[#7A7A7A]',
    isDark: true,
    readerBg: '#000000',
    readerText: '#cfcfcf',
  },
  {
    id: 'auto',
    label: 'Auto',
    subtitle: 'Follow System',
    cardBg: 'bg-surface-container-high/80',
    chipBg: 'bg-surface-container-highest',
    chipText: 'text-on-surface',
    labelClass: 'text-primary',
    isDark: false,
    isAuto: true,
    readerBg: '#faf9f6',
    readerText: '#1a1c1a',
  },
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
    label: 'Inter (Sans)',
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
    const mq = window.matchMedia('(min-width: 1024px) and (orientation: landscape)');
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
    lineHeight: '1.6',
    margins: 'normal',
    spread: 'none',
  };

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

  const currentAlign = current.align || 'justify';
  const currentLineHeight = String(current.lineHeight || '1.75');
  const currentFontSize = Math.round(Number(current.fontSize) || 18.5);

  const rawMargins = current.margins === 'compact' ? 'narrow' : current.margins || 'normal';
  const marginStepIndex = Math.max(0, MARGIN_STEPS.indexOf(rawMargins));

  const currentSpread = current.spread || 'none';

  return (
    <aside
      aria-label="Appearance settings"
      className="fixed z-50 flex flex-col bg-surface-container-low text-on-surface border-outline-variant/30 select-none overflow-hidden transition-all duration-300
        /* Phone: docked bottom sheet (rounded-t-3xl, up to ~58% height) */
        max-md:bottom-0 max-md:inset-x-0 max-md:h-[58dvh] max-md:max-h-[58dvh] max-md:rounded-t-3xl max-md:border-t max-md:shadow-[0_-12px_40px_rgba(21,42,65,0.18)]
        /* Tablet & Desktop: docked right-hand side panel, 380px wide (full height, rounded-l-3xl, border-l) */
        md:top-0 md:right-0 md:bottom-0 md:w-[380px] md:h-full md:rounded-l-3xl md:border-l md:shadow-2xl"
    >
      {/* Header */}
      <header className="relative pt-3 pb-2 flex items-center justify-between px-5 shrink-0">
        {/* On mobile: Tactile smooth center drag bar. On desktop: Appearance title */}
        <div className="md:hidden w-6" />
        <div className="md:hidden w-10 h-1 bg-[#C4C6CD] rounded-full hover:bg-outline transition-colors" />
        <div className="hidden md:flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">tune</span>
          <h2 className="font-headline-sm text-sm font-semibold text-primary tracking-tight">Appearance</h2>
        </div>

        {/* Close Button */}
        <button
          aria-label="Close appearance settings"
          title="Close appearance settings"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          type="button"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </header>

      {/* Top Segmented Tabs: TEXT / PAGE / AMBIENT */}
      <div className="px-5 pt-1 pb-3 shrink-0">
        <div className="p-1 rounded-full bg-surface-container-highest/65 border border-outline-variant/30 flex items-center shadow-inner">
          {['TEXT', 'PAGE', 'AMBIENT'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-1.5 px-3 rounded-full font-label-md text-label-md transition-all duration-150 text-center font-medium focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                activeTab === tab
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              {tab}
            </button>
          ))}
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
                <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Typeface
                </span>
                <span className="font-caption text-caption text-on-surface-variant">
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
                      className={`py-2 px-2.5 rounded-xl flex items-center active:scale-95 transition-all text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                        isSelected
                          ? 'bg-primary text-on-primary border border-primary justify-between shadow-sm'
                          : 'bg-surface-container-highest/60 hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 justify-center'
                      }`}
                    >
                      <span
                        className={`text-[13px] font-medium leading-none truncate ${
                          isSelected ? 'text-on-primary' : 'text-on-surface-variant'
                        }`}
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
              <p className="font-caption text-[11px] text-on-surface-variant/80 italic pt-0.5 text-center">
                {activeTypeface.caption}
              </p>
            </div>

            {/* 2. Font Size Slider */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Size
                </span>
                <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-caption text-primary font-semibold border border-outline-variant/30">
                  {currentFontSize}px
                </span>
              </div>
              <div className="flex items-center space-x-3 bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/20">
                {/* Small 'A' Indicator */}
                <button
                  type="button"
                  aria-label="Decrease font size"
                  onClick={() => update({ fontSize: Math.max(14, currentFontSize - 1) })}
                  className="font-headline-sm text-[13px] text-on-surface-variant hover:text-primary font-medium select-none pl-1 transition-colors"
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
                  className="font-headline-sm text-[20px] text-primary font-medium select-none pr-1 transition-colors"
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
                <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Alignment
                </span>
                <span className="font-caption text-caption text-secondary capitalize">
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
                      className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-label-md text-xs border transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary shadow-sm'
                          : 'bg-surface-container/70 text-on-surface-variant hover:text-primary border-outline-variant/30'
                      }`}
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
                <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Line Height
                </span>
                <span className="font-caption text-caption text-secondary">
                  {currentLineHeight === '1.4' ? 'Compact' : currentLineHeight === '2.0' ? 'Spacious' : 'Standard'} ({currentLineHeight})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: '1.4', label: '1.4 · Compact' },
                  { id: '1.6', label: '1.6 · Standard' },
                  { id: '2.0', label: '2.0 · Spacious' },
                ].map((lh) => {
                  const isSelected =
                    currentLineHeight === lh.id ||
                    (lh.id === '1.6' && (currentLineHeight === '1.75' || !currentLineHeight));
                  return (
                    <button
                      key={lh.id}
                      type="button"
                      onClick={() => update({ lineHeight: lh.id })}
                      className={`py-2 px-2.5 rounded-xl font-label-md text-xs border transition-all active:scale-95 text-center focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                          : 'bg-surface-container/70 text-on-surface-variant hover:text-primary border-outline-variant/30'
                      }`}
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
                <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Margins
                </span>
                <span className="font-caption text-caption text-secondary capitalize">
                  {rawMargins}
                </span>
              </div>
              <div className="bg-surface-container/60 p-3 rounded-xl border border-outline-variant/20 space-y-2">
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
                <div className="flex justify-between text-caption font-label-sm text-on-surface-variant px-1">
                  {MARGIN_STEPS.map((m, idx) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => update({ margins: m })}
                      className={`capitalize transition-colors ${
                        marginStepIndex === idx ? 'text-primary font-bold' : 'hover:text-primary'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 4. Single page / Two pages (1024px+ landscape only) */}
            {canOfferTwoPages && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                    Page Columns
                  </span>
                  <span className="font-caption text-caption text-secondary">
                    {currentSpread === 'auto' ? 'Two Pages' : 'Single Page'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => update({ spread: 'none' })}
                    className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-label-md text-xs border transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      currentSpread !== 'auto'
                        ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                        : 'bg-surface-container/70 text-on-surface-variant hover:text-primary border-outline-variant/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">single_bed</span>
                    <span>Single Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => update({ spread: 'auto' })}
                    className={`py-2 px-3 rounded-xl flex items-center justify-center gap-2 font-label-md text-xs border transition-all active:scale-95 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                      currentSpread === 'auto'
                        ? 'bg-primary text-on-primary border-primary shadow-sm font-semibold'
                        : 'bg-surface-container/70 text-on-surface-variant hover:text-primary border-outline-variant/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                    <span>Two Pages</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: AMBIENT                                              */}
        {/* ============================================================ */}
        {activeTab === 'AMBIENT' && (
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                Palette
              </span>
              <span className="font-caption text-caption text-secondary font-medium">
                {activePalette.subtitle}
              </span>
            </div>

            {/* Row / Grid of Palette Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PALETTES.map((p) => {
                const isSelected = currentPaletteId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => update({ palette: p.id, theme: p.id })}
                    className={`flex flex-col items-center p-2 rounded-xl ${p.cardBg} ${
                      isSelected
                        ? 'border-2 border-primary shadow-sm'
                        : p.isDark
                        ? 'border border-white/10 hover:border-white/20'
                        : 'border border-black/10 hover:border-black/25'
                    } active:scale-95 transition-all text-left group focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`}
                  >
                    <div
                      className={`w-full h-8 rounded-lg ${p.chipBg} border border-black/[0.05] flex items-center justify-center mb-1.5`}
                    >
                      {p.isAuto ? (
                        <span className="material-symbols-outlined text-[18px] text-on-surface">
                          brightness_auto
                        </span>
                      ) : (
                        <span className={`font-headline-sm text-sm font-medium ${p.chipText}`}>
                          Aa
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-label-sm text-[11px] ${
                        isSelected ? 'font-semibold text-primary' : 'font-medium'
                      } ${p.labelClass} truncate`}
                    >
                      {p.label}
                    </span>
                    <span className="font-caption text-[10px] text-on-surface-variant/70 truncate">
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