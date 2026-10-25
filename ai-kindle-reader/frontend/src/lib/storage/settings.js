import { isBrowser, settingsStore, recordWriteTimestamp } from './db';

export async function getReaderSettings() {
  if (!isBrowser || !settingsStore) return null;
  try {
    return await settingsStore.getItem('reader_settings');
  } catch {
    return null;
  }
}

export async function saveReaderSettings(settings) {
  if (!isBrowser || !settingsStore) return null;
  try {
    await settingsStore.setItem('reader_settings', settings);
    recordWriteTimestamp();
    return settings;
  } catch (err) {
    console.error('[KindleAIReader DB] Error saving reader settings:', err);
    return null;
  }
}

export async function getSettings() {
  return getReaderSettings();
}

export async function saveSettings(settings) {
  if (!isBrowser || !settingsStore) return null;
  try {
    const existing = (await settingsStore.getItem('reader_settings')) || {};
    const updated = { ...existing, ...settings };
    await settingsStore.setItem('reader_settings', updated);
    recordWriteTimestamp();
    return updated;
  } catch (err) {
    console.error('[KindleAIReader DB] Error saving settings:', err);
    return null;
  }
}
