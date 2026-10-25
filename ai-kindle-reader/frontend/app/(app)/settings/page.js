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
import PageHeader from '@/components/ui/PageHeader';
import Segmented from '@/components/ui/Segmented';
import Button from '@/components/ui/Button';
import AccountCard from '@/components/AccountCard';

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

const THEME_OPTIONS = [
  { id: 'auto', value: 'auto', label: 'Auto' },
  { id: 'paper', value: 'paper', label: 'Paper' },
  { id: 'sepia', value: 'sepia', label: 'Sepia' },
  { id: 'night', value: 'night', label: 'Night' },
  { id: 'oled', value: 'oled', label: 'OLED' },
];

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
    lastSavedFormatted: 'Loading…',
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

  // Fetch real vault metrics
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

  // Download complete local archive JSON
  const handleExportVault = async () => {
    setIsExporting(true);
    showToast(
      includeBinaries
        ? 'Generating archive with EPUB files…'
        : 'Generating archive export…'
    );
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
      showToast(
        `Exported vault backup (${archive.books.length} volumes, ${archive.vocabulary.length} terms)`
      );
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
        const words = Array.isArray(parsed.vocabulary)
          ? parsed.vocabulary
          : Array.isArray(parsed.words)
          ? parsed.words
          : [];
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
    showToast('Importing and merging backup records…');
    try {
      const results = await restoreVaultArchive(pendingRestore.data);
      await refreshStorageMetrics();
      setRestoreModalOpen(false);
      setPendingRestore(null);
      showToast(
        `Restored ${results.booksRestored} books, ${results.highlightsRestored} highlights, and ${results.vocabularyRestored} terms`
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
    <div className="min-h-dvh bg-background text-ink antialiased">
      <main className="max-w-[48rem] mx-auto px-4 sm:px-8 pt-6 pb-32 space-y-8">
        {/* Page Header */}
        <PageHeader
          eyebrow="Preferences"
          title="Settings"
          description="Local configuration, typography, theme, and storage management"
        />

        {/* Section: Account & Sync (Isolated Slot Component) */}
        <section className="space-y-2">
          <AccountCard />
        </section>

        {/* Section: READER PROFILE & THEME */}
        <section className="space-y-2">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block px-1">
            READER PROFILE &amp; THEME
          </span>
          <div className="border border-hairline bg-surface rounded-[12px] divide-y divide-hairline">
            {/* Display Name Row */}
            <div
              onClick={() => {
                setNameInput(userName);
                setEditingName(true);
              }}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-hairline/10 transition-colors"
            >
              <span className="font-sans text-[14.5px] text-ink">Reader name</span>
              {editingName ? (
                <form
                  onSubmit={handleSaveName}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-2"
                >
                  <input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    autoFocus
                    placeholder="Reader"
                    className="w-32 px-3 py-1.5 rounded-[8px] bg-background border border-hairline text-sm text-ink focus:outline-none focus:border-ink"
                  />
                  <Button type="submit" variant="primary" size="sm">
                    Save
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-1.5 text-muted">
                  <span className="font-sans text-[14px] text-ink">{userName || 'Reader'}</span>
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                  >
                    chevron_right
                  </span>
                </div>
              )}
            </div>

            {/* Avatar Row */}
            <div className="flex items-center justify-between p-4">
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
                <span className="font-sans text-[14.5px] text-ink">Profile monogram</span>
                <span className="text-[11.5px] text-muted font-sans">
                  Stored locally on this device
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {userAvatar && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[12px] text-muted hover:text-red-600 transition-colors px-2 py-1"
                  >
                    Remove
                  </button>
                )}
                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="w-10 h-10 rounded-full border border-hairline bg-surface text-ink flex items-center justify-center font-serif text-[15px] font-normal cursor-pointer overflow-hidden"
                  title="Click to change avatar"
                >
                  {userAvatar ? (
                    <img
                      alt="Profile portrait"
                      className="w-full h-full object-cover"
                      src={userAvatar}
                    />
                  ) : (
                    <span>{getInitials(userName)}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Segmented Theme Control: 4 Palettes + Auto */}
            <div className="p-4 space-y-2">
              <span className="font-sans text-[14.5px] text-ink block">Theme Palette</span>
              <div className="pt-1">
                <Segmented
                  options={THEME_OPTIONS}
                  value={themeMode}
                  onChange={(val) => {
                    setThemeMode(val);
                    showToast(`Theme set to ${val}`);
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section: LOCAL STORAGE & VAULT ARCHIVE */}
        <section className="space-y-2">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block px-1">
            LOCAL STORAGE &amp; ARCHIVE
          </span>
          <div className="border border-hairline bg-surface rounded-[12px] divide-y divide-hairline">
            {/* Kept on this device */}
            <div className="flex items-center justify-between p-4">
              <span className="font-sans text-[14.5px] text-ink">Kept on this device</span>
              <span className="text-[12px] text-muted font-sans tabular-nums text-right">
                {pluralize(storageSummary.booksCount, 'volume')} ·{' '}
                {pluralize(storageSummary.highlightsCount, 'highlight')} ·{' '}
                {pluralize(storageSummary.vocabularyCount, 'term')} · {storageSummary.storageFormatted}
              </span>
            </div>

            {/* Last Saved */}
            <div className="flex items-center justify-between p-4">
              <span className="font-sans text-[14.5px] text-ink">Last saved</span>
              <span className="text-[12px] text-muted font-sans">
                {storageSummary.lastSavedFormatted}
              </span>
            </div>

            {/* Export JSON Backup */}
            <div className="p-4 space-y-2.5">
              <div
                onClick={handleExportVault}
                className="flex items-center justify-between cursor-pointer"
              >
                <div>
                  <p className="font-sans text-[14.5px] text-ink font-medium">
                    Export library archive (.json)
                  </p>
                  <p className="text-[11.5px] text-muted font-sans">
                    Complete local backup of notes, highlights, and lexicon
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isExporting}
                  aria-label="Download backup archive"
                  className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/40 transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                    >
                      download
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                role="checkbox"
                aria-checked={includeBinaries}
                onClick={() => setIncludeBinaries(!includeBinaries)}
                className="flex items-center gap-2.5 cursor-pointer pt-1 text-[12px] text-muted hover:text-ink select-none min-h-[44px]"
              >
                <span
                  className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors shrink-0 ${
                    includeBinaries
                      ? 'bg-ink border-ink'
                      : 'border-hairline bg-surface'
                  }`}
                >
                  {includeBinaries && (
                    <span
                      className="material-symbols-outlined text-[13px]"
                      style={{ fontVariationSettings: "'FILL' 0, 'wght' 300", color: 'var(--theme-contrast)' }}
                    >
                      check
                    </span>
                  )}
                </span>
                <span>Include downloaded EPUB binaries in archive</span>
              </button>
            </div>

            {/* Restore from Backup */}
            <div
              onClick={() => restoreInputRef.current?.click()}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-hairline/10 transition-colors"
            >
              <input
                ref={restoreInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleRestoreFileChosen}
              />
              <div>
                <p className="font-sans text-[14.5px] text-ink font-medium">
                  Restore from archive
                </p>
                <p className="text-[11.5px] text-muted font-sans">
                  Import volumes, notes, bookmarks, and vocabulary
                </p>
              </div>
              <button
                type="button"
                aria-label="Upload backup archive"
                className="min-w-[44px] min-h-[44px] w-10 h-10 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink hover:border-ink/40 transition-colors"
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  upload
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Developer Testing Section (non-prod only) */}
        {process.env.NODE_ENV !== 'production' && (
          <section className="space-y-2">
            <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-sans font-medium block px-1">
              DEVELOPER TOOLS
            </span>
            <div className="border border-hairline bg-surface rounded-[12px] divide-y divide-hairline">
              <div
                onClick={async () => {
                  const count = await seedSampleReadingData();
                  await refreshStorageMetrics();
                  showToast(`Seeded ${count} days of sample telemetry data`);
                }}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-hairline/10 transition-colors"
              >
                <div>
                  <p className="font-sans text-[14.5px] text-ink">Seed sample reading telemetry</p>
                  <p className="text-[11.5px] text-muted font-sans">
                    90 days of reading sessions and heatmap
                  </p>
                </div>
                <span
                  className="material-symbols-outlined text-muted text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  add_chart
                </span>
              </div>

              <div
                onClick={async () => {
                  await clearSeededReadingData();
                  await refreshStorageMetrics();
                  showToast('Cleared sample reading telemetry');
                }}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-hairline/10 transition-colors"
              >
                <div>
                  <p className="font-sans text-[14.5px] text-ink">Clear sample telemetry</p>
                  <p className="text-[11.5px] text-muted font-sans">Reset reading stats store</p>
                </div>
                <span
                  className="material-symbols-outlined text-muted text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  restart_alt
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Section: DANGER ZONE (text-only red hairline row) */}
        <section className="space-y-2">
          <span className="text-[10.5px] uppercase tracking-[0.12em] text-red-800 dark:text-red-400 font-sans font-medium block px-1">
            DANGER ZONE
          </span>
          <div className="border border-hairline bg-surface rounded-[12px] overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setEraseConfirmInput('');
                setEraseModalOpen(true);
              }}
              className="w-full flex items-center justify-between p-4 text-left text-red-800 dark:text-red-400 hover:bg-red-500/5 transition-colors min-h-[44px]"
            >
              <span className="font-sans text-[14.5px] font-medium">
                Erase everything on this device
              </span>
              <span
                className="material-symbols-outlined text-[18px]"
                style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
              >
                chevron_right
              </span>
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-4 text-center space-y-1">
          <p className="text-[11.5px] text-muted font-sans">
            Flyleaf Local-First Reader · Editorial Edition
          </p>
          <p className="text-[10.5px] uppercase tracking-[0.12em] text-muted/60 font-sans">
            100% Local-First Storage Architecture
          </p>
        </footer>
      </main>

      {/* Restore Confirmation Summary Modal */}
      {restoreModalOpen && pendingRestore && (
        <div
          data-overlay="dialog"
          role="dialog"
          aria-modal="true"
          onClick={() => setRestoreModalOpen(false)}
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface text-ink rounded-[24px] border border-hairline p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-hairline pb-3">
              <h3 className="font-serif text-[20px] text-ink font-normal">
                Restore Vault Archive
              </h3>
              <button
                type="button"
                onClick={() => setRestoreModalOpen(false)}
                className="w-8 h-8 rounded-full border border-hairline flex items-center justify-center text-muted hover:text-ink"
              >
                <span
                  className="material-symbols-outlined text-[16px]"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  close
                </span>
              </button>
            </div>

            <p className="text-[13.5px] text-muted font-sans">
              Archive <strong className="text-ink">{pendingRestore.fileName}</strong> validated.
              Records to merge:
            </p>

            <div className="grid grid-cols-2 gap-2 p-3 rounded-[12px] border border-hairline bg-background text-[12.5px] font-sans">
              <div className="flex justify-between p-2 rounded-[8px] bg-surface border border-hairline">
                <span className="text-muted">Volumes:</span>
                <span className="font-medium text-ink tabular-nums">{pendingRestore.booksCount}</span>
              </div>
              <div className="flex justify-between p-2 rounded-[8px] bg-surface border border-hairline">
                <span className="text-muted">Files:</span>
                <span className="font-medium text-ink">
                  {pendingRestore.hasBinaries ? 'Included' : 'Metadata'}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-[8px] bg-surface border border-hairline">
                <span className="text-muted">Highlights:</span>
                <span className="font-medium text-ink tabular-nums">
                  {pendingRestore.highlightsCount}
                </span>
              </div>
              <div className="flex justify-between p-2 rounded-[8px] bg-surface border border-hairline">
                <span className="text-muted">Vocabulary:</span>
                <span className="font-medium text-ink tabular-nums">{pendingRestore.wordsCount}</span>
              </div>
            </div>

            <p className="text-[12px] text-muted font-sans">
              Existing volumes and notes will be merged by ID with the archive contents.
            </p>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setRestoreModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirmRestore}
                disabled={isRestoring}
              >
                {isRestoring ? 'Restoring…' : 'Restore Archive'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Erase Confirmation Modal */}
      {eraseModalOpen && (
        <div
          data-overlay="dialog"
          role="dialog"
          aria-modal="true"
          onClick={() => setEraseModalOpen(false)}
          className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface text-ink rounded-[24px] border border-hairline p-6 space-y-4"
          >
            <div className="border-b border-hairline pb-3">
              <h3 className="font-serif text-[20px] text-red-600 dark:text-red-400 font-normal">
                Erase all local data?
              </h3>
            </div>

            <p className="text-[13.5px] text-muted font-sans leading-relaxed">
              This action is <strong className="text-red-600 dark:text-red-400">irreversible</strong>.
              All downloaded EPUBs, reading sessions, highlights, and saved vocabulary will be permanently removed from this browser.
            </p>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] uppercase tracking-[0.12em] text-muted font-sans block">
                Type <strong className="text-red-600 dark:text-red-400 font-mono">ERASE</strong> to confirm:
              </label>
              <input
                value={eraseConfirmInput}
                onChange={(e) => setEraseConfirmInput(e.target.value)}
                placeholder="ERASE"
                className="w-full rounded-[12px] bg-background border border-hairline px-3.5 py-2.5 font-mono text-[14px] uppercase text-ink focus:outline-none focus:border-red-600"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setEraseModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="flex-1 bg-semantic-error text-contrast hover:opacity-90"
                onClick={handleConfirmErase}
                disabled={eraseConfirmInput !== 'ERASE' || isErasing}
              >
                {isErasing ? 'Erasing…' : 'Confirm Erase'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
