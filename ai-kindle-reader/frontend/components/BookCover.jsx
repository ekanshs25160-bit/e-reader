'use client';

import React from 'react';
import Cover from '@/components/ui/Cover';

/**
 * BookCover adapter that renders the shared flat Editorial Cover.
 * Preserves interface while eliminating drop-shadows and gradients.
 */
export default function BookCover({
  coverUrl,
  src,
  title = 'Untitled Volume',
  author = 'Unknown Author',
  className = '',
  aspect = 'aspect-[2/3]',
}) {
  return (
    <Cover
      src={coverUrl || src}
      title={title}
      author={author}
      aspect={aspect}
      className={className}
    />
  );
}
