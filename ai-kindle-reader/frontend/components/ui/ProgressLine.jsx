'use client';

import React from 'react';

/**
 * ProgressLine
 * Editorial 2-4px accent line progress bar.
 * Accent hue is reserved strictly for reading progress, active states, and single highlights.
 */
export function ProgressLine({
  value = 0,
  max = 100,
  thickness = 'regular', // 'thin' (2px) | 'regular' (4px)
  label,
  showPercentage = false,
  className = '',
}) {
  const safeMax = max > 0 ? max : 100;
  const clamped = Math.min(Math.max(value, 0), safeMax);
  const percentage = Math.round((clamped / safeMax) * 100);

  const heightClass = thickness === 'thin' ? 'h-[2px]' : 'h-[4px]';

  return (
    <div className={`w-full space-y-1.5 ${className}`}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-[10.5px] uppercase tracking-[0.12em] text-muted font-medium font-sans">
          {label && <span>{label}</span>}
          {showPercentage && <span className="tabular-nums ml-auto">{percentage}%</span>}
        </div>
      )}
      <div
        className={`w-full ${heightClass} bg-hairline/40 rounded-full overflow-hidden`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressLine;
