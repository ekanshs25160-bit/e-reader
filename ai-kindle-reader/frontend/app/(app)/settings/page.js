'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import {
  exportVaultArchive,
  restoreVaultArchive,
  eraseEntireVault,
  getVaultStorageSummary,
  seedSampleReadingData,
  clearSeededReadingData,
} from '@/utils/db';
import { pluralize } from '@/lib/format';

function resizeAvatarTo256(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;
          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, 256, 256);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image file'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function getInitials(name) {
  const trimmed = String(name || '').trim();
  if (!trimmed) return 'R';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SettingsPage() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  // Name Editing State
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  // Storage and Telemetry Summary
  const [storageSummary, setStorageSummary] = useState({
    booksCount: 0,
    highlightsCount: 0,
    vocabularyCount: 0,
    storageFormatted: '0 MB',
    lastSavedFormatted: 'Loading...',
  });

  // Export / Backup State
  const [includeBinaries, setIncludeBinaries] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Restore Modal State
  const restoreInputRef = useRef(null);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Erase Modal State
  const [eraseModalOpen, setEraseModalOpen] = useState(false);
  const [eraseConfirmInput, setEraseConfirmInput] = useState('');
  const [isErasing, setIsErasing] = useState(false);

  // Avatar Input Ref
  const avatarInputRef = useRef(null);

  // Fetch real vault metrics from IndexedDB & navigator.storage
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
    showToast(`Updated reader name to "${trimmed}"`);
  };

  const handleAvatarFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showToast('Processing avatar image...');
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

  // Download complete local archive JSON
  const handleExportVault = async () => {
    setIsExporting(true);
    showToast(includeBinaries ? 'Generating full archive with EPUB binaries...' : 'Generating archive export...');
    try {
      const archive = await exportVaultArchive({ includeBinaries });
      if (!archive) throw new Error('Archive generation returned empty');

      const jsonStr = JSON.stringify(archive, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateTag = new Date().toISOString().split('T')[0];
      a.download = `flyleaf-vault-backup-${dateTag}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported vault backup (${archive.books.length} books, ${archive.vocabulary.length} words)`);
    } catch (err) {
      showToast('Export failed: ' + (err.message || 'unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  // File chosen for restore -> validate and show summary modal
  const handleRestoreFileChosen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File does not contain valid JSON');
        }

        const books = Array.isArray(parsed.books) ? parsed.books : [];
        const words = Array.isArray(parsed.vocabulary) ? parsed.vocabulary : Array.isArray(parsed.words) ? parsed.words : [];
        const highlightsCount = Array.isArray(parsed.highlights)
          ? parsed.highlights.reduce((acc, g) => acc + (g.items?.length || 0), 0)
          : 0;
        const bookmarksCount = Array.isArray(parsed.bookmarks)
          ? parsed.bookmarks.reduce((acc, g) => acc + (g.items?.length || 0), 0)
          : 0;
        const sessionsCount = Array.isArray(parsed.sessions) ? parsed.sessions.length : 0;
        const hasBinaries = Boolean(parsed.binaries && Object.keys(parsed.binaries).length > 0);

        setPendingRestore({
          data: parsed,
          fileName: file.name,
          booksCount: books.length,
          wordsCount: words.length,
          highlightsCount,
          bookmarksCount,
          sessionsCount,
          hasBinaries,
        });
        setRestoreModalOpen(true);
      } catch (err) {
        showToast('Invalid backup file: ' + err.message);
      } finally {
        if (restoreInputRef.current) restoreInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      showToast('Failed to read backup file');
      if (restoreInputRef.current) restoreInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleConfirmRestore = async () => {
    if (!pendingRestore?.data) return;
    setIsRestoring(true);
    showToast('Importing and merging backup records...');
    try {
      const results = await restoreVaultArchive(pendingRestore.data);
      await refreshStorageMetrics();
      setRestoreModalOpen(false);
      setPendingRestore(null);
      showToast(
        `Restored ${results.booksRestored} books, ${results.highlightsRestored} highlights, and ${results.vocabularyRestored} words`
      );
    } catch (err) {
      showToast('Restore failed: ' + err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Erase everything confirmation handler
  const handleConfirmErase = async () => {
    if (eraseConfirmInput !== 'ERASE') return;
    setIsErasing(true);
    try {
      await eraseEntireVault();
      resetPreferences();
      await refreshStorageMetrics();
      setEraseModalOpen(false);
      setEraseConfirmInput('');
      showToast('All local vault data has been erased');
      router.push('/library');
    } catch (err) {
      showToast('Failed to erase vault: ' + err.message);
    } finally {
      setIsErasing(false);
    }
  };

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <div className="min-h-dvh bg-paper-wash text-on-surface antialiased font-body-ui selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      <div className="relative w-full flex-col justify-between pb-28 md:pb-10">
        <div className="absolute top-0 left-0 right-0 h-44 pointer-events-none opacity-80 bg-gradient-to-b from-[#cde0f1]/60 dark:from-[#1c2438] via-[#e6eff7]/30 dark:via-[#161c2d]/60 to-transparent"></div>

        {/* Mobile Header */}
        <header className="md:hidden sticky top-0 z-40 w-full bg-surface/80 dark:bg-inverse-surface/80 backdrop-blur-md border-b border-outline-variant/30 transition-colors">
          <div className="flex justify-between items-center w-full px-5 md:px-8 py-3 max-w-lg md:max-w-none mx-auto">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">
                auto_stories
              </span>
              <span className="font-headline-md text-headline-md tracking-tight font-medium text-primary">
                Flyleaf
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-lowest/90 border border-outline-variant/40 shadow-[0_1px_4px_rgba(44,64,88,0.04)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider font-semibold uppercase">
                  Local Vault
                </span>
                <span className="material-symbols-outlined text-outline text-[14px] ml-0.5">
                  lock
                </span>
              </div>
              <button
                type="button"
                onClick={() => router.push('/library')}
                aria-label="Library"
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary hover:bg-surface-container-high/50 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">search</span>
              </button>
            </div>
          </div>
        </header>

        <main className="relative z-10 px-5 md:px-8 pt-5 pb-6 flex-1 flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
          <section className="lg:col-span-2 pt-1">
            <div className="flex items-center gap-2">
              <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight font-normal">
                Settings
              </h1>
              <span className="material-symbols-outlined text-secondary text-[20px] opacity-80">
                auto_awesome
              </span>
            </div>
            <p className="font-caption text-caption text-on-surface-variant mt-0.5 tracking-wide">
              how Flyleaf behaves.
            </p>
          </section>

          {/* Section: YOU */}
          <section className="space-y-2">
            <div className="px-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline tracking-widest uppercase font-semibold">
                YOU
              </span>
              <span className="font-caption text-caption text-outline/80">
                Reader Profile &amp; Theme
              </span>
            </div>
            <div className="bg-surface-container-lowest/85 backdrop-blur-md rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_2px_8px_rgba(44,64,88,0.03)] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/10">
              {/* Name */}
              <div
                onClick={() => {
                  setNameInput(userName);
                  setEditingName(true);
                }}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-container-low/40 active:scale-[0.99] transition cursor-pointer"
              >
                <span className="font-body-ui text-body-ui text-on-surface">Your name</span>
                {editingName ? (
                  <form
                    onSubmit={handleSaveName}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5"
                  >
                    <input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      autoFocus
                      placeholder="Reader"
                      className="w-32 px-2.5 py-1 rounded-lg bg-surface-container border border-outline-variant/50 text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-primary text-on-primary text-xs font-semibold"
                    >
                      Save
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <span className="font-body-ui text-body-ui text-on-surface-variant">
                      {userName || 'Reader'}
                    </span>
                    <span className="material-symbols-outlined text-outline text-[18px]">
                      chevron_right
                    </span>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className="flex items-center justify-between px-4 py-3 hover:bg-surface-container-low/40 transition">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarFileSelected}
                />
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="flex-1 flex flex-col cursor-pointer"
                >
                  <span className="font-body-ui text-body-ui text-on-surface">Your avatar</span>
                  <span className="font-caption text-caption text-outline">
                    Resized to 256px and stored offline
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {userAvatar && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="text-caption text-outline hover:text-error text-xs p-1"
                      title="Remove avatar"
                    >
                      Remove
                    </button>
                  )}
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-10 h-10 rounded-full ring-2 ring-surface-container-high/60 overflow-hidden shadow-sm bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm cursor-pointer hover:ring-primary transition-all"
                    title="Click to upload avatar"
                  >
                    {userAvatar ? (
                      <img
                        alt="Reader profile avatar"
                        className="w-full h-full object-cover"
                        src={userAvatar}
                      />
                    ) : (
                      <span>{getInitials(userName)}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Theme Selector */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="font-body-ui text-body-ui text-on-surface">Theme</span>
                <div className="inline-flex items-center p-1 rounded-full bg-surface-container border border-outline-variant/30">
                  {[
                    { id: 'auto', icon: '◐', label: 'Auto' },
                    { id: 'day', icon: '☀️', label: 'Day' },
                    { id: 'night', icon: '🌙', label: 'Night' },
                  ].map((opt) => {
                    const active = themeMode === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setThemeMode(opt.id);
                          showToast(`Theme set to ${opt.label}`);
                        }}
                        className={`flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-label-sm transition-all ${
                          active
                            ? 'bg-primary-container text-on-primary shadow-sm font-semibold'
                            : 'text-on-surface-variant hover:text-primary font-medium'
                        }`}
                      >
                        <span className="text-[12px] leading-none">{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Section: YOUR JOURNEY */}
          <section className="space-y-2">
            <div className="px-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline tracking-widest uppercase font-semibold">
                YOUR JOURNEY
              </span>
              <span className="font-caption text-caption text-outline/80">
                Local Storage &amp; Backup
              </span>
            </div>
            <div className="bg-surface-container-lowest/85 backdrop-blur-md rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_2px_8px_rgba(44,64,88,0.03)] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/10">
              {/* Kept on this device */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="font-body-ui text-body-ui text-on-surface">
                  Kept on this device
                </span>
                <span className="font-caption text-caption text-on-surface-variant font-medium bg-surface-container-low px-2.5 py-1 rounded-md border border-outline-variant/20 text-right">
                  {pluralize(storageSummary.booksCount, 'book')} · {pluralize(storageSummary.highlightsCount, 'highlight')} · {pluralize(storageSummary.vocabularyCount, 'word')} · {storageSummary.storageFormatted}
                </span>
              </div>

              {/* Last saved */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="font-body-ui text-body-ui text-on-surface">Last saved</span>
                <span className="font-body-ui text-sm text-on-surface-variant">
                  {storageSummary.lastSavedFormatted}
                </span>
              </div>

              {/* Save a copy */}
              <div className="p-4 space-y-2.5 hover:bg-surface-container-low/40 transition">
                <div
                  onClick={handleExportVault}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div>
                    <p className="font-body-ui text-body-ui text-on-surface font-medium">
                      Save a copy (JSON)
                    </p>
                    <p className="font-caption text-caption text-outline">
                      Complete local archive export
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isExporting}
                    aria-label="Download backup"
                    className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/40 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition shadow-sm disabled:opacity-50"
                  >
                    {isExporting ? (
                      <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <span className="material-symbols-outlined text-[17px]">download</span>
                    )}
                  </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1 text-caption text-on-surface-variant select-none">
                  <input
                    type="checkbox"
                    checked={includeBinaries}
                    onChange={(e) => setIncludeBinaries(e.target.checked)}
                    className="rounded border-outline-variant text-primary focus:ring-primary"
                  />
                  <span>Include downloaded EPUB book files in backup archive</span>
                </label>
              </div>

              {/* Restore from a file */}
              <div
                onClick={() => restoreInputRef.current?.click()}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-container-low/40 active:scale-[0.99] transition cursor-pointer"
              >
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleRestoreFileChosen}
                />
                <div>
                  <p className="font-body-ui text-body-ui text-on-surface font-medium">
                    Restore from a file
                  </p>
                  <p className="font-caption text-caption text-outline">
                    Import notes, covers, progress, and vocabulary
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Upload backup"
                  className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/40 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[17px]">upload</span>
                </button>
              </div>

              {/* Vocabulary Link */}
              <div
                onClick={() => router.push('/vocabulary')}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-container-low/40 active:scale-[0.99] transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    translate
                  </span>
                  <span className="font-body-ui text-body-ui text-on-surface">
                    Practice vocabulary deck
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tracking-wider">
                    {storageSummary.vocabularyCount} words
                  </span>
                  <span className="material-symbols-outlined text-outline text-[18px]">
                    chevron_right
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Section: SYNC AND CLOUD (COMING SOON) */}
          <section className="space-y-2 opacity-85">
            <div className="px-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline tracking-widest uppercase font-semibold">
                SYNC AND CLOUD
              </span>
              <span className="font-caption text-[11px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-medium">
                Coming Soon
              </span>
            </div>
            <div className="bg-surface-container-lowest/85 backdrop-blur-md rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_2px_8px_rgba(44,64,88,0.03)] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/10">
              <div className="p-4 space-y-2 bg-surface-container-low/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high/80 border border-outline-variant/30 flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined text-[18px]">cloud_sync</span>
                  </div>
                  <div>
                    <h4 className="font-body-ui-bold text-body-ui-bold text-on-surface text-sm">
                      Cross-Device Sync
                    </h4>
                    <p className="font-caption text-caption text-outline">
                      Account-based syncing is currently in development
                    </p>
                  </div>
                </div>
                <p className="font-caption text-caption text-on-surface-variant leading-relaxed pt-1">
                  Flyleaf operates 100% locally on this device. Multi-device sync and cloud backup will be available once the account system launches.
                </p>
              </div>
            </div>
          </section>

          {/* Developer Tools */}
          {process.env.NODE_ENV !== 'production' && (
            <section className="space-y-2">
              <div className="px-1 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-amber-500 tracking-widest uppercase font-semibold">
                  DEVELOPER
                </span>
                <span className="font-caption text-caption text-amber-500/80">
                  Telemetry &amp; Stats Testing
                </span>
              </div>
              <div className="bg-surface-container-lowest/85 backdrop-blur-md rounded-2xl border border-amber-500/20 shadow-[0_2px_8px_rgba(245,158,11,0.04)] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/10">
                <div
                  onClick={async () => {
                    const count = await seedSampleReadingData();
                    await refreshStorageMetrics();
                    showToast(`Seeded ${count} days of sample reading data`);
                  }}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-container-low/40 active:scale-[0.99] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-amber-500 text-[20px]">
                      database
                    </span>
                    <div>
                      <p className="font-body-ui text-body-ui text-on-surface">
                        Seed sample reading data
                      </p>
                      <p className="font-caption text-caption text-outline">
                        90 days of reading sessions and heatmap
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[18px]">
                    add_chart
                  </span>
                </div>

                <div
                  onClick={async () => {
                    await clearSeededReadingData();
                    await refreshStorageMetrics();
                    showToast('Cleared seeded reading data');
                  }}
                  className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-container-low/40 active:scale-[0.99] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-outline text-[20px]">
                      delete_sweep
                    </span>
                    <div>
                      <p className="font-body-ui text-body-ui text-on-surface">
                        Clear seeded data
                      </p>
                      <p className="font-caption text-caption text-outline">
                        Reset reading stats store to empty
                      </p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-outline text-[18px]">
                    restart_alt
                  </span>
                </div>
              </div>
            </section>
          )}

          {/* Section: DANGER ZONE */}
          <section className="space-y-2">
            <div className="px-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-error tracking-widest uppercase font-semibold">
                DANGER ZONE
              </span>
              <span className="font-caption text-caption text-error/70">Irreversible Actions</span>
            </div>
            <div className="bg-surface-container-lowest/85 backdrop-blur-md rounded-2xl border border-error/20 shadow-[0_2px_8px_rgba(186,26,26,0.04)] overflow-hidden">
              <div
                onClick={() => {
                  setEraseConfirmInput('');
                  setEraseModalOpen(true);
                }}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-error-container/20 active:scale-[0.99] transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[18px]">
                    device_reset
                  </span>
                  <span className="font-body-ui text-body-ui text-error font-medium">
                    Erase everything on this device
                  </span>
                </div>
                <span className="material-symbols-outlined text-error/70 text-[18px]">
                  chevron_right
                </span>
              </div>
            </div>
          </section>

          <footer className="lg:col-span-2 pt-2 pb-6 text-center">
            <p className="font-caption text-caption text-outline/70">
              Flyleaf Local-First Reader · v1.4.2
            </p>
            <p className="font-caption text-caption text-outline/50 text-[10px] tracking-wide mt-0.5">
              100% Local-First Storage Architecture
            </p>
          </footer>
        </main>
      </div>

      {/* Restore Confirmation Summary Modal */}
      {restoreModalOpen && pendingRestore && (
        <div
          onClick={() => setRestoreModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface text-on-surface rounded-3xl border border-outline-variant/40 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  restore
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary font-semibold">
                  Restore Vault Backup
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <p className="font-body-ui text-sm text-on-surface-variant">
              The backup file <strong className="text-on-surface">{pendingRestore.fileName}</strong> was validated. Review the items to import:
            </p>

            <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-surface-container-low border border-outline-variant/30 text-xs">
              <div className="flex justify-between p-2 rounded-xl bg-surface">
                <span className="text-outline">Books:</span>
                <span className="font-bold text-primary">{pendingRestore.booksCount}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-surface">
                <span className="text-outline">EPUB Files:</span>
                <span className="font-bold text-primary">{pendingRestore.hasBinaries ? 'Included' : 'Metadata only'}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-surface">
                <span className="text-outline">Highlights:</span>
                <span className="font-bold text-primary">{pendingRestore.highlightsCount}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-surface">
                <span className="text-outline">Bookmarks:</span>
                <span className="font-bold text-primary">{pendingRestore.bookmarksCount}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-surface">
                <span className="text-outline">Vocabulary:</span>
                <span className="font-bold text-primary">{pendingRestore.wordsCount}</span>
              </div>
              <div className="flex justify-between p-2 rounded-xl bg-surface">
                <span className="text-outline">Sessions:</span>
                <span className="font-bold text-primary">{pendingRestore.sessionsCount}</span>
              </div>
            </div>

            <p className="text-caption font-caption text-outline">
              Existing books and records will be merged by ID. Your offline data will be updated with the backup contents.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="flex-1 py-2.5 rounded-full border border-outline-variant/60 font-label-md text-sm hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="flex-1 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-sm font-semibold hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isRestoring ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                    <span>Restoring...</span>
                  </>
                ) : (
                  <span>Restore Backup</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Erase Confirmation Modal */}
      {eraseModalOpen && (
        <div
          onClick={() => setEraseModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface text-on-surface rounded-3xl border border-error/30 shadow-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 text-error border-b border-error/20 pb-3">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-error">
                Erase Everything?
              </h3>
            </div>

            <p className="font-body-ui text-sm text-on-surface-variant leading-relaxed">
              This action is <strong className="text-error">irreversible</strong>. All downloaded EPUBs, reading history, bookmarks, notes, highlights, and vocabulary will be permanently deleted from this browser.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="text-caption font-label-sm text-on-surface-variant block">
                Type <strong className="text-error font-mono">ERASE</strong> to confirm:
              </label>
              <input
                value={eraseConfirmInput}
                onChange={(e) => setEraseConfirmInput(e.target.value)}
                placeholder="ERASE"
                className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/60 px-3.5 py-2 font-mono text-sm tracking-wider uppercase text-on-surface focus:outline-none focus:ring-1 focus:ring-error"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEraseModalOpen(false)}
                className="flex-1 py-2.5 rounded-full border border-outline-variant/60 font-label-md text-sm hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmErase}
                disabled={eraseConfirmInput !== 'ERASE' || isErasing}
                className="flex-1 py-2.5 rounded-full bg-error text-on-error font-label-md text-sm font-semibold hover:opacity-90 shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {isErasing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-error border-t-transparent rounded-full animate-spin"></span>
                    <span>Erasing Vault...</span>
                  </>
                ) : (
                  <span>Confirm Erase</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
