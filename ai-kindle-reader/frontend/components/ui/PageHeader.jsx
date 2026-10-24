'use client';

import React from 'react';

/**
 * PageHeader
 * Editorial page title block with an optional micro eyebrow label,
 * serif regular title (32-40px), optional description and action,
 * bordered beneath with a 1px hairline divider.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <header className={`border-b border-hairline pb-4 sm:pb-5 mb-6 sm:mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium font-sans mb-1">
              {eyebrow}
            </p>
          )}
          <h1 className="font-serif text-[32px] sm:text-[38px] text-ink font-normal leading-tight tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="font-sans text-[14.5px] sm:text-[15px] text-muted mt-1 max-w-xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="shrink-0 flex items-center gap-2 pt-1 sm:pt-0">
            {action}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;
