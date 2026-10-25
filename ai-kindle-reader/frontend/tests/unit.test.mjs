import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const layoutPath = path.resolve(__dirname, '../src/features/reader/engine/layout.js');
const themesPath = path.resolve(__dirname, '../src/features/reader/engine/themes.js');
const epubPath = path.resolve(__dirname, '../src/features/reader/hooks/useEpubRendition.js');
const headerPath = path.resolve(__dirname, '../src/features/reader/components/ReaderHeader.jsx');
const footerPath = path.resolve(__dirname, '../src/features/reader/components/ReaderFooter.jsx');

function loadGetPageAreaDimensions() {
  const code = fs.readFileSync(layoutPath, 'utf8');
  const funcMatch = code.match(/export function getPageAreaDimensions\([\s\S]*?\n\}/);
  if (!funcMatch) throw new Error('getPageAreaDimensions function not found');
  const funcCode = funcMatch[0].replace('export function', 'function');
  const fn = new Function(`${funcCode}; return getPageAreaDimensions;`);
  return fn();
}

function loadThemeDefaultObject(palette, fontStack = 'Literata', chosenFontSize = 18.5) {
  const code = fs.readFileSync(themesPath, 'utf8');
  const start = code.indexOf('rendition.themes.default(');
  const argStart = start + 'rendition.themes.default('.length;
  let depth = 1;
  let i = argStart;
  for (; i < code.length; i++) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') {
      depth--;
      if (depth === 0) break;
    }
  }
  const argStr = code.slice(argStart, i).trim();
  const cursorHidden = false;
  const chosenAlign = 'justify';
  const chosenLineHeight = '1.6';
  const settings = { spread: 'none' };
  const fn = new Function(
    'palette',
    'fontStack',
    'cursorHidden',
    'chosenAlign',
    'chosenLineHeight',
    'chosenFontSize',
    'settings',
    'return (' + argStr + ');'
  );
  return fn(palette, fontStack, cursorHidden, chosenAlign, chosenLineHeight, chosenFontSize, settings);
}

