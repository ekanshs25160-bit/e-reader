'use client';

import React from 'react';

/**
 * Card
 * Flat editorial card surface. No drop shadows, no gradients.
 * 12px border radius, 1px hairline border, surface background.
 */
export function Card({
  children,
  interactive = false,
  as: Component = 'div',
  className = '',
  ...props
}) {
  return (
    <Component
      className={`bg-surface border border-hairline rounded-[12px] p-5 sm:p-6 transition-colors ${
        interactive
          ? 'hover:border-ink/25 cursor-pointer active:scale-[0.995] transition-all'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export default Card;
