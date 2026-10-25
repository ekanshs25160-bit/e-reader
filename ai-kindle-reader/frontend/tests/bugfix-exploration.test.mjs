import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readerThemesPath = path.resolve(__dirname, '../src/features/reader/engine/themes.js');
const readerEpubPath = path.resolve(__dirname, '../src/features/reader/hooks/useEpubRendition.js');
const readerHeaderPath = path.resolve(__dirname, '../src/features/reader/components/ReaderHeader.jsx');
const readerFooterPath = path.resolve(__dirname, '../src/features/reader/components/ReaderFooter.jsx');

test('Property 1: Bug Condition Exploration (Expected to FAIL on unfixed code)', async (t) => {
  await t.test('Sub-property A — Padding (isBugCondition_layout)', () => {
    const code = fs.readFileSync(readerThemesPath, 'utf8');
    const start = code.indexOf('rendition.themes.default(');
    assert.notStrictEqual(start, -1, 'rendition.themes.default call must exist');

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
    const palette = { bg: '#000000', text: '#EDEDED' };
    const fontStack = 'Literata';
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
    const themeObj = fn(palette, fontStack, cursorHidden, chosenAlign, chosenLineHeight, chosenFontSize);

    // On unfixed code, padding-left and padding-right are missing, causing right-edge text clip.
    assert.strictEqual(
      themeObj['html, body']['padding-left'],
      '0 !important',
      '"html, body"["padding-left"] must be "0 !important"'
    );
    assert.strictEqual(
      themeObj['html, body']['padding-right'],
      '0 !important',
      '"html, body"["padding-right"] must be "0 !important"'
    );
    assert.strictEqual(
      themeObj['html, body']['padding-top'],
      '0 !important',
      '"html, body"["padding-top"] must be "0 !important"'
    );
    assert.strictEqual(
      themeObj['html, body']['padding-bottom'],
      '0 !important',
      '"html, body"["padding-bottom"] must be "0 !important"'
    );
  });

  await t.test('Sub-property B — Overflow race (isBugCondition_overflow)', () => {
    const code = fs.readFileSync(readerEpubPath, 'utf8');

    // On unfixed code, there is no MutationObserver setup immediately after renderTo
    // nor synchronous viewerRef.current.style.overflow = "hidden"
    const hasSyncViewerClip = /viewerRef\.current\.style[\s\S]*?overflow\s*=\s*["']hidden["']/.test(code);
    const hasMutationObserverForEpubContainer = /new\s+MutationObserver\s*\(\s*\(\)\s*=>\s*\{[\s\S]*?\.epub-container[\s\S]*?style\.overflow\s*=\s*["']hidden["']/.test(code);

    assert.ok(
      hasSyncViewerClip,
      'viewerRef.current.style.overflow must be synchronously set to "hidden" before rendition.display'
    );
    assert.ok(
      hasMutationObserverForEpubContainer,
      'MutationObserver must be attached to viewerRef to clip .epub-container immediately when it appears'
    );
  });

  await t.test('Sub-property C — Theme color (isBugCondition_theme)', () => {
    const code = fs.readFileSync(readerHeaderPath, 'utf8') + '\n' + fs.readFileSync(readerFooterPath, 'utf8');

    // 1. Settings icon span inside Appearance button in header
    const settingsMatch = code.match(/<button[\s\S]*?aria-label="Appearance settings \(A\)"[\s\S]*?<span[^>]*>settings<\/span>[\s\S]*?<\/button>/);
    assert.ok(settingsMatch, 'Appearance settings button with settings span must exist');
    const settingsSpan = settingsMatch[0].match(/<span[^>]*>settings<\/span>/)[0];
    const settingsHasStyle = /style=\{\{\s*color:\s*["']var\(--reader-fg\)["']\s*\}\}/.test(settingsSpan);
    assert.ok(
      settingsHasStyle,
      'Settings icon <span> in header must carry style={{ color: "var(--reader-fg)" }}'
    );

    // 2. Contents label and icon in bottom nav
    const contentsMatch = code.match(/<button[\s\S]*?aria-label="Table of contents \(C\)"[\s\S]*?<\/button>/);
    assert.ok(contentsMatch, 'Table of contents button must exist');
    const contentsSpan = contentsMatch[0].match(/<span[^>]*>Contents<\/span>/)[0];
    const contentsHasStyle = /style=\{\{\s*color:\s*["']inherit["']\s*\}\}/.test(contentsSpan);
    assert.ok(
      contentsHasStyle,
      'Contents label <span> in bottom nav must carry style={{ color: "inherit" }}'
    );

    // 3. PAGE progress text in bottom nav
    const progressMatch = code.match(/<span[^>]*>\s*PAGE\s+\{pageInfo\.current\}[\s\S]*?<\/span>/);
    assert.ok(progressMatch, 'PAGE progress text span must exist');
    const progressHasStyle = /style=\{\{\s*color:\s*["']var\(--reader-fg\)["']\s*\}\}/.test(progressMatch[0]);
    assert.ok(
      progressHasStyle,
      'PAGE progress text <span> in bottom nav must carry style={{ color: "var(--reader-fg)" }}'
    );

    // 4. Appearance label in bottom nav
    const bottomNavMatch = code.match(/<nav[\s\S]*?<\/nav>/);
    assert.ok(bottomNavMatch, 'Bottom nav must exist');
    const appearanceSpan = bottomNavMatch[0].match(/<span[^>]*>Appearance<\/span>/)[0];
    const appearanceHasStyle = /style=\{\{\s*color:\s*["']inherit["']\s*\}\}/.test(appearanceSpan);
    assert.ok(
      appearanceHasStyle,
      'Appearance label <span> in bottom nav must carry style={{ color: "inherit" }}'
    );
  });
});
