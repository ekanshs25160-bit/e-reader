/**
 * unit-css-vars.test.mjs
 *
 * Static source-analysis unit tests that verify every chrome <span> in
 * frontend/app/(focus)/reader/[id]/page.js carries the correct CSS-variable
 * inline style (or "inherit") and that no chrome span carries a hard-coded hex
 * color value.
 *
 * Validates: Requirements 2.4 (Bug Condition d — CSS custom property coverage)
 */

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readerHeaderPath = path.resolve(__dirname, '../src/features/reader/components/ReaderHeader.jsx');
const readerFooterPath = path.resolve(__dirname, '../src/features/reader/components/ReaderFooter.jsx');

// ---------------------------------------------------------------------------
// Helper: read files once
// ---------------------------------------------------------------------------
const code = fs.readFileSync(readerHeaderPath, 'utf8') + '\n' + fs.readFileSync(readerFooterPath, 'utf8');

// ---------------------------------------------------------------------------
// 4.3-a  Settings icon <span> inside the header Appearance button
//        Expected: style={{ color: "var(--reader-fg)" }}
// ---------------------------------------------------------------------------
test('4.3-a: Settings icon <span> in header Appearance button has style={{ color: "var(--reader-fg)" }}', () => {
  // Locate the header Appearance button by its aria-label
  const buttonMatch = code.match(
    /aria-label="Appearance settings \(A\)"[\s\S]*?<\/button>/
  );
  assert.ok(buttonMatch, 'Header Appearance settings button must exist');

  // Within the matched button block, find the settings icon span
  const buttonBlock = buttonMatch[0];
  const settingsSpanMatch = buttonBlock.match(/<span[^>]*>[\s\n]*settings[\s\n]*<\/span>/);
  assert.ok(settingsSpanMatch, 'settings icon <span> must exist inside header Appearance button');

  const settingsSpan = settingsSpanMatch[0];
  const hasCorrectStyle = /style=\{\{\s*color:\s*["']var\(--reader-fg\)["']\s*\}\}/.test(settingsSpan);
  assert.ok(
    hasCorrectStyle,
    `Settings icon <span> must carry style={{ color: "var(--reader-fg)" }}, got:\n${settingsSpan}`
  );
});

// ---------------------------------------------------------------------------
// 4.3-b  Contents icon <span> (menu_book) in the bottom nav
//        Expected: style={{ color: "inherit" }}
// ---------------------------------------------------------------------------
test('4.3-b: Contents icon <span> (menu_book) in bottom nav has style={{ color: "inherit" }}', () => {
  // Locate the Table of contents button in the bottom nav
  const buttonMatch = code.match(
    /aria-label="Table of contents \(C\)"[\s\S]*?<\/button>/
  );
  assert.ok(buttonMatch, 'Table of contents (C) button must exist');

  const buttonBlock = buttonMatch[0];
  // Find the span that contains "menu_book"
  const iconSpanMatch = buttonBlock.match(/<span[^>]*>[\s\n]*menu_book[\s\n]*<\/span>/);
  assert.ok(iconSpanMatch, 'menu_book icon <span> must exist inside Contents button');

  const iconSpan = iconSpanMatch[0];
  const hasCorrectStyle = /style=\{\{\s*color:\s*["']inherit["']\s*\}\}/.test(iconSpan);
  assert.ok(
    hasCorrectStyle,
    `Contents icon <span> must carry style={{ color: "inherit" }}, got:\n${iconSpan}`
  );
});

// ---------------------------------------------------------------------------
// 4.3-c  Contents label <span> in the bottom nav
//        Expected: style={{ color: "inherit" }}
// ---------------------------------------------------------------------------
test('4.3-c: Contents label <span> in bottom nav has style={{ color: "inherit" }}', () => {
  const buttonMatch = code.match(
    /aria-label="Table of contents \(C\)"[\s\S]*?<\/button>/
  );
  assert.ok(buttonMatch, 'Table of contents (C) button must exist');

  const buttonBlock = buttonMatch[0];
  // Find the span that contains the text "Contents"
  const labelSpanMatch = buttonBlock.match(/<span[^>]*>[\s\n]*Contents[\s\n]*<\/span>/);
  assert.ok(labelSpanMatch, 'Contents label <span> must exist inside Contents button');

  const labelSpan = labelSpanMatch[0];
  const hasCorrectStyle = /style=\{\{\s*color:\s*["']inherit["']\s*\}\}/.test(labelSpan);
  assert.ok(
    hasCorrectStyle,
    `Contents label <span> must carry style={{ color: "inherit" }}, got:\n${labelSpan}`
  );
});

// ---------------------------------------------------------------------------
// 4.3-d  PAGE progress text <span> in the bottom nav
//        Expected: style={{ color: "var(--reader-fg)" }}
// ---------------------------------------------------------------------------
test('4.3-d: PAGE progress text <span> in bottom nav has style={{ color: "var(--reader-fg)" }}', () => {
  // The span contains the literal text "PAGE" followed by JSX expressions
  // Pattern: <span style={{ color: "var(--reader-fg)" }} ...> PAGE {pageInfo.current} ...
  const progressSpanMatch = code.match(
    /<span[^>]*style=\{\{\s*color:\s*["']var\(--reader-fg\)["']\s*\}\}[^>]*>[\s\n]*PAGE\s+\{pageInfo\.current\}/
  );
  assert.ok(
    progressSpanMatch,
    'PAGE progress text <span> with style={{ color: "var(--reader-fg)" }} must exist in bottom nav'
  );
});

// ---------------------------------------------------------------------------
// 4.3-e  Appearance icon <span> (format_size) in the bottom nav
//        Expected: style={{ color: "inherit" }}
// ---------------------------------------------------------------------------
test('4.3-e: Appearance icon <span> (format_size) in bottom nav has style={{ color: "inherit" }}', () => {
  // Find the bottom nav Appearance button (second aria-label="Appearance settings (A)" occurrence — in nav)
  // Collect all matches of the Appearance settings button
  const allButtonMatches = [...code.matchAll(
    /aria-label="Appearance settings \(A\)"[\s\S]*?<\/button>/g
  )];
  // The nav one is the last match (header button comes first, nav button second)
  assert.ok(allButtonMatches.length >= 2, 'There must be at least 2 Appearance settings buttons (header + bottom nav)');

  const navButtonBlock = allButtonMatches[allButtonMatches.length - 1][0];
  const iconSpanMatch = navButtonBlock.match(/<span[^>]*>[\s\n]*format_size[\s\n]*<\/span>/);
  assert.ok(iconSpanMatch, 'format_size icon <span> must exist inside bottom nav Appearance button');

  const iconSpan = iconSpanMatch[0];
  const hasCorrectStyle = /style=\{\{\s*color:\s*["']inherit["']\s*\}\}/.test(iconSpan);
  assert.ok(
    hasCorrectStyle,
    `Appearance icon <span> must carry style={{ color: "inherit" }}, got:\n${iconSpan}`
  );
});

// ---------------------------------------------------------------------------
// 4.3-f  Appearance label <span> in the bottom nav
//        Expected: style={{ color: "inherit" }}
// ---------------------------------------------------------------------------
test('4.3-f: Appearance label <span> in bottom nav has style={{ color: "inherit" }}', () => {
  const allButtonMatches = [...code.matchAll(
    /aria-label="Appearance settings \(A\)"[\s\S]*?<\/button>/g
  )];
  assert.ok(allButtonMatches.length >= 2, 'There must be at least 2 Appearance settings buttons (header + bottom nav)');

  const navButtonBlock = allButtonMatches[allButtonMatches.length - 1][0];
  const labelSpanMatch = navButtonBlock.match(/<span[^>]*>[\s\n]*Appearance[\s\n]*<\/span>/);
  assert.ok(labelSpanMatch, 'Appearance label <span> must exist inside bottom nav Appearance button');

  const labelSpan = labelSpanMatch[0];
  const hasCorrectStyle = /style=\{\{\s*color:\s*["']inherit["']\s*\}\}/.test(labelSpan);
  assert.ok(
    hasCorrectStyle,
    `Appearance label <span> must carry style={{ color: "inherit" }}, got:\n${labelSpan}`
  );
});

// ---------------------------------------------------------------------------
// 4.3-g  No chrome span in the main reader chrome carries a hard-coded hex color
//        in its style attribute.
//        Scope: <header>, <nav>, and progress/toast elements (i.e. everything
//        above the overlay sections and popover).
// ---------------------------------------------------------------------------
test('4.3-g: No chrome <span> in the main reader chrome carries a hard-coded hex color in its style attribute', () => {
  // Extract only the "main chrome" section — between the opening <header and
  // the closing </nav> that ends the bottom bar.  This excludes the selection
  // popover / highlights section which deliberately uses swatch bg colors.
  const headerStart = code.indexOf('<header');
  const navEnd = code.indexOf('</nav>');
  assert.ok(headerStart !== -1, 'Header element must be found');
  assert.ok(navEnd !== -1, 'Bottom nav closing tag must be found');

  const chromeSection = code.slice(headerStart, navEnd + '</nav>'.length);

  // Find all <span ...style=...> attributes and check for hex colors
  // A hex color looks like #RRGGBB or #RGB (3 or 6 hex digits)
  const spanStyleMatches = [...chromeSection.matchAll(/<span[^>]*style=\{([^}]+)\}[^>]*>/g)];

  const hexColorRegex = /#[0-9a-fA-F]{3,6}(?:[^0-9a-fA-F]|$)/;
  const violatingSpans = spanStyleMatches
    .map(m => m[0])
    .filter(spanTag => hexColorRegex.test(spanTag));

  assert.deepStrictEqual(
    violatingSpans,
    [],
    `The following chrome <span> tags carry hard-coded hex colors in style:\n${violatingSpans.join('\n')}`
  );
});
