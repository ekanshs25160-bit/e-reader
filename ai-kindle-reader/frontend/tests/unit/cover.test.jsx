import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { Cover } from '@/components/ui/Cover';

describe('Cover Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders an img tag with alt="Cover of {title}" when src is provided', () => {
    const html = ReactDOMServer.renderToString(
      <Cover src="http://example.com/cover.jpg" title="Great Expectations" author="Charles Dickens" />
    );

    expect(html).toContain('img');
    expect(html).toContain('src="http://example.com/cover.jpg"');
    expect(html).toContain('alt="Cover of Great Expectations"');
  });

  it('accepts deprecated coverUrl prop and warns once in development', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const html = ReactDOMServer.renderToString(
      <Cover coverUrl="http://example.com/cover2.jpg" title="Bleak House" />
    );

    expect(html).toContain('src="http://example.com/cover2.jpg"');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('coverUrl')
    );
  });

  it('renders only a centered serif monogram when size="sm" and there is no image', () => {
    const html = ReactDOMServer.renderToString(
      <Cover size="sm" title="Pride and Prejudice" author="Jane Austen" />
    );

    // Should contain monogram "P"
    expect(html).toContain('P');
    // Should NOT contain the author text or full title
    expect(html).not.toContain('Jane Austen');
    expect(html).not.toContain('Pride and Prejudice');
    expect(html).not.toContain('FLYLEAF');
    // Should NOT contain an img element
    expect(html).not.toContain('<img');
  });

  it('renders the full typographic jacket when size="md" and there is no image', () => {
    const html = ReactDOMServer.renderToString(
      <Cover size="md" title="Moby Dick" author="Herman Melville" />
    );

    // Should contain author and title text
    expect(html).toContain('Herman Melville');
    expect(html).toContain('Moby Dick');
    expect(html).toContain('FLYLEAF');
    // Should NOT contain an img element
    expect(html).not.toContain('<img');
  });

  it('falls back to "U" monogram when title is empty', () => {
    const html = ReactDOMServer.renderToString(
      <Cover size="sm" title="" />
    );

    expect(html).toContain('U');
  });
});
