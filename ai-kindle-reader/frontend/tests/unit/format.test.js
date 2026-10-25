import { describe, it, expect } from 'vitest';
import { pluralize } from '@/lib/format';

describe('lib/format/pluralize', () => {
  it('formats singular counts correctly', () => {
    expect(pluralize(1, 'book')).toBe('1 book');
    expect(pluralize(1, 'entry', 'entries')).toBe('1 entry');
    expect(pluralize(-1, 'minute')).toBe('-1 minute');
  });

  it('formats plural counts correctly', () => {
    expect(pluralize(0, 'book')).toBe('0 books');
    expect(pluralize(2, 'book')).toBe('2 books');
    expect(pluralize(10, 'entry', 'entries')).toBe('10 entries');
    expect(pluralize(1000, 'page')).toBe('1,000 pages');
  });

  it('supports omitting the count number when includeCount is false', () => {
    expect(pluralize(1, 'book', 'books', false)).toBe('book');
    expect(pluralize(5, 'book', 'books', false)).toBe('books');
  });

  it('handles invalid or non-numeric counts gracefully', () => {
    expect(pluralize(null, 'word')).toBe('0 words');
    expect(pluralize(undefined, 'word')).toBe('0 words');
  });
});
