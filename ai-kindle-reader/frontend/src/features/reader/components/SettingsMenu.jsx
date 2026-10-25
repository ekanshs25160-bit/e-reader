'use client';

import { useState, useEffect } from 'react';
import { PALETTES, TYPEFACES } from '../constants';
import AmbientSettingsTab from './AmbientSettingsTab';
import PageSettingsTab from './PageSettingsTab';
import TextSettingsTab from './TextSettingsTab';
import { useTheme } from '@/components/common/ThemeProvider';

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
  const handlePaletteSelect = (id) => {
    setThemeMode(id);
    update({ palette: id, theme: id });
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

  return (
    <aside
      aria-label="Appearance settings"
      style={{
        backgroundColor: 'var(--reader-bg)',
        borderColor: 'var(--reader-border)',
        color: 'var(--reader-fg)',
      }}
      className="fixed z-50 flex flex-col select-none overflow-hidden transition-all duration-300
        max-md:bottom-0 max-md:inset-x-0 max-md:h-[58dvh] max-md:max-h-[58dvh] max-md:rounded-t-3xl max-md:border-t max-md:shadow-[0_-12px_40px_rgba(21,42,65,0.18)]
        md:top-0 md:right-0 md:bottom-0 md:w-[380px] md:h-full md:rounded-l-3xl md:border-l md:shadow-2xl"
    >
      {/* Header */}
      <header className="relative pt-3 pb-2 flex items-center justify-between px-5 shrink-0">
        <div className="md:hidden w-6" />
        <div
          style={{ backgroundColor: 'var(--reader-border)' }}
          className="md:hidden w-10 h-1 rounded-full transition-colors"
        />
        <div className="hidden md:flex items-center gap-2">
          <span style={{ color: 'var(--reader-fg)' }} className="material-symbols-outlined text-[20px]">
            tune
          </span>
          <h2 style={{ color: 'var(--reader-fg)' }} className="font-headline-sm text-sm font-semibold tracking-tight">
            Appearance
          </h2>
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
        {activeTab === 'TEXT' && <TextSettingsTab current={current} update={update} />}
        {activeTab === 'PAGE' && (
          <PageSettingsTab current={current} update={update} canOfferTwoPages={canOfferTwoPages} />
        )}
        {activeTab === 'AMBIENT' && (
          <AmbientSettingsTab
            currentPaletteId={currentPaletteId}
            activePalette={activePalette}
            handlePaletteSelect={handlePaletteSelect}
          />
        )}
      </div>
    </aside>
  );
}

export { PALETTES, TYPEFACES };
