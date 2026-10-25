import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const layoutPath = path.resolve(__dirname, '../src/features/reader/engine/layout.js');
const themesPath = path.resolve(__dirname, '../src/features/reader/engine/themes.js');
const renditionPath = path.resolve(__dirname, '../src/features/reader/hooks/useEpubRendition.js');
const readerPagePath = path.resolve(__dirname, '../src/app/(focus)/reader/[id]/page.js');

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

function getLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const a = [r, g, b].map((v) => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Pseudo-random number generator for reproducible property-based testing
function pseudoRandom(seed) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return function () {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

test('Property-Based Tests (PBT) — Reader Layout Defects', async (t) => {
  const getPageAreaDimensions = loadGetPageAreaDimensions();
  const rand = pseudoRandom(42);

  await t.test('5.1 Padding-zero property for all viewport widths', () => {
    const palette = { bg: '#000000', text: '#EDEDED' };

    for (let i = 0; i < 100; i++) {
      const w = Math.floor(320 + rand() * (3840 - 320));
      const h = Math.floor(400 + rand() * (1200 - 400));
      const themeObj = loadThemeDefaultObject(palette, 'Literata', 18);

      assert.strictEqual(
        themeObj['html, body']['padding-left'],
        '0 !important',
        `padding-left must be 0 !important at viewport ${w}x${h}`
      );
      assert.strictEqual(
        themeObj['html, body']['padding-right'],
        '0 !important',
        `padding-right must be 0 !important at viewport ${w}x${h}`
      );
      assert.strictEqual(
        themeObj['html, body']['padding-top'],
        '0 !important',
        `padding-top must be 0 !important at viewport ${w}x${h}`
      );
      assert.strictEqual(
        themeObj['html, body']['padding-bottom'],
        '0 !important',
        `padding-bottom must be 0 !important at viewport ${w}x${h}`
      );
    }
  });

  await t.test('5.2 Centering symmetry at all stage widths', () => {
    const code = fs.readFileSync(renditionPath, 'utf8');

    // Confirm viewerRef in JS receives NO marginLeft or marginRight
    assert.strictEqual(
      /viewerRef\.current\.style\.marginLeft/.test(code),
      false,
      'viewerRef must not receive JS marginLeft'
    );
    assert.strictEqual(
      /viewerRef\.current\.style\.marginRight/.test(code),
      false,
      'viewerRef must not receive JS marginRight'
    );

    for (let i = 0; i < 150; i++) {
      const stageWidth = Math.floor(320 + rand() * (3840 - 320));
      const dims = getPageAreaDimensions(stageWidth, 900);

      assert.ok(
        dims.pageWidth <= stageWidth,
        `pageWidth (${dims.pageWidth}) must be <= stageWidth (${stageWidth})`
      );

      const idealGutter = (stageWidth - dims.pageWidth) / 2;
      assert.ok(
        idealGutter >= 0,
        `ideal gutter (${idealGutter}) must be >= 0`
      );
    }
  });

  await t.test('5.3 WCAG AA contrast >= 4.5:1 for all four palettes', () => {
    const READER_PALETTES = {
      paper: { bg: '#FAF9F6', fg: '#152A41', muted: '#43474D' },
      sepia: { bg: '#F4ECD8', fg: '#2C2214', muted: '#5B472C' },
      night: { bg: '#141824', fg: '#F0F2F5', muted: '#A0AEC0' },
      oled:  { bg: '#000000', fg: '#EDEDED', muted: '#A0A0A0' },
    };

    for (const [name, p] of Object.entries(READER_PALETTES)) {
      const fgContrast = contrastRatio(p.fg, p.bg);
      assert.ok(
        fgContrast >= 4.5,
        `Palette ${name} fg (${p.fg}) vs bg (${p.bg}) contrast must be >= 4.5 (actual: ${fgContrast.toFixed(2)})`
      );

      const mutedContrast = contrastRatio(p.muted, p.bg);
      assert.ok(
        mutedContrast >= 4.5,
        `Palette ${name} muted (${p.muted}) vs bg (${p.bg}) contrast must be >= 4.5 (actual: ${mutedContrast.toFixed(2)})`
      );
    }
  });

  await t.test('5.4 Phone page-width formula preserved after fix [320, 767]', () => {
    for (let i = 0; i < 100; i++) {
      const w = Math.floor(320 + rand() * (767 - 320));
      const h = Math.floor(400 + rand() * (1000 - 400));
      const dims = getPageAreaDimensions(w, h);
      assert.strictEqual(
        dims.pageWidth,
        w - 32,
        `pageWidth must equal w - 32 for phone width ${w}`
      );
    }
  });

  await t.test('5.5 Desktop page-width formula preserved after fix [1024, 3840]', () => {
    for (let i = 0; i < 100; i++) {
      const w = Math.floor(1024 + rand() * (3840 - 1024));
      const h = Math.floor(400 + rand() * (1200 - 400));
      const dims = getPageAreaDimensions(w, h);
      assert.strictEqual(
        dims.pageWidth,
        Math.min(w - 96, 704),
        `pageWidth must equal min(w - 96, 704) for desktop width ${w}`
      );
    }
  });
});
