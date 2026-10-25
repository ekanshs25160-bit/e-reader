'use client';

import React from 'react';

/**
 * Skeleton
 * Quiet, flat placeholder loader:
 * - No aggressive gradients or loud shines
 * - Matches exact typographic line heights and container dimensions
 * - Eliminates layout shift during data hydration
 */
export function Skeleton({
  variant = 'text', // 'text' | 'title' | 'circle' | 'rect' | 'card' | 'spine'
  width,
  height,
  className = '',
  ...props
}) {
  const variantStyles = {
    text: 'h-4 w-full rounded-[4px]',
    title: 'h-7 w-3/4 rounded-[6px]',
    circle: 'w-10 h-10 rounded-full shrink-0',
    rect: 'w-full h-24 rounded-[8px]',
    card: 'w-full h-36 rounded-[12px] border border-hairline',
    spine: 'w-11 h-48 rounded-t-sm rounded-b-[2px] border-l border-r border-hairline',
  }[variant] || 'h-4 w-full rounded-[4px]';

  const inlineStyles = {};
  if (width) inlineStyles.width = typeof width === 'number' ? `${width}px` : width;
  if (height) inlineStyles.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      aria-hidden="true"
      className={`bg-hairline/40 animate-pulse select-none ${variantStyles} ${className}`}
      style={inlineStyles}
      {...props}
    />
  );
}

export default Skeleton;
