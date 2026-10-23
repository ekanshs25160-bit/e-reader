'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Uploader from '@/components/Uploader';
import { settingsStore } from '@/utils/db';

const ThemeContext = createContext({
  themeMode: 'day',
  setThemeMode: () => {},
  toggleDayNight: () => {},
  isNight: false,
  userName: 'Reader',
  setUserName: () => {},
  userAvatar: null,
  setUserAvatar: () => {},
  resetPreferences: () => {},
  openImportModal: () => {},
  closeImportModal: () => {},
  showToast: () => {},
});

export function ThemeProvider({ children }) {
  const pathname = usePathname();
  const [themeMode, setThemeModeState] = useState('day'); // 'auto' | 'day' | 'night'
  const [systemDark, setSystemDark] = useState(false);
  const [userName, setUserNameState] = useState('Reader');
  const [userAvatar, setUserAvatarState] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let active = true;

    // 1. Initial synchronous check from localStorage
    try {
      const savedTheme = localStorage.getItem('flyleaf-theme');
      if (savedTheme === 'auto' || savedTheme === 'day' || savedTheme === 'night') {
        setThemeModeState(savedTheme);
      }
      const savedName = localStorage.getItem('flyleaf-user-name');
      if (savedName) {
        setUserNameState(savedName.trim() || 'Reader');
      }
      const savedAvatar = localStorage.getItem('flyleaf-user-avatar');
      if (savedAvatar) {
        setUserAvatarState(savedAvatar);
      }
    } catch {}

    // 2. Hydrate / sync from IndexedDB settingsStore if present
    if (settingsStore) {
      settingsStore.getItem('user_profile').then((profile) => {
        if (!active || !profile) return;
        if (profile.name) {
          setUserNameState(profile.name.trim() || 'Reader');
          try {
            localStorage.setItem('flyleaf-user-name', profile.name.trim());
          } catch {}
        }
        if (profile.avatar !== undefined) {
          setUserAvatarState(profile.avatar);
          try {
            if (profile.avatar) {
              localStorage.setItem('flyleaf-user-avatar', profile.avatar);
            } else {
              localStorage.removeItem('flyleaf-user-avatar');
            }
          } catch {}
        }
      }).catch(() => {});
    }

    // 3. System color scheme listener
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemDark(mq.matches);
      const handler = (e) => setSystemDark(e.matches);
      mq.addEventListener?.('change', handler);
      return () => {
        active = false;
        mq.removeEventListener?.('change', handler);
      };
    }

    return () => {
      active = false;
    };
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
    if (settingsStore) {
      settingsStore.getItem('reader_settings').then((cur) => {
        settingsStore.setItem('reader_settings', { ...(cur || {}), themeMode: mode });
      }).catch(() => {});
    }
  }, []);

  const toggleDayNight = useCallback(() => {
    setThemeMode(isNight ? 'day' : 'night');
  }, [isNight, setThemeMode]);

  const setUserName = useCallback((name) => {
    const trimmed = (name || '').trim() || 'Reader';
    setUserNameState(trimmed);
    try {
      localStorage.setItem('flyleaf-user-name', trimmed);
    } catch {}
    if (settingsStore) {
      settingsStore.getItem('user_profile').then((cur) => {
        settingsStore.setItem('user_profile', { ...(cur || {}), name: trimmed });
      }).catch(() => {});
    }
  }, []);

  const setUserAvatar = useCallback((dataUrlOrNull) => {
    setUserAvatarState(dataUrlOrNull);
    try {
      if (dataUrlOrNull) {
        localStorage.setItem('flyleaf-user-avatar', dataUrlOrNull);
      } else {
        localStorage.removeItem('flyleaf-user-avatar');
      }
    } catch {}
    if (settingsStore) {
      settingsStore.getItem('user_profile').then((cur) => {
        settingsStore.setItem('user_profile', { ...(cur || {}), avatar: dataUrlOrNull });
      }).catch(() => {});
    }
  }, []);

  const resetPreferences = useCallback(() => {
    setThemeModeState('day');
    setUserNameState('Reader');
    setUserAvatarState(null);
    try {
      localStorage.removeItem('flyleaf-theme');
      localStorage.removeItem('flyleaf-user-name');
      localStorage.removeItem('flyleaf-user-avatar');
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
        userAvatar,
        setUserAvatar,
        resetPreferences,
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
