'use client';

import React from 'react';

/**
 * Toast
 * Quiet floating notification pill:
 * - Floating overlay: surface/95 + backdrop-blur + hairline border + soft shadow
 * - Full pill radius (999px)
 * - Calm, restrained voice
 */
export function Toast({
  message,
  icon,
  action,
  visible = true,
  onDismiss,
  className = '',
}) {
  if (!visible || !message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-surface/95 backdrop-blur-md text-ink text-[13px] font-sans font-medium border border-hairline shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none ${className}`}
    >
      {icon ? (
        typeof icon === 'string' ? (
          <span
            className="material-symbols-outlined text-[17px] text-accent shrink-0"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 18" }}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : (
          icon
        )
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" aria-hidden="true" />
      )}
      <span className="leading-snug">{message}</span>
      {action && <div className="ml-1 pl-2 border-l border-hairline">{action}</div>}
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="ml-1 p-0.5 rounded-full text-muted hover:text-ink transition-colors focus:outline-none"
          aria-label="Dismiss"
        >
          <span
            className="material-symbols-outlined text-[15px]"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 16" }}
          >
            close
          </span>
        </button>
      )}
    </div>
  );
}

export default Toast;
