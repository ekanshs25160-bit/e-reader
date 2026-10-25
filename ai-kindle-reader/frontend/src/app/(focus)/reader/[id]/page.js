'use client';

import { Suspense } from 'react';
import ReaderScreen from '@/features/reader';

export const READER_PALETTES = {
  paper: {
    name: 'Paper',
    bg: '#FAF9F6',
    fg: '#152A41',
    muted: '#43474D',
    border: 'rgba(21, 42, 65, 0.15)',
    accent: '#855224',
  },
  sepia: {
    name: 'Sepia',
    bg: '#F4ECD8',
    fg: '#2C2214',
    muted: '#5B472C',
    border: 'rgba(91, 71, 44, 0.20)',
    accent: '#7A491B',
  },
  night: {
    name: 'Night',
    bg: '#141824',
    fg: '#F0F2F5',
    muted: '#A0AEC0',
    border: 'rgba(255, 255, 255, 0.12)',
    accent: '#E2B170',
  },
  oled: {
    name: 'OLED',
    bg: '#000000',
    fg: '#EDEDED',
    muted: '#A0A0A0',
    border: 'rgba(255, 255, 255, 0.15)',
    accent: '#E2B170',
  },
};

export default function ReaderPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-surface flex items-center justify-center text-ink p-6">
          <div className="flex flex-col items-center gap-4 max-w-sm w-full">
            <div className="w-16 h-24 rounded-[4px] border border-hairline bg-hairline/25 animate-pulse mb-1" />
            <div className="w-36 h-3 bg-hairline/35 rounded-full animate-pulse" />
            <p className="font-sans text-[13px] text-muted font-normal mt-2">Opening volume…</p>
          </div>
        </div>
      }
    >
      <ReaderScreen />
    </Suspense>
  );
}
