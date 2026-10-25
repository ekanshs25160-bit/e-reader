/**
 * Unit test — theme object shape (Task 4.1)
 *
 * Validates: Requirements 2.1
 *
 * Uses the same static source-reading approach as bugfix-exploration.test.mjs.
 * No React mounting required.
 *
 * For each of the four palettes (paper, sepia, night, oled) this test:
 *   1. Extracts the argument passed to rendition.themes.default() from source
 *   2. Evaluates it with the palette's values injected
 *   3. Asserts that ["html, body"]["padding-left/right/top/bottom"] === "0 !important"
 *   4. Asserts no regressions: background, color, font-family, margin, overflow,
 *      height, width keys are still present and non-empty
 */

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readerCanvasPath = path.resolve(__dirname, '../src/features/reader/engine/themes.js');

// --------------------------------------------------------------------------
// Helper: extract the argument string of rendition.themes.default(...)
// --------------------------------------------------------------------------
function extractThemesDefaultArg(code) {
  const marker = 'rendition.themes.default(';
  const start = code.indexOf(marker);
  assert.notStrictEqual(start, -1, 'rendition.themes.default( call must exist in ReaderCanvas.jsx');

  const argStart = start + marker.length;
  let depth = 1;
  let i = argStart;
  for (; i < code.length; i++) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') {
      depth--;
      if (depth === 0) break;
    }
  }
  return code.slice(argStart, i).trim();
}

// --------------------------------------------------------------------------
// Helper: evaluate the theme object for a given palette
// --------------------------------------------------------------------------
function evaluateThemeObj(argStr, palette) {
  // Variables required by the argument expression in ReaderCanvas.jsx
  const fontStack = "'Literata', Georgia, serif";
  const cursorHidden = false;
  const chosenAlign = 'justify';
  const chosenLineHeight = '1.6';
  const chosenFontSize = 18;

  const fn = new Function(
    'palette',
    'fontStack',
    'cursorHidden',
    'chosenAlign',
    'chosenLineHeight',
    'chosenFontSize',
    'return (' + argStr + ');'
  );

  return fn(palette, fontStack, cursorHidden, chosenAlign, chosenLineHeight, chosenFontSize);
}

// --------------------------------------------------------------------------
// The four THEME_PALETTES entries that map to paper / sepia / night / oled
// (mirrors the values in ReaderCanvas.jsx)
// --------------------------------------------------------------------------
const PALETTES = {
  paper: { bg: '#FAF9F6', text: '#152A41', outer: '#FAF9F6' },
  sepia: { bg: '#F4ECD8', text: '#2C2214', outer: '#F4ECD8' },
  night: { bg: '#141824', text: '#F0F2F5', outer: '#141824' },
  oled:  { bg: '#000000', text: '#EDEDED', outer: '#000000' },
};

// --------------------------------------------------------------------------
// Required regression keys: present in "html, body" and must be non-empty
// --------------------------------------------------------------------------
const REGRESSION_KEYS = [
  'background',
  'color',
  'font-family',
  'margin',
  'overflow',
  'height',
  'width',
];

// --------------------------------------------------------------------------
// Main test suite
// --------------------------------------------------------------------------
test('Task 4.1 — Theme object shape: padding keys present and correct', async (t) => {
  const code = fs.readFileSync(readerCanvasPath, 'utf8');
  const argStr = extractThemesDefaultArg(code);

  for (const [paletteName, palette] of Object.entries(PALETTES)) {
    await t.test(`palette: ${paletteName} — padding keys are "0 !important"`, () => {
      const themeObj = evaluateThemeObj(argStr, palette);
      const htmlBody = themeObj['html, body'];

      assert.ok(
        htmlBody !== undefined && htmlBody !== null,
        `themeObj["html, body"] must exist for palette "${paletteName}"`
      );

      assert.strictEqual(
        htmlBody['padding-left'],
        '0 !important',
        `[${paletteName}] "html, body"["padding-left"] must be "0 !important"`
      );

      assert.strictEqual(
        htmlBody['padding-right'],
        '0 !important',
        `[${paletteName}] "html, body"["padding-right"] must be "0 !important"`
      );

      assert.strictEqual(
        htmlBody['padding-top'],
        '0 !important',
        `[${paletteName}] "html, body"["padding-top"] must be "0 !important"`
      );

      assert.strictEqual(
        htmlBody['padding-bottom'],
        '0 !important',
        `[${paletteName}] "html, body"["padding-bottom"] must be "0 !important"`
      );
    });

    await t.test(`palette: ${paletteName} — regression: required keys still present and non-empty`, () => {
      const themeObj = evaluateThemeObj(argStr, palette);
      const htmlBody = themeObj['html, body'];

      for (const key of REGRESSION_KEYS) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(htmlBody, key),
          `[${paletteName}] "html, body"["${key}"] must still exist (regression check)`
        );
        assert.ok(
          typeof htmlBody[key] === 'string' && htmlBody[key].trim().length > 0,
          `[${paletteName}] "html, body"["${key}"] must be a non-empty string (regression check)`
        );
      }
    });
  }
});
