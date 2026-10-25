'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { resizeAvatarTo256 } from '../lib/settings-helpers';
import { useVaultArchive } from './useVaultArchive';
import { useTheme } from '@/providers/ThemeProvider';
import { getVaultStorageSummary } from '@/lib/storage';

export function useSettingsState() {
  const router = useRouter();
  const {
    themeMode,
    setThemeMode,
    userName,
    setUserName,
    userAvatar,
    setUserAvatar,
    resetPreferences,
    showToast,
  } = useTheme();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  const [storageSummary, setStorageSummary] = useState({
    booksCount: 0,
    highlightsCount: 0,
    vocabularyCount: 0,
    storageFormatted: '0 MB',
    lastSavedFormatted: 'Loading…',
  });

  const avatarInputRef = useRef(null);

  const refreshStorageMetrics = useCallback(async () => {
    try {
      const summary = await getVaultStorageSummary();
      setStorageSummary(summary);
    } catch (err) {
      console.warn('Failed to load storage summary:', err);
    }
  }, []);

  useEffect(() => {
    refreshStorageMetrics();
  }, [refreshStorageMetrics]);

  useEffect(() => {
    setNameInput(userName);
  }, [userName]);

  const handleSaveName = (e) => {
    e?.preventDefault();
    const trimmed = nameInput.trim() || 'Reader';
    setUserName(trimmed);
    setEditingName(false);
    showToast(`Updated reader name to “${trimmed}”`);
  };

  const handleAvatarFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Processing avatar image…');
      const resizedDataUrl = await resizeAvatarTo256(file);
      setUserAvatar(resizedDataUrl);
      showToast('Profile avatar updated');
    } catch (err) {
      showToast('Failed to process image: ' + err.message);
    } finally {
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setUserAvatar(null);
    showToast('Removed custom avatar');
  };

  const vaultArchive = useVaultArchive({
    refreshStorageMetrics,
    showToast,
    router,
    resetPreferences,
  });

  return {
    themeMode,
    setThemeMode,
    userName,
    userAvatar,
    showToast,
    editingName,
    setEditingName,
    nameInput,
    setNameInput,
    handleSaveName,
    avatarInputRef,
    handleAvatarFileSelected,
    handleRemoveAvatar,
    storageSummary,
    refreshStorageMetrics,
    ...vaultArchive,
  };
}