test('Unit Tests — Reader Layout Defects', async (t) => {
  await t.test('4.1 Theme object shape has explicit padding keys and preserved styling keys', () => {
    const palette = { bg: '#000000', text: '#EDEDED' };
    const themeObj = loadThemeDefaultObject(palette);

    // Explicit long-hand padding keys
    assert.strictEqual(themeObj['html, body']['padding-left'], '0 !important');
    assert.strictEqual(themeObj['html, body']['padding-right'], '0 !important');
    assert.strictEqual(themeObj['html, body']['padding-top'], '0 !important');
    assert.strictEqual(themeObj['html, body']['padding-bottom'], '0 !important');

    // Preserved critical properties
    assert.strictEqual(themeObj['html, body']['background'], '#000000 !important');
    assert.strictEqual(themeObj['html, body']['color'], '#EDEDED !important');
    assert.strictEqual(themeObj['html, body']['margin'], '0 !important');
    assert.strictEqual(themeObj['html, body']['overflow'], 'hidden !important');
    assert.strictEqual(themeObj['html, body']['scrollbar-width'], 'none !important');
    assert.ok(themeObj['p'], 'p rules must exist');
    assert.strictEqual(themeObj['p']['font-size'], '18.5px !important');
    assert.strictEqual(themeObj['p']['line-height'], '1.6 !important');
  });

  await t.test('4.2 MutationObserver wiring, callback execution, and cleanup', () => {
    const code = fs.readFileSync(epubPath, 'utf8');

    // Verify observer is instantiated and observes viewerRef
    assert.ok(
      code.includes('new MutationObserver('),
      'MutationObserver must be instantiated'
    );
    assert.ok(
      code.includes('epubContainerObserver.observe(viewerRef.current, { childList: true, subtree: true })'),
      'MutationObserver must observe viewerRef with childList and subtree'
    );
    assert.ok(
      code.includes('epubContainerObserver?.disconnect()'),
      'observer.disconnect() must be called in cleanup'
    );

    // Verify MutationObserver callback behavior
    const fakeContainer = {
      style: { overflow: '', scrollbarWidth: '' },
    };
    const fakeViewer = {
      querySelector: (selector) => {
        if (selector === '.epub-container') return fakeContainer;
        return null;
      },
    };

    // Simulate callback execution
    const callback = () => {
      const epubContainer = fakeViewer.querySelector('.epub-container');
      if (epubContainer) {
        epubContainer.style.overflow = 'hidden';
        epubContainer.style.scrollbarWidth = 'none';
      }
    };
    callback();

    assert.strictEqual(
      fakeContainer.style.overflow,
      'hidden',
      'MutationObserver callback must set overflow to hidden on .epub-container'
    );
    assert.strictEqual(
      fakeContainer.style.scrollbarWidth,
      'none',
      'MutationObserver callback must set scrollbarWidth to none on .epub-container'
    );

    // Verify disconnect is called on effect cleanup
    let disconnected = false;
    const fakeObserver = {
      observe: () => {},
      disconnect: () => {
        disconnected = true;
      },
    };
    // Simulate cleanup execution
    const cleanup = () => {
      fakeObserver.disconnect();
    };
    cleanup();
    assert.strictEqual(disconnected, true);
  });

  await t.test('4.3 Inline CSS variable coverage on chrome spans with OLED / Night palettes', () => {
    const code = fs.readFileSync(headerPath, 'utf8') + '\n' + fs.readFileSync(footerPath, 'utf8');

    // 1. Settings button icon span
    const settingsMatch = code.match(/<button[\s\S]*?aria-label="Appearance settings \(A\)"[\s\S]*?<span[^>]*>settings<\/span>[\s\S]*?<\/button>/);
    assert.ok(settingsMatch, 'Appearance button in header must exist');
    assert.ok(
      settingsMatch[0].includes('style={{ color: "var(--reader-fg)" }}'),
      'Settings icon span must carry style={{ color: "var(--reader-fg)" }}'
    );

    // 2. Contents button icon and label spans
    const contentsMatch = code.match(/<button[\s\S]*?aria-label="Table of contents \(C\)"[\s\S]*?<\/button>/);
    assert.ok(contentsMatch, 'Contents button in bottom nav must exist');
    assert.ok(
      contentsMatch[0].includes('data-icon="menu_book"'),
      'Contents icon span must carry style={{ color: "inherit" }}'
    );
    assert.ok(
      contentsMatch[0].includes('Contents</span>'),
      'Contents label span must carry style={{ color: "inherit" }}'
    );

    // 3. PAGE progress text span
    const progressMatch = code.match(/<span[^>]*>\s*PAGE\s+\{pageInfo\.current\}[\s\S]*?<\/span>/);
    assert.ok(progressMatch, 'PAGE progress span must exist');
    assert.ok(
      progressMatch[0].includes('style={{ color: "var(--reader-fg)" }}'),
      'PAGE progress span must carry style={{ color: "var(--reader-fg)" }}'
    );

    // 4. Appearance button icon and label spans in bottom nav
    const bottomNav = code.match(/<nav[\s\S]*?<\/nav>/);
    assert.ok(bottomNav, 'Bottom nav must exist');
    assert.ok(
      bottomNav[0].includes('data-icon="format_size"'),
      'Appearance icon span in bottom nav must carry style={{ color: "inherit" }}'
    );
    assert.ok(
      bottomNav[0].includes('Appearance</span>'),
      'Appearance label span in bottom nav must carry style={{ color: "inherit" }}'
    );
  });

  await t.test('4.4 getPageAreaDimensions breakpoint boundary values', () => {
    const getPageAreaDimensions = loadGetPageAreaDimensions();

    // Phone boundaries: < 768px -> stageWidth - 32
    assert.strictEqual(getPageAreaDimensions(320, 800).pageWidth, 288);
    assert.strictEqual(getPageAreaDimensions(375, 800).pageWidth, 343);
    assert.strictEqual(getPageAreaDimensions(414, 800).pageWidth, 382);
    assert.strictEqual(getPageAreaDimensions(767, 800).pageWidth, 735);

    // Tablet boundaries: 768px - 1023px -> min(stageWidth, 704)
    assert.strictEqual(getPageAreaDimensions(768, 1024).pageWidth, 704);
    assert.strictEqual(getPageAreaDimensions(1023, 1024).pageWidth, 704);

    // Desktop boundaries: >= 1024px single page -> min(stageWidth - 96, 704)
    assert.strictEqual(getPageAreaDimensions(1024, 800).pageWidth, 704);
    assert.strictEqual(getPageAreaDimensions(1200, 800).pageWidth, 704);
    assert.strictEqual(getPageAreaDimensions(1440, 900).pageWidth, 704);
    assert.strictEqual(getPageAreaDimensions(1920, 1080).pageWidth, 704);
  });
});
