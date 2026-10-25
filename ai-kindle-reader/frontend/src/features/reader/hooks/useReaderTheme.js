'use client';

import { useState, useEffect } from 'react';
import { READER_PALETTES } from '../constants';
import { useTheme } from '@/components/common/ThemeProvider';

export function useReaderTheme(readerSettings) {
  const { themeMode, palette: appPalette } = useTheme();
  const [isSysDark, setIsSysDark] = useState(false);
  const [isShortLandscape, setIsShortLandscape] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    setIsSysDark(mq.matches);
    const handler = (e) => setIsSysDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(orientation: landscape) and (max-height: 500px)');
    setIsShortLandscape(mq.matches);
    const handler = (e) => setIsShortLandscape(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const chosenPalette = themeMode || readerSettings?.palette || readerSettings?.theme || 'paper';
  const effectivePaletteId =
    appPalette || (chosenPalette === 'auto' ? (isSysDark ? 'night' : 'paper') : chosenPalette);
  const currentPalette = READER_PALETTES[effectivePaletteId] || READER_PALETTES.paper;

  return { currentPalette, isShortLandscape, isSysDark, effectivePaletteId };
}
