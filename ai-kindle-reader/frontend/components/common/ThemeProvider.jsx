'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Uploader from '@/components/Uploader';

const ThemeContext = createContext({
  themeMode: 'day',
  setThemeMode: () => {},
  toggleDayNight: () => {},
  isNight: false,
  userName: 'Ekansh',
  setUserName: () => {},
  openImportModal: () => {},
  closeImportModal: () => {},
  showToast: () => {},
});

export function ThemeProvider({ children }) {
  const pathname = usePathname();
  const [themeMode, setThemeModeState] = useState('day'); // 'auto' | 'day' | 'night'
  const [systemDark, setSystemDark] = useState(false);
  const [userName, setUserNameState] = useState('Ekansh');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('flyleaf-theme');
      if (savedTheme === 'auto' || savedTheme === 'day' || savedTheme === 'night') {
        setThemeModeState(savedTheme);
      }
      const savedName = localStorage.getItem('flyleaf-user-name');
      if (savedName) {
        setUserNameState(savedName);
      }
    } catch {}

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemDark(mq.matches);
      const handler = (e) => setSystemDark(e.matches);
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    }
  }, []);

  const isNight =
    themeMode === 'night' ||
    (themeMode === 'auto' && systemDark);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isNight);
    }
  }, [isNight]);

  const setThemeMode = useCallback((mode) => {
    setThemeModeState(mode);
    try {
      localStorage.setItem('flyleaf-theme', mode);
    } catch {}
  }, []);

  const toggleDayNight = useCallback(() => {
    setThemeMode(isNight ? 'day' : 'night');
  }, [isNight, setThemeMode]);

  const setUserName = useCallback((name) => {
    const trimmed = name.trim() || 'Ekansh';
    setUserNameState(trimmed);
    try {
      localStorage.setItem('flyleaf-user-name', trimmed);
    } catch {}
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    setTimeout(() => {
      setToast((prev) => (prev === message ? null : prev));
    }, 2800);
  }, []);

  const openImportModal = useCallback(() => setImportModalOpen(true), []);
  const closeImportModal = useCallback(() => setImportModalOpen(false), []);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        setThemeMode,
        toggleDayNight,
        isNight,
        userName,
        setUserName,
        openImportModal,
        closeImportModal,
        showToast,
      }}
    >
      {children}
      <Uploader
        open={importModalOpen}
        onClose={closeImportModal}
        onShowToast={showToast}
      />
      {toast && (
        <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-xl border border-outline-variant/30 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none">
          <span className="material-symbols-outlined text-[16px] text-secondary-fixed">
            auto_awesome
          </span>
          <span>{toast}</span>
        </div>
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
