'use client';

import { useState, useEffect } from 'react';
import { useSettingsState } from './hooks/useSettingsState';
import { ProfileThemeSection } from './components/ProfileThemeSection';
import { VaultStorageSection } from './components/VaultStorageSection';
import { DevToolsSection } from './components/DevToolsSection';
import { DangerZoneSection } from './components/DangerZoneSection';
import { RestoreModal } from './components/RestoreModal';
import { EraseModal } from './components/EraseModal';
import AccountCard from '@/components/AccountCard';
import PageHeader from '@/components/ui/PageHeader';

export function SettingsScreen() {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const {
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
  } = useSettingsState();

  if (!isMounted) {
    return <div className="w-full h-dvh bg-background" />;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        eyebrow="PREFERENCES"
        title="Settings"
        description="Local configuration, typography, theme, and storage management"
      />

      {/* Section: Account & Sync (Isolated Slot Component) */}
      <section className="space-y-2">
        <AccountCard />
      </section>

      {/* Section: READER PROFILE & THEME */}
      <ProfileThemeSection
        userName={userName}
        userAvatar={userAvatar}
        editingName={editingName}
        setEditingName={setEditingName}
        nameInput={nameInput}
        setNameInput={setNameInput}
        handleSaveName={handleSaveName}
        avatarInputRef={avatarInputRef}
        handleAvatarFileSelected={handleAvatarFileSelected}
        handleRemoveAvatar={handleRemoveAvatar}
        themeMode={themeMode}
        setThemeMode={setThemeMode}
        showToast={showToast}
      />

      {/* Section: LOCAL STORAGE & VAULT ARCHIVE */}
      <VaultStorageSection
        storageSummary={storageSummary}
        handleExportVault={handleExportVault}
        isExporting={isExporting}
        includeBinaries={includeBinaries}
        setIncludeBinaries={setIncludeBinaries}
        restoreInputRef={restoreInputRef}
        handleRestoreFileChosen={handleRestoreFileChosen}
      />

      {/* Developer Testing Section (non-prod only) */}
      <DevToolsSection
        refreshStorageMetrics={refreshStorageMetrics}
        showToast={showToast}
      />

      {/* Section: DANGER ZONE */}
      <DangerZoneSection
        onOpenEraseModal={() => {
          setEraseConfirmInput('');
          setEraseModalOpen(true);
        }}
      />

      {/* Footer */}
      <footer className="pt-4 text-center space-y-1">
        <p className="text-[11.5px] text-muted font-sans">
          Flyleaf Local-First Reader · Editorial Edition
        </p>
        <p className="text-[10.5px] uppercase tracking-[0.12em] text-muted/60 font-sans">
          100% Local-First Storage Architecture
        </p>
      </footer>

      {/* Restore Confirmation Summary Modal */}
      <RestoreModal
        isOpen={restoreModalOpen}
        pendingRestore={pendingRestore}
        onClose={() => setRestoreModalOpen(false)}
        onConfirm={handleConfirmRestore}
        isRestoring={isRestoring}
      />

      {/* Erase Confirmation Modal */}
      <EraseModal
        isOpen={eraseModalOpen}
        eraseConfirmInput={eraseConfirmInput}
        setEraseConfirmInput={setEraseConfirmInput}
        onClose={() => setEraseModalOpen(false)}
        onConfirm={handleConfirmErase}
        isErasing={isErasing}
      />
    </div>
  );
}
