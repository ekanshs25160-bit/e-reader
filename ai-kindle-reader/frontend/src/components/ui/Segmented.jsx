'use client';

import React from 'react';

/**
 * Segmented (Tabs)
 * Editorial segmented pill control:
 * - container: 1px hairline pill
 * - active tab: ink-filled pill with paper text
 * - inactive tab: muted text with calm hover transition
 */
export function Segmented({
  options = [],
  value,
  onChange,
  size = 'md',
  fullWidth = false,
  className = '',
}) {
  const sizeClasses = {
    sm: 'text-[11px] min-[400px]:text-[12px] px-1.5 min-[400px]:px-2.5 sm:px-3.5 py-1.5 min-h-[44px] sm:min-h-[34px]',
    md: 'text-[12px] min-[400px]:text-[13px] px-1.5 min-[400px]:px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-[38px]',
    lg: 'text-[13px] min-[400px]:text-[14px] px-2 min-[400px]:px-4 sm:px-5 py-2.5 min-h-[44px]',
  }[size] || 'text-[12px] min-[400px]:text-[13px] px-1.5 min-[400px]:px-3 sm:px-4 py-2 min-h-[44px] sm:min-h-[38px]';

  const containerClasses = fullWidth
    ? 'flex w-full'
    : 'inline-flex max-w-full overflow-x-auto no-scrollbar';

  const tabWidthClass = fullWidth ? 'flex-1 min-w-0' : 'shrink-0 min-w-[44px] sm:min-w-0';

  return (
    <div
      role="tablist"
      className={`${containerClasses} items-center p-1 rounded-full border border-hairline bg-surface/70 backdrop-blur-sm gap-0.5 ${className}`.trim()}
    >
      {options.map((opt) => {
        const optId = typeof opt === 'string' ? opt : (opt.id ?? opt.value);
        const optLabel = typeof opt === 'string' ? opt : (opt.label ?? opt.name ?? optId);
        const isSelected = optId === value;
        return (
          <button
            key={optId}
            role="tab"
            type="button"
            aria-selected={isSelected}
            onClick={() => onChange?.(optId)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full font-sans font-medium whitespace-nowrap transition-all duration-200 ease-out select-none active:scale-[0.98] focus:outline-none ${tabWidthClass} ${sizeClasses} ${
              isSelected
                ? 'bg-ink text-background shadow-none'
                : 'text-muted hover:text-ink hover:bg-hairline/20'
            }`}
          >
            {opt.icon && (
              <span
                className="material-symbols-outlined text-[17px] shrink-0"
                style={{
                  fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 18",
                  color: isSelected ? 'var(--theme-contrast)' : 'inherit',
                }}
                aria-hidden="true"
              >
                {opt.icon}
              </span>
            )}
            <span>{optLabel}</span>
            {typeof opt.badge !== 'undefined' && (
              <span
                className={`text-[10px] tabular-nums font-normal ${
                  isSelected ? 'text-background/80' : 'text-muted/70'
                }`}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Segmented;
