'use client';

import { useState, useRef } from 'react';
import { downloadArchiveJson, parseRestorePayload } from '../lib/settings-helpers';
import {
  exportVaultArchive,
  restoreVaultArchive,
  eraseEntireVault,
} from '@/lib/storage';

export function useVaultArchive({
  refreshStorageMetrics,
  showToast,
  router,
  resetPreferences,
}) {
  const [includeBinaries, setIncludeBinaries] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const restoreInputRef = useRef(null);
  const [pendingRestore, setPendingRestore] = useState(null);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const [eraseModalOpen, setEraseModalOpen] = useState(false);
  const [eraseConfirmInput, setEraseConfirmInput] = useState('');
  const [isErasing, setIsErasing] = useState(false);

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

      downloadArchiveJson(archive);
      showToast(
        `Exported vault backup (${archive.books.length} volumes, ${archive.vocabulary.length} terms)`
      );
    } catch (err) {
      showToast('Export failed: ' + (err.message || 'unknown error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleRestoreFileChosen = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = parseRestorePayload(event.target.result, file.name);
        setPendingRestore(payload);
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

  return {
    includeBinaries,
    setIncludeBinaries,
    isExporting,
    handleExportVault,
    restoreInputRef,
    pendingRestore,
    restoreModalOpen,
    setRestoreModalOpen,
    isRestoring,
    handleRestoreFileChosen,
    handleConfirmRestore,
    eraseModalOpen,
    setEraseModalOpen,
    eraseConfirmInput,
    setEraseConfirmInput,
    isErasing,
    handleConfirmErase,
  };
}
