'use client';

import { useState } from 'react';

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
];

export default function SettingsMenu({
  open = true,
  onClose,
  settings,
  onChangeSettings,
}) {
  const [activeTab, setActiveTab] = useState('TEXT');

  const current = settings || {
    palette: 'paper',
    theme: 'paper',
    fontSize: 18,
    typeface: 'literata',
    fontFamily: 'literata',
    align: 'justify',
    textAlign: 'justify',
    lineHeight: '1.75',
    margins: 'normal',
    ambientSound: 'off',
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

  const currentAlign = current.align || current.textAlign || 'justify';
  const currentLineHeight = String(current.lineHeight || '1.75');
  const currentFontSize = Math.round(Number(current.fontSize) || 18);

  return (
    <>
      {/* 1. Soft Translucent Backdrop Overlay / Scrim */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300"
      />

      {/* 2. Slide-Up Bottom Sheet */}
      <section className="fixed bottom-0 inset-x-0 sm:max-w-md sm:mx-auto z-50 flex flex-col bg-surface-container-low text-on-surface rounded-t-3xl border-t border-black/[0.08] shadow-[0_-12px_40px_rgba(21,42,65,0.18)] max-h-[58%] overflow-hidden select-none">
        {/* Header: Center Tactile Drag Bar & Close Button */}
        <header className="relative pt-3 pb-2 flex items-center justify-between px-5">
          <div className="w-6" />
          <div className="w-10 h-1 bg-[#C4C6CD] rounded-full hover:bg-outline transition-colors" />
          <button
            aria-label="Close settings"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-90"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </header>

        {/* Scrollable Settings Container */}
        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-5 space-y-4">
          {/* 3. Top Segmented Tabs */}
          <div className="p-1 rounded-full bg-surface-container-highest/65 border border-outline-variant/30 flex items-center shadow-inner">
            {['TEXT', 'PAGE', 'AMBIENT'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 px-3 rounded-full font-label-md text-label-md transition-all duration-150 text-center font-medium ${
                  activeTab === tab
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* 4. Theme Palette Switcher */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                Palette
              </span>
              <span className="font-caption text-caption text-secondary font-medium">
                {activePalette.subtitle}
              </span>
            </div>
            {/* Row of 4 Tactile Palette Cards */}
            <div className="grid grid-cols-4 gap-2.5 pt-0.5">
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
                    } active:scale-95 transition-all text-left group`}
                  >
                    <div
                      className={`w-full h-8 rounded-lg ${p.chipBg} border border-black/[0.05] flex items-center justify-center mb-1.5`}
                    >
                      <span className={`font-headline-sm text-sm font-medium ${p.chipText}`}>
                        Aa
                      </span>
                    </div>
                    <span
                      className={`font-label-sm text-[11px] ${
                        isSelected ? 'font-semibold text-primary' : 'font-medium'
                      } ${p.labelClass} truncate`}
                    >
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab 1: TEXT Settings */}
          {activeTab === 'TEXT' && (
            <>
              {/* 5. Font Size Slider */}
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
                    onClick={() => update({ fontSize: Math.max(14, currentFontSize - 1) })}
                    className="font-headline-sm text-[13px] text-on-surface-variant hover:text-primary font-medium select-none pl-1 transition-colors"
                  >
                    A
                  </button>
                  {/* Horizontal Step Slider */}
                  <div className="relative flex-1 flex items-center">
                    <input
                      aria-label="Font size"
                      className="w-full custom-range"
                      max="24"
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
                    onClick={() => update({ fontSize: Math.min(24, currentFontSize + 1) })}
                    className="font-headline-sm text-[20px] text-primary font-medium select-none pr-1 transition-colors"
                  >
                    A
                  </button>
                </div>
              </div>

              {/* 6. Typeface Selector */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                    Typeface
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    {activeTypeface.category}
                  </span>
                </div>
                {/* Typeface Pill Cluster */}
                <div className="grid grid-cols-3 gap-2">
                  {TYPEFACES.map((tf) => {
                    const isSelected = currentTypefaceId === tf.id;
                    return (
                      <button
                        key={tf.id}
                        type="button"
                        onClick={() => update({ typeface: tf.id, fontFamily: tf.id })}
                        className={`py-2 px-2.5 rounded-xl ${
                          isSelected
                            ? 'bg-primary text-on-primary border border-primary justify-between shadow-sm'
                            : 'bg-surface-container-highest/60 hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 justify-center'
                        } flex items-center active:scale-95 transition-all text-left`}
                      >
                        <span
                          className={`text-[13px] font-medium leading-none truncate ${
                            isSelected ? '' : 'text-on-surface-variant'
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
            </>
          )}

          {/* Tab 2: PAGE Settings */}
          {activeTab === 'PAGE' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Page Margins
                </span>
                <span className="font-caption text-caption text-secondary capitalize">
                  {current.margins || 'normal'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'compact', label: 'Compact' },
                  { id: 'normal', label: 'Normal' },
                  { id: 'wide', label: 'Wide' },
                ].map((m) => {
                  const isSelected = (current.margins || 'normal') === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => update({ margins: m.id })}
                      className={`py-2 px-3 rounded-xl font-label-md text-label-md border transition-all ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary shadow-sm'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                      }`}
                    >
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 3: AMBIENT Settings */}
          {activeTab === 'AMBIENT' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Sanctuary Atmosphere
                </span>
                <span className="font-caption text-caption text-secondary capitalize">
                  {current.ambientSound || 'Silent Sanctuary'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'off', label: 'Silent Sanctuary', icon: 'volume_off' },
                  { id: 'rain', label: 'Soft Rain on Glass', icon: 'rainy' },
                  { id: 'hearth', label: 'Library Hearth', icon: 'local_fire_department' },
                  { id: 'tides', label: 'Piranesi Tides', icon: 'waves' },
                ].map((s) => {
                  const isSelected = (current.ambientSound || 'off') === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => update({ ambientSound: s.id })}
                      className={`p-2.5 rounded-xl flex items-center gap-2 font-label-md text-label-md border transition-all ${
                        isSelected
                          ? 'bg-primary text-on-primary border-primary shadow-sm'
                          : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                      <span className="truncate">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 7. Docked Micro Controls (Alignment & Line Height) */}
          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
            {/* Text Alignment Group */}
            <div className="flex items-center space-x-1 bg-surface-container/70 p-1 rounded-lg border border-outline-variant/20">
              {[
                { id: 'left', icon: 'format_align_left', label: 'Align left' },
                { id: 'justify', icon: 'format_align_justify', label: 'Justify text' },
                { id: 'center', icon: 'format_align_center', label: 'Align center' },
              ].map((a) => {
                const isSelected = currentAlign === a.id;
                return (
                  <button
                    key={a.id}
                    aria-label={a.label}
                    type="button"
                    onClick={() => update({ align: a.id, textAlign: a.id })}
                    className={`p-1 rounded transition-transform active:scale-90 ${
                      isSelected
                        ? 'bg-surface-container-highest text-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-primary'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                  </button>
                );
              })}
            </div>

            {/* Line Spacing Group */}
            <div className="flex items-center space-x-1 bg-surface-container/70 p-1 rounded-lg border border-outline-variant/20">
              {['1.4', '1.75', '2.0'].map((lh) => {
                const isSelected = currentLineHeight === lh;
                return (
                  <button
                    key={lh}
                    type="button"
                    onClick={() => update({ lineHeight: lh })}
                    className={`px-2 py-0.5 rounded text-caption transition-all active:scale-90 ${
                      isSelected
                        ? 'bg-surface-container-highest text-primary font-semibold shadow-xs'
                        : 'text-on-surface-variant hover:text-primary font-medium'
                    }`}
                  >
                    {lh}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export { PALETTES, TYPEFACES };
