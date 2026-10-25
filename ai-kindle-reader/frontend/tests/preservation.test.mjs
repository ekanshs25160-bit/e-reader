/**
 * Preservation Property Tests
 *
 * These tests verify that the bug fix did not regress any pre-existing correct
 * behaviours.  All tests are expected to PASS on both the original and fixed
 * code.
 *
 * Sub-tasks covered:
 *  1. Phone formula:   stageWidth ∈ [320, 767] → pageWidth === stageWidth − 32
 *  2. Tablet formula:  stageWidth ∈ [768, 1023] → pageWidth === Math.min(stageWidth, 704)
 *  3. Desktop formula: stageWidth ∈ [1024, 2560] → pageWidth === Math.min(stageWidth − 96, 704)
 *  4. ResizeObserver setTimeout debounce constant === 120
 *  5. Swipe thresholds: commit 45px, quick-flick 20px / 250ms, animation 220ms
 *  6. Paper palette:   contrastRatio(READER_PALETTES.paper.fg, READER_PALETTES.paper.bg) >= 4.5
 *  7. Sepia palette:   contrastRatio(READER_PALETTES.sepia.fg, READER_PALETTES.sepia.bg) >= 4.5
 */

import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const layoutPath = path.resolve(__dirname, '../src/features/reader/engine/layout.js');
const viewportResizePath = path.resolve(__dirname, '../src/features/reader/hooks/useViewportResize.js');
const gesturesPath = path.resolve(__dirname, '../src/features/reader/engine/gestures.js');
const readerCanvasPath = path.resolve(__dirname, '../src/features/reader/components/ReaderCanvas.jsx');
const readerPagePath = path.resolve(__dirname, '../src/app/(focus)/reader/[id]/page.js');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** WCAG 2.1 relative luminance for a hex colour. */
function getLuminance(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const linearise = (v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * linearise(r) + 0.7152 * linearise(g) + 0.0722 * linearise(b);
}

/** WCAG 2.1 contrast ratio between two hex colours. */
function contrastRatio(hex1, hex2) {
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extract and evaluate the pure `getPageAreaDimensions` function from
 * ReaderCanvas.jsx without importing the full React module.
 */
function loadGetPageAreaDimensions() {
  const code = fs.readFileSync(layoutPath, 'utf8');
  // Match up to the closing brace of the exported function
  const funcMatch = code.match(/export function getPageAreaDimensions\([\s\S]*?\n\}/);
  if (!funcMatch) throw new Error('getPageAreaDimensions function not found');
  const funcCode = funcMatch[0].replace('export function', 'function');
  const fn = new Function(`${funcCode}; return getPageAreaDimensions;`);
  return fn();
}

/**
 * Extract READER_PALETTES from page.js using static source analysis.
 * Returns the parsed object without importing the full Next.js module.
 */
function loadReaderPalettes() {
  const code = fs.readFileSync(readerPagePath, 'utf8');
  // Locate the READER_PALETTES const declaration
  const start = code.indexOf('export const READER_PALETTES');
  assert.notStrictEqual(start, -1, 'READER_PALETTES must be exported from page.js');
  // Walk forward to find the matching closing brace of the object literal
  const openBrace = code.indexOf('{', start);
  let depth = 0;
  let i = openBrace;
  for (; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  const objLiteral = code.slice(openBrace, i + 1);
  // Evaluate as a JS object literal
  const fn = new Function(`return (${objLiteral});`);
  return fn();
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test('Property 2: Preservation Tests (Expected to PASS on fixed code)', async (t) => {
  const getPageAreaDimensions = loadGetPageAreaDimensions();

  // ── Sub-task 1: Phone formula ─────────────────────────────────────────────
  // Validates: Requirements 3.2 / Design Property 6
  await t.test(
    '1. Phone formula: stageWidth ∈ [320, 767] → pageWidth === stageWidth − 32',
    () => {
      // Boundary spot-checks
      assert.strictEqual(getPageAreaDimensions(320, 812).pageWidth, 288);
      assert.strictEqual(getPageAreaDimensions(375, 812).pageWidth, 343);
      assert.strictEqual(getPageAreaDimensions(767, 812).pageWidth, 735);

      // Property: iterate the full phone range
      for (let w = 320; w <= 767; w++) {
        const { pageWidth } = getPageAreaDimensions(w, 812);
        assert.strictEqual(
          pageWidth,
          w - 32,
          `[phone] stageWidth=${w}: expected pageWidth=${w - 32}, got ${pageWidth}`
        );
      }
    }
  );

  // ── Sub-task 2: Tablet formula ────────────────────────────────────────────
  // Validates: Requirements 3.2 / Design Property 6
  await t.test(
    '2. Tablet formula: stageWidth ∈ [768, 1023] → pageWidth === Math.min(stageWidth, 704)',
    () => {
      // Boundary spot-checks
      assert.strictEqual(getPageAreaDimensions(768, 1024).pageWidth, Math.min(768, 704));
      assert.strictEqual(getPageAreaDimensions(800, 1024).pageWidth, Math.min(800, 704));
      assert.strictEqual(getPageAreaDimensions(1023, 1024).pageWidth, Math.min(1023, 704));

      // Property: iterate the full tablet range
      for (let w = 768; w <= 1023; w++) {
        const { pageWidth } = getPageAreaDimensions(w, 1024);
        const expected = Math.min(w, 704);
        assert.strictEqual(
          pageWidth,
          expected,
          `[tablet] stageWidth=${w}: expected pageWidth=${expected}, got ${pageWidth}`
        );
      }
    }
  );

  // ── Sub-task 3: Desktop formula ───────────────────────────────────────────
  // Validates: Requirements 3.2 / Design Property 6
  await t.test(
    '3. Desktop formula: stageWidth ∈ [1024, 2560] → pageWidth === Math.min(stageWidth − 96, 704)',
    () => {
      // Boundary spot-checks
      assert.strictEqual(getPageAreaDimensions(1024, 900).pageWidth, Math.min(1024 - 96, 704));
      assert.strictEqual(getPageAreaDimensions(1440, 900).pageWidth, Math.min(1440 - 96, 704));
      assert.strictEqual(getPageAreaDimensions(2560, 900).pageWidth, Math.min(2560 - 96, 704));

      // Property: iterate with step to keep runtime reasonable
      for (let w = 1024; w <= 2560; w += 4) {
        const { pageWidth } = getPageAreaDimensions(w, 900);
        const expected = Math.min(w - 96, 704);
        assert.strictEqual(
          pageWidth,
          expected,
          `[desktop] stageWidth=${w}: expected pageWidth=${expected}, got ${pageWidth}`
        );
      }
    }
  );

  // ── Sub-task 4: ResizeObserver debounce constant ──────────────────────────
  // Validates: Requirements 3.6 / Design Property 7
  await t.test(
    '4. ResizeObserver setTimeout debounce constant === 120',
    () => {
      const code = fs.readFileSync(viewportResizePath, 'utf8');

      // Locate the ResizeObserver constructor then find the setTimeout call inside it
      const roMatch = code.match(
        /new ResizeObserver\s*\([\s\S]*?setTimeout\s*\(\s*\(\s*\)\s*=>\s*\{[\s\S]*?\},\s*(\d+)\s*\)/
      );
      assert.ok(
        roMatch,
        'ResizeObserver callback containing a setTimeout must exist'
      );
      assert.strictEqual(
        Number(roMatch[1]),
        120,
        `ResizeObserver debounce must be exactly 120 ms (found ${roMatch[1]})`
      );
    }
  );

  // ── Sub-task 5: Swipe gesture constants ──────────────────────────────────
  // Validates: Requirements 3.4 / Design Property 6
  await t.test(
    '5. Swipe constants: commit 45px, quick-flick 20px/250ms, animation 220ms unchanged',
    () => {
      const code = fs.readFileSync(gesturesPath, 'utf8');

      // Commit threshold: absDx > 45 or constant
      assert.ok(
        /SWIPE_COMMIT_PX\s*=\s*45|absDx\s*>\s*45/.test(code),
        'Swipe commit threshold must be 45px'
      );
      // Quick-flick: absDx > 20 && duration < 250
      assert.ok(
        /SWIPE_FLICK_PX\s*=\s*20|absDx\s*>\s*20\s*&&\s*duration\s*<\s*250/.test(code),
        'Quick-flick threshold must be 20px'
      );
      // Animation duration: 220ms
      assert.ok(
        /SWIPE_ANIM_DURATION_MS\s*=\s*220|220ms/.test(code),
        'Page-turn animation duration must be 220ms'
      );
      // Combined shouldTurn expression as written in source
      assert.ok(
        /SWIPE_COMMIT_PX|absDx > 45/.test(code),
        'shouldTurn expression must evaluate swipe commit distance'
      );
    }
  );

  // ── Sub-task 6: Paper palette contrast ───────────────────────────────────
  // Validates: Requirements 3.1 / Design Property 5
  await t.test(
    '6. READER_PALETTES.paper: contrastRatio(fg, bg) >= 4.5 (WCAG AA)',
    () => {
      const palettes = loadReaderPalettes();
      assert.ok(palettes.paper, 'READER_PALETTES must contain a "paper" entry');
      assert.ok(palettes.paper.fg, 'READER_PALETTES.paper must have a fg colour');
      assert.ok(palettes.paper.bg, 'READER_PALETTES.paper must have a bg colour');

      const ratio = contrastRatio(palettes.paper.fg, palettes.paper.bg);
      assert.ok(
        ratio >= 4.5,
        `Paper palette contrast ratio must be >= 4.5 (WCAG AA); ` +
        `fg=${palettes.paper.fg} bg=${palettes.paper.bg} ratio=${ratio.toFixed(2)}`
      );
    }
  );

  // ── Sub-task 7: Sepia palette contrast ───────────────────────────────────
  // Validates: Requirements 3.1 / Design Property 5
  await t.test(
    '7. READER_PALETTES.sepia: contrastRatio(fg, bg) >= 4.5 (WCAG AA)',
    () => {
      const palettes = loadReaderPalettes();
      assert.ok(palettes.sepia, 'READER_PALETTES must contain a "sepia" entry');
      assert.ok(palettes.sepia.fg, 'READER_PALETTES.sepia must have a fg colour');
      assert.ok(palettes.sepia.bg, 'READER_PALETTES.sepia must have a bg colour');

      const ratio = contrastRatio(palettes.sepia.fg, palettes.sepia.bg);
      assert.ok(
        ratio >= 4.5,
        `Sepia palette contrast ratio must be >= 4.5 (WCAG AA); ` +
        `fg=${palettes.sepia.fg} bg=${palettes.sepia.bg} ratio=${ratio.toFixed(2)}`
      );
    }
  );
});
