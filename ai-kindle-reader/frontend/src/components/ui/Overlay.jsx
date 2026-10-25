'use client';

import React, { useEffect, useRef } from 'react';

/**
 * Popover
 * Floating contextual overlay:
 * - surface/90 + backdrop-blur + 1px hairline border + soft shadow
 * - 16px to 24px radius
 * - 160-220ms ease-out fade/slide
 */
export function Popover({
  open = false,
  onClose,
  trigger,
  children,
  align = 'end', // 'start' | 'center' | 'end'
  className = '',
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [open, onClose]);

  const alignClasses = {
    start: 'left-0 origin-top-left',
    center: 'left-1/2 -translate-x-1/2 origin-top',
    end: 'right-0 origin-top-right',
  }[align] || 'right-0 origin-top-right';

  return (
    <div ref={containerRef} className="relative inline-block">
      {trigger}
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className={`absolute z-50 mt-2 min-w-[220px] max-w-sm bg-surface/90 backdrop-blur-md border border-hairline rounded-[20px] p-3 shadow-[0_12px_36px_rgba(0,0,0,0.08)] animate-in fade-in zoom-in-95 duration-200 ${alignClasses} ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * SidePanel
 * Floating sheet / slide-over panel:
 * - 24px radius for sheets and panels
 * - surface/95 + backdrop-blur + 1px hairline border
 * - 160-220ms ease-out slide
 */
export function SidePanel({
  open = false,
  onClose,
  title,
  eyebrow,
  children,
  footer,
  className = '',
}) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
      {/* Quiet Backdrop */}
      <div
        className="fixed inset-0 bg-ink/20 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div
        ref={panelRef}
        className={`relative z-10 w-full sm:max-w-md h-full bg-surface/95 backdrop-blur-md border-l border-hairline sm:rounded-l-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.12)] flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200 ease-out ${className}`}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-hairline flex items-start justify-between gap-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium font-sans mb-1">
                {eyebrow}
              </p>
            )}
            {title && (
              <h2 className="font-serif text-[22px] sm:text-[24px] text-ink font-normal tracking-tight">
                {title}
              </h2>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-muted hover:text-ink hover:bg-hairline/20 transition-colors focus:outline-none"
            aria-label="Close panel"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
            >
              close
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 sm:p-6 border-t border-hairline bg-surface/80 flex items-center justify-end gap-2.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default { Popover, SidePanel };
