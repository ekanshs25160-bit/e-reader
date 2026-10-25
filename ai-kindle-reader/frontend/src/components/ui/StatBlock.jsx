'use client';

import React from 'react';

/**
 * StatBlock
 * Editorial metric display with a serif number (32-36px),
 * tabular numerals, and uppercase micro label.
 */
export function StatBlock({
  value,
  label,
  unit,
  subtext,
  className = '',
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-1">
        <span className="font-serif text-[32px] sm:text-[36px] font-normal text-ink tabular-nums leading-none tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="font-sans text-[13.5px] text-muted font-normal">
            {unit}
          </span>
        )}
      </div>
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium font-sans mt-1.5">
        {label}
      </span>
      {subtext && (
        <span className="font-sans text-[12px] text-muted/80 mt-0.5">
          {subtext}
        </span>
      )}
    </div>
  );
}

export default StatBlock;
