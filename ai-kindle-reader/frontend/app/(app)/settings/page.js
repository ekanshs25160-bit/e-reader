'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { BOOKS } from '@/utils/booksData';

export default function Page() {
  const router = useRouter();
  const { themeMode, setThemeMode, userName, setUserName, showToast } = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [magicEmail, setMagicEmail] = useState('');
  const [magicModalOpen, setMagicModalOpen] = useState(false);
  const restoreInputRef = useRef(null);

  const handleSaveName = (e) => {
    e?.preventDefault();
    setUserName(nameInput);
    setEditingName(false);
    showToast(`Updated reader name to "${nameInput.trim() || 'Ekansh'}"`);
  };

  const handleExportVault = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      reader: userName,
      theme: themeMode,
      booksCount: BOOKS.length,
      books: BOOKS.map((b) => ({
        id: b.id,
        title: b.title,
        author: b.author,
        progress: b.progress,
        status: b.status,
      })),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'flyleaf-vault-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded flyleaf-vault-backup.json');
  };

  return (
    <div className="min-h-dvh bg-paper-wash text-on-surface antialiased font-body-ui selection:bg-secondary-fixed selection:text-on-secondary-fixed">
      <div className="relative w-full flex-col justify-between pb-28 md:pb-10">
        <div className="absolute top-0 left-0 right-0 h-44 pointer-events-none opacity-80 bg-gradient-to-b from-[#cde0f1]/60 dark:from-[#1c2438] via-[#e6eff7]/30 dark:via-[#161c2d]/60 to-transparent"></div>

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
                aria-label="Search or Profile"
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

          <section className="space-y-2">
            <div className="px-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline tracking-widest uppercase font-semibold">
                YOU
              </span>
              <span className="font-caption text-caption text-outline/80">
                Account &amp; Canvas
              </span>
            </div>
            <div className="bg-surface-container-lowest/85 backdrop-blur-md rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_2px_8px_rgba(44,64,88,0.03)] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/10">
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
                      {userName}
                    </span>
                    <span className="material-symbols-outlined text-outline text-[18px]">
                      chevron_right
                    </span>
                  </div>
                )}
              </div>

              <div
                onClick={() => showToast('Avatar is stored 100% locally in your device vault')}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-container-low/40 active:scale-[0.99] transition cursor-pointer"
              >
                <div className="flex flex-col">
                  <span className="font-body-ui text-body-ui text-on-surface">Your face</span>
                  <span className="font-caption text-caption text-outline">
                    Stored purely offline in vault
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full ring-2 ring-surface-container-high/60 overflow-hidden shadow-sm bg-surface-container-low flex items-center justify-center">
                    <img
                      alt="Ekansh reading in cozy warm scarf"
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida/AEtjO1Uh8eZ4HO1DzGX5cT-CGuOcW2A32HATCtXulGv9bjk1-DGuI6AFscKGQnSMeaBxT-i2iTylZOx2aKsP9ABNHzBlgqSSgJC5AdcwGFlT4eiOHMgRfx7c53kII3Yf_f8MQpbxIxMVJcKjepD65KyeQcMTHTTWhEV5Xiz0TAucFv9r7tGvCxNMZ3vfyGQ-u3VM0TrPKFPkpP-WNmyaKwavea-XHmFnl7_0FXAj8WxVjhl8LaAqipQS8kAuyQ"
                    />
                  </div>
                  <span className="material-symbols-outlined text-outline text-[18px]">
                    chevron_right
                  </span>
                </div>
              </div>

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
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="font-body-ui text-body-ui text-on-surface">
                  Kept on this device
                </span>
                <span className="font-caption text-caption text-on-surface-variant font-medium bg-surface-container-low px-2 py-0.5 rounded-md border border-outline-variant/20">
                  6 books · 25 memories · 48 MB
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="font-body-ui text-body-ui text-on-surface">Last saved</span>
                <span className="font-body-ui text-body-ui text-on-surface-variant">
                  Today, 6:20 PM
                </span>
              </div>
              <div
                onClick={handleExportVault}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-container-low/40 active:scale-[0.99] transition cursor-pointer"
              >
                <div>
                  <p className="font-body-ui text-body-ui text-on-surface">
                    Save a copy (JSON / Markdown)
                  </p>
                  <p className="font-caption text-caption text-outline">
                    Complete unencrypted archive export
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Download backup"
                  className="w-8 h-8 rounded-full bg-surface-container border border-outline-variant/40 flex items-center justify-center text-primary hover:bg-primary hover:text-on-primary transition shadow-sm"
                >
                  <span className="material-symbols-outlined text-[17px]">download</span>
                </button>
              </div>
              <div
                onClick={() => restoreInputRef.current?.click()}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-container-low/40 active:scale-[0.99] transition cursor-pointer"
              >
                <input
                  ref={restoreInputRef}
                  type="file"
                  accept=".json,.md"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      showToast(`Restored backup from "${e.target.files[0].name}"`);
                    }
                  }}
                />
                <div>
                  <p className="font-body-ui text-body-ui text-on-surface">Restore from a file</p>
                  <p className="font-caption text-caption text-outline">
                    Import notes, covers, and reading marks
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
              <div
                onClick={() => router.push('/vocabulary')}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-container-low/40 active:scale-[0.99] transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[20px]">
                    book_2
                  </span>
                  <span className="font-body-ui text-body-ui text-on-surface">
                    Make a printed journal
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-semibold tracking-wider">
                    Booklet
                  </span>
                  <span className="material-symbols-outlined text-outline text-[18px]">
                    chevron_right
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="px-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline tracking-widest uppercase font-semibold">
                SYNC AND CLOUD (OPTIONAL)
              </span>
              <span className="inline-flex items-center gap-1 font-caption text-caption text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Zero trackers
              </span>
            </div>
            <div className="bg-surface-container-lowest/85 backdrop-blur-md rounded-2xl border border-black/[0.06] dark:border-white/10 shadow-[0_2px_8px_rgba(44,64,88,0.03)] overflow-hidden divide-y divide-black/[0.06] dark:divide-white/10">
              <div className="p-4 space-y-3 bg-surface-container-low/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface-container-high/80 border border-outline-variant/30 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-[18px]">link</span>
                    </div>
                    <div>
                      <h4 className="font-body-ui-bold text-body-ui-bold text-on-surface">
                        Sign in with Magic Link
                      </h4>
                      <p className="font-caption text-caption text-outline">
                        No passwords to memorize or lose
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMagicModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary-container text-on-primary hover:bg-primary active:scale-[0.98] transition font-label-md text-label-md font-medium shadow-sm"
                  >
                    <span>Send Link</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
                <p className="font-caption text-caption text-on-surface-variant leading-relaxed pt-1 border-t border-black/[0.04]">
                  Reading works 100% offline. Sign in only to sync positions, shelves, and notes
                  across devices.
                </p>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="font-body-ui text-body-ui text-on-surface">Sync status</span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  <span className="font-label-sm text-label-sm font-medium">
                    ● Up to date (0 queued offline)
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="font-body-ui text-body-ui text-on-surface">Synced data</span>
                <span className="font-caption text-caption text-on-surface-variant">
                  Progress, Shelves &amp; Notes only (No EPUBs)
                </span>
              </div>
            </div>
          </section>

          <section className="space-y-2">
            <div className="px-1 flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-error tracking-widest uppercase font-semibold">
                DANGER ZONE
              </span>
              <span className="font-caption text-caption text-error/70">Irreversible Actions</span>
            </div>
            <div className="bg-surface-container-lowest/85 backdrop-blur-md rounded-2xl border border-error/20 shadow-[0_2px_8px_rgba(186,26,26,0.04)] overflow-hidden divide-y divide-error/15">
              <div
                onClick={() => {
                  try {
                    localStorage.removeItem('flyleaf-theme');
                    localStorage.removeItem('flyleaf-user-name');
                  } catch {}
                  setThemeMode('day');
                  setUserName('Ekansh');
                  showToast('Local preferences reset to default');
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
              <div
                onClick={() => showToast('No cloud account connected — your data is 100% local')}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-error-container/20 active:scale-[0.99] transition cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-error text-[18px]">
                    delete_forever
                  </span>
                  <span className="font-body-ui text-body-ui text-error font-medium">
                    Delete cloud account &amp; synced rows
                  </span>
                </div>
                <span className="material-symbols-outlined text-error/70 text-[18px]">delete</span>
              </div>
            </div>
          </section>

          <footer className="lg:col-span-2 pt-2 pb-6 text-center">
            <p className="font-caption text-caption text-outline/70">
              Flyleaf Local-First Reader · v1.4.2
            </p>
            <p className="font-caption text-caption text-outline/50 text-[10px] tracking-wide mt-0.5">
              End-to-End Vault Encryption Active
            </p>
          </footer>
        </main>
      </div>

      {magicModalOpen && (
        <div
          onClick={() => setMagicModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              setMagicModalOpen(false);
              showToast(`Magic link sent to ${magicEmail}`);
              setMagicEmail('');
            }}
            className="w-full max-w-sm bg-surface text-on-surface rounded-3xl border border-outline-variant/40 shadow-2xl p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-primary">
                Send Magic Sign-In Link
              </h3>
              <button
                type="button"
                onClick={() => setMagicModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <p className="font-caption text-caption text-on-surface-variant">
              Enter your email to receive a one-time sign-in link for syncing reading positions.
            </p>
            <input
              type="email"
              required
              placeholder="reader@flyleaf.local"
              value={magicEmail}
              onChange={(e) => setMagicEmail(e.target.value)}
              className="w-full rounded-xl bg-surface-container-lowest border border-outline-variant/40 px-3.5 py-2 text-sm text-on-surface"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-body-ui-bold text-body-ui-bold"
            >
              Send Magic Link
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
