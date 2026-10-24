'use client';

import React from 'react';

/**
 * EmptyState
 * Editorial empty and quiet state:
 * - 300-weight thin line icon
 * - Serif regular title (20-22px)
 * - Calm, restrained microcopy with no exclamation marks
 * - Single primary action button
 */
export function EmptyState({
  icon = 'auto_stories',
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`py-12 sm:py-16 px-6 flex flex-col items-center justify-center text-center bg-surface border border-hairline rounded-[12px] ${className}`}
    >
      {icon && (
        <span
          className="material-symbols-outlined text-[32px] text-muted mb-3"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 32" }}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <h3 className="font-serif text-[20px] sm:text-[22px] font-normal text-ink tracking-tight mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="font-sans text-[14px] text-muted max-w-sm leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action && (
        <div className="flex items-center justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
