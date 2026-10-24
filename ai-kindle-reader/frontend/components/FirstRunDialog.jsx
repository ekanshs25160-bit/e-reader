'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/components/common/ThemeProvider';
import { saveSettings, getSettings } from '@/utils/db';

export default function FirstRunDialog() {
  const pathname = usePathname();
  const { userName, setUserName } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    let active = true;
    if (pathname?.startsWith('/reader')) return;

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

  const handleComplete = async (submittedName) => {
    const trimmed = (submittedName || '').trim();
    const finalName = trimmed || 'Reader';

    try {
      localStorage.setItem('flyleaf_first_run_completed', 'true');
      if (trimmed) {
        setUserName(trimmed);
      }
      await saveSettings({
        displayName: trimmed,
        name: finalName,
        firstRunCompleted: true,
      });
    } catch (err) {
      console.error('[Flyleaf] Failed to save first run settings:', err);
    } finally {
      setIsOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="first-run-title"
    >
      <div className="w-full max-w-md bg-surface-container-lowest dark:bg-surface-container rounded-3xl p-6 sm:p-8 shadow-2xl border border-outline-variant/30 text-on-surface relative">
        <div className="flex flex-col items-center text-center">
          {/* Initials Avatar - No fake image, strictly initials */}
          <div
            className="w-16 h-16 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center text-xl font-bold shadow-sm ring-4 ring-surface-container-lowest dark:ring-surface-container-high mb-4"
            aria-hidden="true"
          >
            {getInitials(displayName)}
          </div>

          <span className="font-label-sm text-[11px] tracking-widest text-secondary font-semibold uppercase mb-1">
            Welcome to Flyleaf
          </span>

          <h2
            id="first-run-title"
            className="font-headline-md text-headline-md text-primary font-medium tracking-tight mb-2"
          >
            Your reading sanctuary
          </h2>

          <p className="font-body-ui text-[13px] text-on-surface-variant max-w-xs mb-6 leading-relaxed">
            Choose a display name for your reading notes and journal. This is optional and saved only on this device.
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
                className="block font-label-sm text-xs font-medium text-on-surface-variant mb-1.5"
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
                className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-surface-container-low/70 dark:bg-surface-container-high/40 border border-outline-variant/40 text-on-surface font-body-ui text-sm focus:outline-none focus:ring-2 focus:ring-primary/60 transition"
              />
            </div>

            <div className="flex flex-col sm:flex-row-reverse gap-2.5 pt-2">
              <button
                type="submit"
                className="min-h-[44px] w-full sm:flex-1 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-body-ui font-medium text-sm hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center shadow-xs"
              >
                {displayName.trim() ? 'Save & Start Reading' : 'Start Reading'}
              </button>
              <button
                type="button"
                onClick={() => handleComplete('')}
                className="min-h-[44px] w-full sm:w-auto px-4 py-2.5 rounded-xl text-on-surface-variant hover:text-primary hover:bg-surface-container-high/40 font-body-ui text-sm transition flex items-center justify-center"
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
