'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SettingsMenu, { PALETTES, TYPEFACES } from '@/components/SettingsMenu';

export default function Page() {
  const router = useRouter();
  const [settings, setSettings] = useState({
    palette: 'paper',
    fontSize: 18,
    typeface: 'literata',
    align: 'justify',
    lineHeight: '1.75',
    margins: 'normal',
    ambientSound: 'off',
  });

  const activePalette = PALETTES.find((p) => p.id === settings.palette) || PALETTES[0];
  const activeTypeface = TYPEFACES.find((t) => t.id === settings.typeface) || TYPEFACES[0];

  return (
    <div className="min-h-dvh bg-background text-on-surface antialiased select-none font-body-ui">
      <div
        className="relative w-full h-dvh flex flex-col overflow-hidden transition-colors"
        style={{ backgroundColor: activePalette.readerBg, color: activePalette.readerText }}
      >
        <section className="relative w-full h-[52%] md:h-full md:pr-[420px] flex flex-col px-6 md:px-16 pt-3 overflow-hidden">
          <header className="relative z-10 flex items-center justify-between h-12 w-full">
            <button
              aria-label="Return to reader"
              onClick={() => router.push('/reader/pride-and-prejudice')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-surface-container/70 border border-black/[0.04] backdrop-blur-sm">
              <span className="font-headline-sm text-label-sm text-primary tracking-normal font-medium">
                Pride and Prejudice
              </span>
              <span className="text-outline-variant text-[9px]">•</span>
              <span className="font-caption text-caption text-on-surface-variant font-normal">
                Jane Austen
              </span>
            </div>
            <button
              aria-label="Add Bookmark"
              onClick={() => router.push('/reader/pride-and-prejudice')}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high/50 active:scale-95 transition-all"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">bookmark</span>
            </button>
          </header>

          <article className="flex-1 mt-4 overflow-hidden relative opacity-90 max-w-2xl mx-auto">
            <div className="text-center mb-5">
              <p className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
                Chapter I
              </p>
              <div className="w-6 h-[1px] bg-secondary/30 mx-auto mt-1.5"></div>
            </div>
            <div
              className="tracking-[0.005em] space-y-4"
              style={{
                fontFamily: activeTypeface.family,
                fontSize: `${settings.fontSize}px`,
                lineHeight: settings.lineHeight,
                textAlign: settings.align,
                color: activePalette.readerText,
              }}
            >
              <p>
                <span className="float-left text-[44px] leading-[40px] font-headline-lg font-normal pr-2 pt-1">
                  I
                </span>
                t is a truth universally acknowledged, that a single man in possession of a good
                fortune, must be in want of a wife.
              </p>
              <p>
                However little known the feelings or views of such a man may be on his first
                entering a neighbourhood, this truth is so well fixed in the minds of the
                surrounding families, that he is considered the rightful property of some one or
                other of their daughters.
              </p>
              <p className="opacity-80">
                “My dear Mr. Bennet,” said his lady to him one day, “have you heard that
                Netherfield Park is let at last?”
              </p>
            </div>
          </article>
        </section>

        <SettingsMenu
          open={true}
          onClose={() => router.push('/reader/pride-and-prejudice')}
          settings={settings}
          onChangeSettings={setSettings}
        />
      </div>
    </div>
  );
}
