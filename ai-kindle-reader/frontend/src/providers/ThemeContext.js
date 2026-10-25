'use client';

import { createContext, useContext } from 'react';

export const THEME_CYCLE = ['auto', 'paper', 'sepia', 'night', 'oled'];

export const ThemeContext = createContext({
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

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
