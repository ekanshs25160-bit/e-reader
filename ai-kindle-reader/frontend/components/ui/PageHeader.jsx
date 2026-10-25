'use client';

import React from 'react';

/**
 * PageHeader
 * Unified 3-part editorial header across all navigation pages:
 * Row 1 — Eyebrow Label: text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant mb-1.5
 * Row 2 — Title (<h1>) + Optional Right Action/Toggle: flex items-center justify-between gap-4
 *         h1: font-serif text-3xl sm:text-4xl font-normal tracking-tight text-on-surface leading-tight
 * Row 3 — Subtitle: text-sm text-on-surface-variant mt-1.5 leading-relaxed
 * Divider & Spacing: border-b border-outline-variant/20 pb-5 mb-6
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  subtitle,
  action,
  actions,
  className = '',
}) {
  const headerAction = action || actions;
  const headerSubtitle = subtitle || description;

  return (
    <header className={`border-b border-outline-variant/20 pb-5 mb-6 ${className}`}>
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-on-surface-variant mb-1.5">
          {eyebrow}
        </p>
      )}
      <div className="flex items-center justify-between gap-3 sm:gap-4 min-w-0">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-on-surface leading-tight min-w-0">
          {title}
        </h1>
        {headerAction && (
          <div className="shrink-0 flex items-center gap-2">
            {headerAction}
          </div>
        )}
      </div>
      {headerSubtitle && (
        <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
          {headerSubtitle}
        </p>
      )}
    </header>
  );
}

export default PageHeader;

