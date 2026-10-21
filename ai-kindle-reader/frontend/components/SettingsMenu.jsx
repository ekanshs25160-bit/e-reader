'use client';

import { useState } from 'react';

const PALETTES = [
  {
    id: 'paper',
    label: 'Paper Day',
    cardBg: 'bg-[#FDFBF7]',
    chipBg: 'bg-[#FAF8F5]',
    chipText: 'text-[#111111]',
    labelClass: 'text-primary',
    readerBg: '#FAF8F5',
    readerText: '#1E1C1A',
  },
  {
    id: 'sepia',
    label: 'Sepia',
    cardBg: 'bg-[#F4ECD8]',
    chipBg: 'bg-[#EFE4CB]',
    chipText: 'text-[#2C2214]',
    labelClass: 'text-[#5B472C]',
    readerBg: '#F4ECD8',
    readerText: '#2C2214',
  },
  {
    id: 'night',
    label: 'Night',
    cardBg: 'bg-[#141824]',
    chipBg: 'bg-[#1B2132]',
    chipText: 'text-[#EAEAEA]',
    labelClass: 'text-[#9EABBD]',
    readerBg: '#141824',
    readerText: '#E6E4DD',
  },
  {
    id: 'oled',
    label: 'OLED',
    cardBg: 'bg-[#000000]',
    chipBg: 'bg-[#101010]',
    chipText: 'text-[#A0A0A0]',
    labelClass: 'text-[#7A7A7A]',
    readerBg: '#050505',
    readerText: '#CFCFCF',
  },
];

