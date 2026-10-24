'use client';

import React from 'react';

/**
 * Chip
 * Editorial pill chip:
 * - unselected: 1px hairline border, muted text
 * - selected: ink-filled with paper text and a 300-weight check icon
 */
export function Chip({
  label,
  selected = false,
  count,
  icon,
  onClick,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-sans text-[12.5px] font-medium transition-all duration-200 ease-out select-none min-h-[36px] active:scale-[0.98] focus:outline-none disabled:opacity-40 disabled:pointer-events-none ${
        selected
          ? 'bg-ink text-background border border-ink'
          : 'bg-transparent text-muted border border-hairline hover:text-ink hover:border-ink/25'
      } ${className}`}
      {...props}
    >
      {selected ? (
        <span
          className="material-symbols-outlined text-[15px] shrink-0 text-background"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 16" }}
          aria-hidden="true"
        >
          check
        </span>
      ) : icon ? (
        <span
          className="material-symbols-outlined text-[15px] shrink-0 text-muted"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 16" }}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <span>{label}</span>
      {typeof count === 'number' && (
        <span
          className={`text-[11px] tabular-nums font-normal ${
            selected ? 'text-background/80' : 'text-muted/70'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default Chip;
