'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { getSettings, saveSettings } from '@/utils/db';

/**
 * FirstRunDialog
 * Floating modal presented on first run asking for an optional display name.
 * Strictly adheres to Flyleaf Editorial Spec (flat overlay, 24px radius, hairline border, soft shadow, serif initials).
 */
export default function FirstRunDialog() {
  const pathname = usePathname();
  const { userName, updateSettings } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;

    const checkFirstRun = async () => {
      try {
        const localFlag = localStorage.getItem('flyleaf_first_run_completed');
        if (localFlag === 'true') return;

        const settings = await getSettings();
        if (settings?.firstRunCompleted) {
          localStorage.setItem('flyleaf_first_run_completed', 'true');
          return;
        }

        if (active) {
          setDisplayName(userName && userName !== 'Reader' ? userName : '');
          setIsOpen(true);
        }
      } catch {
        // In case of storage access restrictions, do not block the app
      }
    };

    checkFirstRun();
    return () => {
      active = false;
    };
  }, [userName]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen || pathname?.startsWith('/reader')) return null;

  const getInitials = (val) => {
    const clean = (val || '').trim();
    if (!clean) return 'R';
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleComplete = async (nameToSave) => {
    const finalName = (nameToSave || '').trim() || 'Reader';
    try {
      localStorage.setItem('flyleaf_first_run_completed', 'true');
      localStorage.setItem('flyleaf_user_name', finalName);

      const existing = (await getSettings()) || {};
      await saveSettings({
        ...existing,
        userName: finalName,
        firstRunCompleted: true,
      });

      if (updateSettings) {
        updateSettings({ userName: finalName });
      }
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-run-title"
      data-overlay="dialog"
    >
      <div className="w-full max-w-md bg-surface border border-hairline rounded-[24px] p-6 sm:p-8 shadow-[0_12px_36px_rgba(0,0,0,0.08)] text-ink relative">
        <div className="flex flex-col items-center text-center">
          {/* Initials Avatar - Ink-outline Monogram */}
          <div
            className="w-14 h-14 rounded-full border border-hairline bg-surface text-ink flex items-center justify-center font-serif text-xl font-normal mb-4"
            aria-hidden="true"
          >
            {getInitials(displayName)}
          </div>

          <span className="font-sans text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium mb-1.5">
            Welcome to Flyleaf
          </span>

          <h2
            id="first-run-title"
            className="font-serif text-[24px] font-normal text-ink tracking-tight mb-2"
          >
            Your reading sanctuary
          </h2>

          <p className="font-sans text-[13.5px] text-muted max-w-xs mb-6 leading-relaxed">
            Choose a display name for your reading notes and journal. Stored on this device. Synced only if you sign in.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleComplete(displayName);
            }}
            className="w-full space-y-4 text-left"
          >
            <div>
              <label
                htmlFor="display-name-input"
                className="block font-sans text-[11px] uppercase tracking-[0.12em] text-muted font-medium mb-1.5"
              >
                Display name (optional)
              </label>
              <input
                id="display-name-input"
                ref={inputRef}
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Maya Angelou"
                maxLength={40}
                className="w-full min-h-[44px] px-4 py-2.5 rounded-[12px] bg-surface border border-hairline text-ink font-sans text-[14px] placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-2.5 pt-2">
              <button
                type="submit"
                className="min-h-[44px] w-full sm:flex-1 px-5 py-2.5 rounded-full bg-ink text-background font-sans font-medium text-[14px] hover:opacity-90 active:scale-[0.98] transition flex items-center justify-center"
              >
                {displayName.trim() ? 'Save & Start Reading' : 'Start Reading'}
              </button>
              <button
                type="button"
                onClick={() => handleComplete('')}
                className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-full text-muted hover:text-ink hover:bg-hairline/20 font-sans font-medium text-[14px] transition flex items-center justify-center"
              >
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