const TYPEFACES = [
  { id: 'literata', label: 'Literata', family: "'Literata Variable', 'Literata', serif" },
  { id: 'garamond', label: 'Garamond', family: "'EB Garamond', Georgia, serif" },
  { id: 'source-serif', label: 'Source Serif', family: "'Source Serif 4', Georgia, serif" },
  { id: 'newsreader', label: 'Newsreader', family: "'Newsreader Variable', 'Newsreader', serif" },
  { id: 'lora', label: 'Lora', family: "'Lora', Georgia, serif" },
  { id: 'inter', label: 'Inter (Sans)', family: "'Inter Variable', 'Inter', sans-serif" },
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
    fontSize: 18.5,
    typeface: 'literata',
    align: 'justify',
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

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[2px] transition-opacity duration-300"
      />
      <section className="fixed bottom-0 inset-x-0 md:inset-x-auto md:right-0 md:top-0 md:w-[400px] md:max-h-full md:h-full md:rounded-t-none md:rounded-l-3xl z-50 flex flex-col bg-surface-container-low text-on-surface rounded-t-3xl border-t border-black/[0.08] shadow-[0_-12px_40px_rgba(21,42,65,0.18)] max-h-[64%] overflow-hidden">
        <header className="relative pt-3 pb-2 flex items-center justify-between px-5">
          <div className="w-6"></div>
          <div className="w-10 h-1 bg-[#C4C6CD] rounded-full hover:bg-outline transition-colors md:hidden"></div>
          <button
            aria-label="Close settings"
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant/80 hover:text-on-surface hover:bg-surface-container-highest transition-colors active:scale-90"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto hide-scrollbar px-5 pb-5 space-y-4">
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                Palette
              </span>
              <span className="font-caption text-caption text-secondary font-medium">
                {PALETTES.find((p) => p.id === current.palette)?.label || 'Natural Warmth'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2.5 pt-0.5">
              {PALETTES.map((p) => {
                const selected = current.palette === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => update({ palette: p.id })}
                    className={`flex flex-col items-center p-2 rounded-xl ${p.cardBg} ${
                      selected
                        ? 'border-2 border-primary shadow-sm'
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
                        selected ? 'font-semibold text-primary' : 'font-medium'
                      } ${p.labelClass} truncate`}
                    >
                      {p.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'TEXT' && (
            <>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                    Size
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-container font-label-sm text-caption text-primary font-semibold border border-outline-variant/30">
                    {Math.round(current.fontSize)}px
                  </span>
                </div>
                <div className="flex items-center space-x-3 bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/20">
                  <button
                    type="button"
                    onClick={() => update({ fontSize: Math.max(14, current.fontSize - 1) })}
                    className="font-headline-sm text-[13px] text-on-surface-variant hover:text-primary font-medium select-none pl-1"
                  >
                    A
                  </button>
                  <div className="relative flex-1 flex items-center">
                    <input
                      aria-label="Font size"
                      className="w-full custom-range"
                      max="24"
                      min="14"
                      step="1"
                      type="range"
                      value={current.fontSize}
                      onChange={(e) => update({ fontSize: Number(e.target.value) })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => update({ fontSize: Math.min(24, current.fontSize + 1) })}
                    className="font-headline-sm text-[20px] text-primary font-medium select-none pr-1"
                  >
                    A
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                    Typeface
                  </span>
                  <span className="font-caption text-caption text-on-surface-variant">
                    Editorial Serif
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {TYPEFACES.map((tf) => {
                    const selected = current.typeface === tf.id;
                    return (
                      <button
                        key={tf.id}
                        type="button"
                        onClick={() => update({ typeface: tf.id })}
                        className={`py-2 px-2.5 rounded-xl ${
                          selected
                            ? 'bg-primary text-on-primary border border-primary justify-between shadow-sm'
                            : 'bg-surface-container-highest/60 hover:bg-surface-container-highest text-on-surface border border-outline-variant/30 justify-center'
                        } flex items-center active:scale-95 transition-all text-left`}
                      >
                        <span
                          className={`text-[13px] font-medium leading-none truncate ${
                            selected ? '' : 'text-on-surface-variant'
                          }`}
                          style={{ fontFamily: tf.family }}
                        >
                          {tf.label}
                        </span>
                        {selected && (
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
                <p className="font-caption text-[11px] text-on-surface-variant/80 italic pt-0.5 text-center">
                  “The default. Drawn for screens, at every size.”
                </p>
              </div>
            </>
          )}

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
                {['compact', 'normal', 'wide'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => update({ margins: m })}
                    className={`py-2 px-3 rounded-xl capitalize font-label-md text-label-md border transition-all ${
                      (current.margins || 'normal') === m
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'AMBIENT' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-[11px] font-semibold tracking-wider text-on-surface-variant uppercase">
                  Sanctuary Atmosphere
                </span>
                <span className="font-caption text-caption text-secondary capitalize">
                  {current.ambientSound || 'Quiet Study'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'off', label: 'Silent Sanctuary', icon: 'volume_off' },
                  { id: 'rain', label: 'Soft Rain on Glass', icon: 'rainy' },
                  { id: 'hearth', label: 'Library Hearth', icon: 'local_fire_department' },
                  { id: 'tides', label: 'Piranesi Tides', icon: 'waves' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update({ ambientSound: s.id })}
                    className={`p-2.5 rounded-xl flex items-center gap-2 font-label-md text-label-md border transition-all ${
                      (current.ambientSound || 'off') === s.id
                        ? 'bg-primary text-on-primary border-primary shadow-sm'
                        : 'bg-surface-container text-on-surface-variant border-outline-variant/30'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
            <div className="flex items-center space-x-1 bg-surface-container/70 p-1 rounded-lg border border-outline-variant/20">
              {[
                { id: 'left', icon: 'format_align_left', label: 'Align left' },
                { id: 'justify', icon: 'format_align_justify', label: 'Justify text' },
                { id: 'center', icon: 'format_align_center', label: 'Align center' },
              ].map((a) => (
                <button
                  key={a.id}
                  aria-label={a.label}
                  type="button"
                  onClick={() => update({ align: a.id })}
                  className={`p-1 rounded transition-transform active:scale-90 ${
                    current.align === a.id
                      ? 'bg-surface-container-highest text-primary shadow-xs'
                      : 'text-on-surface-variant hover:text-primary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{a.icon}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-1 bg-surface-container/70 p-1 rounded-lg border border-outline-variant/20">
              {['1.4', '1.75', '2.0'].map((lh) => (
                <button
                  key={lh}
                  type="button"
                  onClick={() => update({ lineHeight: lh })}
                  className={`px-2 py-0.5 rounded text-caption transition-all active:scale-90 ${
                    current.lineHeight === lh
                      ? 'bg-surface-container-highest text-primary font-semibold shadow-xs'
                      : 'text-on-surface-variant hover:text-primary font-medium'
                  }`}
                >
                  {lh}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export { PALETTES, TYPEFACES };
