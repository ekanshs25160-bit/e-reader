'use client';

import React from 'react';

const SIZE_MAP = {
  narrow: 'max-w-3xl',
  reading: 'max-w-2xl',
  default: 'max-w-6xl 2xl:max-w-[1280px]',
};

export function PageContainer({
  size = 'default',
  className = '',
  children,
  ...props
}) {
  const maxWClass = SIZE_MAP[size] || SIZE_MAP.default;

  return (
    <div
      data-page-container=""
      data-size={size}
      className={`mx-auto w-full px-4 sm:px-6 lg:px-10 pt-7 pb-28 md:pb-12 ${maxWClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  );
}

export default PageContainer;
