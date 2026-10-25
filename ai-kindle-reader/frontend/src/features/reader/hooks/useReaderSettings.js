'use client';

import { useState, useEffect } from 'react';
import { DEFAULT_READER_SETTINGS } from '../constants';
import { getReaderSettings, saveReaderSettings } from '@/lib/storage';

export function useReaderSettings() {
  const [readerSettings, setReaderSettings] = useState(DEFAULT_READER_SETTINGS);

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        const savedSettings = await getReaderSettings();
        if (!active) return;
        if (savedSettings) {
          setReaderSettings((prev) => ({
            ...prev,
            ...savedSettings,
          }));
        } else {
          const w = typeof window !== 'undefined' ? window.innerWidth : 1024;
          const defSize = w < 768 ? 18 : w < 1024 ? 19 : 20;
          setReaderSettings((prev) => ({
            ...prev,
            fontSize: defSize,
            lineHeight: '1.75',
            align: 'auto',
            typeface: 'literata',
            palette: 'paper',
            margins: 'normal',
            spread: 'auto',
          }));
        }
      } catch (err) {
        console.warn('[useReaderSettings] Settings load error:', err);
      }
    }
    loadSettings();
    return () => {
      active = false;
    };
  }, []);

  const handleSettingsChange = (newSettings) => {
    setReaderSettings(newSettings);
    saveReaderSettings(newSettings);
  };

  return { readerSettings, setReaderSettings, handleSettingsChange };
}
