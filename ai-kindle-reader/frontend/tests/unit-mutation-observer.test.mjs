/**
 * Task 4.2 — MutationObserver wiring and cleanup unit test
 *
 * Static source analysis against ReaderCanvas.jsx.
 * No React mounting — all checks are regex / string searches over the source text.
 *
 * Validates: Requirements 2.3 (overflow clip always in place)
 * See also: design.md § Property 3
 */
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const readerCanvasPath = path.resolve(__dirname, '../src/features/reader/hooks/useEpubRendition.js');

const code = fs.readFileSync(readerCanvasPath, 'utf8');

// ---------------------------------------------------------------------------
// Helper: locate the initEpub async function body (from 'async function initEpub' to
// the matching closing brace) so we can scope sub-searches to it.
// ---------------------------------------------------------------------------
function extractInitEpubBody(src) {
  const marker = 'async function initEpub()';
  const start = src.indexOf(marker);
  if (start === -1) return null;
  let depth = 0;
  let inBody = false;
  for (let i = start; i < src.length; i++) {
    if (src[i] === '{') { depth++; inBody = true; }
    else if (src[i] === '}') {
      depth--;
      if (inBody && depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

// Helper: extract the useEffect cleanup function (the `return () => { ... }` block
// that closes the main EPUB-loading useEffect).
function extractEffectCleanup(src) {
  // The cleanup starts with "return () => {" inside the useEffect and ends at the
  // closing brace that matches the useEffect arrow function.  We find it by looking
  // for the pattern and scanning to the balanced closing brace.
  const marker = 'return () => {';
  // There may be multiple return-arrow-functions; we want the one that belongs to the
  // useEffect cleanup, which contains "isCancelled = true".
  let searchFrom = 0;
  while (searchFrom < src.length) {
    const idx = src.indexOf(marker, searchFrom);
    if (idx === -1) return null;
    let depth = 0;
    let inBody = false;
    for (let i = idx; i < src.length; i++) {
      if (src[i] === '{') { depth++; inBody = true; }
      else if (src[i] === '}') {
        depth--;
        if (inBody && depth === 0) {
          const candidate = src.slice(idx, i + 1);
          if (candidate.includes('isCancelled = true')) return candidate;
          break;
        }
      }
    }
    searchFrom = idx + marker.length;
  }
  return null;
}

// ---------------------------------------------------------------------------

test('Unit 4.2 — MutationObserver wiring and cleanup', async (t) => {

  // ── 4.2-A: MutationObserver is created after renderTo ──────────────────
  await t.test('4.2-A: new MutationObserver is instantiated after renderTo', () => {
    // renderTo must appear before the observer construction
    const renderToIdx = code.indexOf('book.renderTo(');
    assert.notStrictEqual(renderToIdx, -1, 'book.renderTo() call must exist in ReaderCanvas.jsx');

    const observerIdx = code.indexOf('new MutationObserver(', renderToIdx);
    assert.ok(
      observerIdx !== -1 && observerIdx > renderToIdx,
      'new MutationObserver(...) must appear AFTER book.renderTo() in the source'
    );
  });

  // ── 4.2-B: observe() is called with viewerRef.current, { childList: true, subtree: true } ──
  await t.test('4.2-B: observer.observe called with viewerRef.current and { childList: true, subtree: true }', () => {
    // Check that the observe call uses viewerRef.current
    const observeViewerRef = /epubContainerObserver\.observe\s*\(\s*viewerRef\.current\s*,\s*\{/.test(code);
    assert.ok(
      observeViewerRef,
      'epubContainerObserver.observe(viewerRef.current, { ... }) must be present'
    );

    // Check childList: true
    const hasChildList = /epubContainerObserver\.observe[\s\S]{0,200}childList\s*:\s*true/.test(code);
    assert.ok(hasChildList, 'observe options must include childList: true');

    // Check subtree: true
    const hasSubtree = /epubContainerObserver\.observe[\s\S]{0,200}subtree\s*:\s*true/.test(code);
    assert.ok(hasSubtree, 'observe options must include subtree: true');
  });

  // ── 4.2-C: observer callback queries .epub-container ───────────────────
  await t.test('4.2-C: observer callback queries .epub-container', () => {
    // Find the MutationObserver construction and extract its callback body
    const moStart = code.indexOf('new MutationObserver(');
    assert.notStrictEqual(moStart, -1, 'MutationObserver construction must exist');

    // Extract the callback (the argument to new MutationObserver(...))
    const argStart = moStart + 'new MutationObserver('.length;
    let depth = 1;
    let i = argStart;
    for (; i < code.length; i++) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    const callbackBody = code.slice(argStart, i);

    const queriesEpubContainer = /\.epub-container/.test(callbackBody);
    assert.ok(
      queriesEpubContainer,
      'MutationObserver callback must query ".epub-container"'
    );
  });

  // ── 4.2-D: observer callback sets overflow: "hidden" on the container ──
  await t.test('4.2-D: observer callback sets overflow = "hidden" on .epub-container', () => {
    const moStart = code.indexOf('new MutationObserver(');
    const argStart = moStart + 'new MutationObserver('.length;
    let depth = 1;
    let i = argStart;
    for (; i < code.length; i++) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    const callbackBody = code.slice(argStart, i);

    const setsOverflow = /\.style\.overflow\s*=\s*["']hidden["']/.test(callbackBody);
    assert.ok(
      setsOverflow,
      'MutationObserver callback must set .style.overflow = "hidden" on the epub-container element'
    );
  });

  // ── 4.2-E: observer callback sets scrollbarWidth: "none" ───────────────
  await t.test('4.2-E: observer callback sets scrollbarWidth = "none" on .epub-container', () => {
    const moStart = code.indexOf('new MutationObserver(');
    const argStart = moStart + 'new MutationObserver('.length;
    let depth = 1;
    let i = argStart;
    for (; i < code.length; i++) {
      if (code[i] === '(') depth++;
      else if (code[i] === ')') {
        depth--;
        if (depth === 0) break;
      }
    }
    const callbackBody = code.slice(argStart, i);

    const setsScrollbarWidth = /\.style\.scrollbarWidth\s*=\s*["']none["']/.test(callbackBody);
    assert.ok(
      setsScrollbarWidth,
      'MutationObserver callback must set .style.scrollbarWidth = "none" on the epub-container element'
    );
  });

  // ── 4.2-F: observer is disconnected in the effect cleanup return block ──
  await t.test('4.2-F: observer.disconnect() called in effect cleanup (return () => { ... })', () => {
    const cleanup = extractEffectCleanup(code);
    assert.ok(cleanup, 'Effect cleanup function (return () => { isCancelled = true; ... }) must exist');

    const hasDisconnect = /epubContainerObserver\??\.disconnect\(\)/.test(cleanup);
    assert.ok(
      hasDisconnect,
      'epubContainerObserver?.disconnect() must be called inside the effect cleanup function'
    );
  });

  // ── 4.2-G: observer is disconnected in the isCancelled early-exit guard ──
  await t.test('4.2-G: observer.disconnect() called in the isCancelled early-exit guard inside initEpub', () => {
    const initBody = extractInitEpubBody(code);
    assert.ok(initBody, 'initEpub function body must be extractable from source');

    // Look for the pattern: if (isCancelled) { ... epubContainerObserver?.disconnect() ... }
    // The exact guard is: "if (isCancelled) { epubContainerObserver?.disconnect(); return; }"
    const isCancelledGuardWithDisconnect =
      /if\s*\(\s*isCancelled\s*\)[\s\S]{0,120}epubContainerObserver\??\.disconnect\(\)/.test(initBody);

    assert.ok(
      isCancelledGuardWithDisconnect,
      'Inside initEpub, an if (isCancelled) guard must call epubContainerObserver?.disconnect() before returning'
    );
  });
});
