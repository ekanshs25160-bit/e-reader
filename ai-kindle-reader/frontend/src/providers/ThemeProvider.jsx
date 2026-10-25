'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Uploader from '@/components/Uploader';
import FirstRunDialog from '@/components/FirstRunDialog';
import { settingsStore } from '@/utils/db';

const ThemeContext = createContext({
  themeMode: 'auto',
  palette: 'paper',
  resolvedPalette: 'paper',
  setPalette: () => {},
  setThemeMode: () => {},
  cycleTheme: () => {},
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

const THEME_CYCLE = ['auto', 'paper', 'sepia', 'night', 'oled'];

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState('paper');
  const [systemDark, setSystemDark] = useState(false);
  const [userName, setUserNameState] = useState('Reader');
  const [userAvatar, setUserAvatarState] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let active = true;

    try {
      const savedTheme = localStorage.getItem('flyleaf-theme');
      if (
        savedTheme === 'auto' ||
        savedTheme === 'day' ||
        savedTheme === 'night' ||
        savedTheme === 'paper' ||
        savedTheme === 'sepia' ||
        savedTheme === 'oled'
      ) {
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

    const handleStorage = (e) => {
      if (e.key === 'flyleaf-theme' && e.newValue) {
        setThemeModeState(e.newValue);
      }
    };
    const handleCustom = (e) => {
      if (e.detail?.theme) {
        setThemeModeState(e.detail.theme);
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('flyleaf-theme-change', handleCustom);

    let mq;
    let mqHandler;
    if (typeof window !== 'undefined' && window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
      setSystemDark(mq.matches);
      mqHandler = (e) => setSystemDark(e.matches);
      mq.addEventListener?.('change', mqHandler);
    }

    return () => {
      active = false;
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('flyleaf-theme-change', handleCustom);
      if (mq && mqHandler) {
        mq.removeEventListener?.('change', mqHandler);
      }
    };
  }, []);

  const resolvedPalette =
    themeMode === 'auto'
      ? (systemDark ? 'night' : 'paper')
      : themeMode === 'day'
      ? 'paper'
      : themeMode;

  const isNight = resolvedPalette === 'night' || resolvedPalette === 'oled';

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.documentElement;
    el.classList.remove('dark', 'night', 'sepia', 'oled', 'paper');

    if (resolvedPalette === 'night') {
      el.classList.add('dark', 'night');
      el.setAttribute('data-theme', 'night');
    } else if (resolvedPalette === 'oled') {
      el.classList.add('dark', 'oled');
      el.setAttribute('data-theme', 'oled');
    } else if (resolvedPalette === 'sepia') {
      el.classList.add('sepia');
      el.setAttribute('data-theme', 'sepia');
    } else {
      el.classList.add('paper');
      el.setAttribute('data-theme', 'paper');
    }
  }, [resolvedPalette]);

  const setPalette = useCallback((p) => {
    setThemeModeState(p);
    try {
      localStorage.setItem('flyleaf-theme', p);
    } catch {}
    if (settingsStore) {
      settingsStore.getItem('reader_settings').then((cur) => {
        settingsStore.setItem('reader_settings', { ...(cur || {}), themeMode: p, palette: p, theme: p });
      }).catch(() => {});
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('flyleaf-theme-change', { detail: { theme: p } }));
    }
  }, []);

  const setThemeMode = useCallback((mode) => {
    setPalette(mode);
  }, [setPalette]);

  const cycleTheme = useCallback(() => {
    setThemeModeState((cur) => {
      const idx = THEME_CYCLE.indexOf(cur);
      const next = THEME_CYCLE[(idx + 1) % THEME_CYCLE.length];
      try {
        localStorage.setItem('flyleaf-theme', next);
      } catch {}
      if (settingsStore) {
        settingsStore.getItem('reader_settings').then((s) => {
          settingsStore.setItem('reader_settings', { ...(s || {}), themeMode: next, palette: next, theme: next });
        }).catch(() => {});
      }
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('flyleaf-theme-change', { detail: { theme: next } }));
      }
      return next;
    });
  }, []);

  const toggleDayNight = useCallback(() => {
    setPalette(isNight ? 'paper' : 'night');
  }, [isNight, setPalette]);

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
        palette: resolvedPalette,
        resolvedPalette,
        setPalette,
        setThemeMode,
        cycleTheme,
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
      <FirstRunDialog />
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
