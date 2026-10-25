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
    <div className={`flex flex-col min-w-0 ${className}`}>
      <div className="flex items-baseline gap-1 flex-wrap">
        <span className="font-serif text-[28px] sm:text-[32px] lg:text-[36px] font-normal text-ink tabular-nums leading-none tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="font-sans text-[12px] sm:text-[13.5px] text-muted font-normal">
            {unit}
          </span>
        )}
      </div>
      <span className="text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium font-sans mt-1.5 whitespace-nowrap">
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
