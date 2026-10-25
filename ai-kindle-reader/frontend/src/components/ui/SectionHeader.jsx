'use client';

import React from 'react';

/**
 * SectionHeader
 * Editorial section header featuring uppercase micro label,
 * optional serif title (20-24px), and a clean 1px hairline divider.
 */
export function SectionHeader({
  eyebrow,
  title,
  action,
  hairline = true,
  className = '',
}) {
  return (
    <div className={`space-y-1.5 ${hairline ? 'border-b border-hairline pb-2.5' : ''} ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {eyebrow && (
            <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium font-sans">
              {eyebrow}
            </span>
          )}
          {title && (
            <h2 className="font-serif text-[20px] sm:text-[22px] text-ink font-normal tracking-tight">
              {title}
            </h2>
          )}
        </div>
        {action && (
          <div className="shrink-0 flex items-center gap-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

export default SectionHeader;
