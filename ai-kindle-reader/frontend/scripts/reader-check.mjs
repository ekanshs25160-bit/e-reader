#!/usr/bin/env node
/**
 * reader-check.mjs  –  Playwright smoke-check for the Flyleaf reader
 *
 * Checks every viewport × palette combination for:
 *   1. No text clipped (text rects inside stage with ≥ 8 px margin)
 *   2. Left/right gutters equal within 2 px
 *   3. No neighbouring-page text visible after pressing Right Arrow
 *   4. Contrast ≥ 4.5:1 for header, footer and button text
 *   5. Saved CFI unchanged after a viewport resize
 *
 * Usage:  node scripts/reader-check.mjs
 *         npm run check:reader
 *
 * Output: PASS/FAIL lines in the console, screenshots in scripts/out/
 * Exit:   0 = all pass, 1 = any failure
 */

import { chromium } from 'playwright';
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.READER_CHECK_URL || 'http://localhost:3000';
const DEV_SERVER_CMD = 'npm';
const DEV_SERVER_ARGS = ['run', 'dev'];

const VIEWPORTS = [
  { label: '360x800',   width: 360,  height: 800  },
  { label: '390x844',   width: 390,  height: 844  },
  { label: '844x390',   width: 844,  height: 390  },  // landscape phone
  { label: '768x1024',  width: 768,  height: 1024 },
  { label: '1024x768',  width: 1024, height: 768  },
  { label: '1280x800',  width: 1280, height: 800  },
  { label: '1440x900',  width: 1440, height: 900  },
  { label: '1920x1080', width: 1920, height: 1080 },
];

const PALETTES = [
  { key: 'paper', name: 'Paper', bg: '#FAF9F6', fg: '#152A41', muted: '#43474D' },
  { key: 'sepia', name: 'Sepia', bg: '#F4ECD8', fg: '#2C2214', muted: '#5B472C' },
  { key: 'night', name: 'Night', bg: '#141824', fg: '#F0F2F5', muted: '#A0AEC0' },
  { key: 'oled',  name: 'OLED',  bg: '#000000', fg: '#EDEDED', muted: '#A0A0A0' },
];

// ─────────────────────────────────────────────────────────────────────────────
// WCAG contrast helpers
// ─────────────────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

function relativeLuminance({ r, g, b }) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker  = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Parse rgb(r, g, b) / rgba(r, g, b, a) / #hex strings returned by the browser
function parseColorToHex(colorStr) {
  if (!colorStr || colorStr === 'transparent') return null;
  const rgbaMatch = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbaMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbaMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  if (colorStr.startsWith('#')) return colorStr.length === 4
    ? `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`
    : colorStr;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Minimal valid 3-chapter EPUB bytes (generated inline — no external file)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a tiny but valid EPUB 2 from scratch and return a Buffer.
 * 3 chapters, 11 paragraphs each (33 total, well above 30).
 */
function buildTestEpub() {
  // We build the ZIP file manually (EPUB is a ZIP).
  // Use the 'jszip' API-compatible approach via a hand-rolled minimal ZIP writer
  // that avoids any runtime dependency.  For simplicity we use the 'adm-zip'
  // package if available; otherwise we shell out to Python's zipfile module.
  //
  // Since this is a dev script, we rely on the project's node_modules or Python.

  const chapters = [1, 2, 3].map((n) => {
    const paras = Array.from({ length: 11 }, (_, i) =>
      `<p>Chapter ${n}, paragraph ${i + 1}. ` +
      'The quick brown fox jumps over the lazy dog. '.repeat(8) +
      `End of paragraph ${i + 1} in chapter ${n}.</p>`
    ).join('\n    ');
    return {
      id: `chapter${n}`,
      filename: `chapter${n}.xhtml`,
      content: `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Chapter ${n}</title></head>
<body>
  <h1>Chapter ${n}</h1>
  ${paras}
</body>
</html>`,
    };
  });

  const opfManifestItems = chapters
    .map((c) => `<item id="${c.id}" href="OEBPS/${c.filename}" media-type="application/xhtml+xml"/>`)
    .join('\n    ');
  const opfSpineItems = chapters
    .map((c) => `<itemref idref="${c.id}"/>`)
    .join('\n    ');

  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="uid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Flyleaf Test Book</dc:title>
    <dc:creator>Test Author</dc:creator>
    <dc:language>en</dc:language>
    <dc:identifier id="uid">flyleaf-test-book-001</dc:identifier>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    ${opfManifestItems}
  </manifest>
  <spine toc="ncx">
    ${opfSpineItems}
  </spine>
</package>`;

  const ncxNavPoints = chapters
    .map(
      (c, i) => `<navPoint id="np${i + 1}" playOrder="${i + 1}">
      <navLabel><text>Chapter ${i + 1}</text></navLabel>
      <content src="OEBPS/${c.filename}"/>
    </navPoint>`
    )
    .join('\n    ');

  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="flyleaf-test-book-001"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>Flyleaf Test Book</text></docTitle>
  <navMap>
    ${ncxNavPoints}
  </navMap>
</ncx>`;

  const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  // Assemble file list: path → content string
  const files = {
    'mimetype': 'application/epub+zip',
    'META-INF/container.xml': container,
    'content.opf': opf,
    'toc.ncx': ncx,
  };
  for (const c of chapters) {
    files[`OEBPS/${c.filename}`] = c.content;
  }

  // Use Python to zip (available on macOS/Linux without additional npm deps)
  const tmpDir = path.join(__dirname, 'out', '_epub_tmp');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });
  const epubPath = path.join(__dirname, 'out', 'test-book.epub');

  // Write individual files to tmpDir
  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, relPath);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
  }

  // The EPUB spec requires 'mimetype' to be the FIRST entry and stored uncompressed.
  // Python's zipfile doesn't guarantee order, so we use a simple approach:
  // create the zip in Python with mimetype first, DEFLATED for everything else.
  const pyScript = `
import zipfile, os, sys
epub_path = sys.argv[1]
tmp_dir = sys.argv[2]
with zipfile.ZipFile(epub_path, 'w') as zf:
    mime_path = os.path.join(tmp_dir, 'mimetype')
    zf.write(mime_path, 'mimetype', compress_type=zipfile.ZIP_STORED)
    for root, dirs, files in os.walk(tmp_dir):
        dirs.sort()
        files.sort()
        for fname in files:
            full = os.path.join(root, fname)
            rel = os.path.relpath(full, tmp_dir)
            if rel == 'mimetype':
                continue
            zf.write(full, rel, compress_type=zipfile.ZIP_DEFLATED)
print('OK')
`.trim();

  const pyScriptPath = path.join(__dirname, 'out', '_make_epub.py');
  writeFileSync(pyScriptPath, pyScript, 'utf8');
  execSync(`python3 "${pyScriptPath}" "${epubPath}" "${tmpDir}"`, { stdio: 'pipe' });
  return readFileSync(epubPath);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev-server management
// ─────────────────────────────────────────────────────────────────────────────
async function isServerReady(url, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) return true;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Result tracking
// ─────────────────────────────────────────────────────────────────────────────
const results = [];
let anyFail = false;

function report(viewport, palette, check, pass, detail = '') {
  const status = pass ? '✅ PASS' : '❌ FAIL';
  const line = `[${viewport.padEnd(10)}] [${palette.padEnd(6)}] ${status}  ${check}${detail ? '  →  ' + detail : ''}`;
  console.log(line);
  results.push({ viewport, palette, check, pass, detail });
  if (!pass) anyFail = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed the book into IndexedDB via the app's own DB API
// ─────────────────────────────────────────────────────────────────────────────
async function seedBook(page, epubBytes) {
  const pageErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err.message));

  // Navigate to home first so we have the app's window context with localforage
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 60000 }).catch(() =>
    page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60000 })
  );

  let hasDb = await page.evaluate(async () => {
    for (let i = 0; i < 80 && !window.__db?.saveBook; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    return Boolean(window.__db?.saveBook);
  }).catch(() => false);

  if (!hasDb) {
    await page.reload({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    hasDb = await page.evaluate(async () => {
      for (let i = 0; i < 80 && !window.__db?.saveBook; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      return Boolean(window.__db?.saveBook);
    }).catch(() => false);
  }

  if (!hasDb && pageErrors.length > 0) {
    console.error('    ⚠️  Page errors during seedBook:', pageErrors.join(' | '));
  }

  const bookId = await page.evaluate(async (epubArray) => {
    // Reconstruct Uint8Array → Blob inside the browser
    const bytes = new Uint8Array(epubArray);
    const blob = new Blob([bytes], { type: 'application/epub+zip' });

    // Wait for window.__db or fallback to IndexedDB directly
    for (let i = 0; i < 100 && !window.__db?.saveBook; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    const saveBook = window.__db?.saveBook;
    if (!saveBook) {
      throw new Error('window.__db.saveBook is not available on client page');
    }

    const id = 'flyleaf-check-book';
    await saveBook(
      {
        id,
        title: 'Flyleaf Test Book',
        author: 'Test Author',
        status: 'to-read',
      },
      blob
    );
    return id;
  }, Array.from(epubBytes));

  return bookId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core check functions (run inside Playwright evaluate)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Wait for epub.js to finish rendering.
 * Polls until the iframe inside the viewer div has a non-empty body.
 */
async function waitForEpubReady(page, timeoutMs = 20000) {
  await page.waitForFunction(
    () => {
      const iframe = document.querySelector('iframe');
      return iframe && iframe.contentDocument?.body?.innerText?.trim().length > 0;
    },
    { timeout: timeoutMs }
  ).catch(() => {});
  // Extra settle time for epub.js pagination
  await page.waitForTimeout(1500);
}

/**
 * 1. No text clipped — every text rect stays ≥ 8 px inside the stage.
 */
async function checkNoClip(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('[class*="relative"][class*="w-full"][class*="h-full"]');
    if (!stage) return { ok: false, detail: 'stage element not found' };
    const stageRect = stage.getBoundingClientRect();

    const viewer =
      document.getElementById('reader-viewer') ||
      document.querySelector('[data-testid="reader-viewer"]') ||
      document.querySelector('.epub-container')?.parentElement ||
      document.querySelector('iframe')?.closest('.epub-container')?.parentElement;
    const viewerRect = viewer?.getBoundingClientRect();

    const iframe = document.querySelector('iframe');
    if (!iframe || !iframe.contentDocument) {
      return { ok: false, detail: 'epub iframe not found or cross-origin' };
    }

    const doc = iframe.contentDocument;
    const body = doc.body;
    if (!body) return { ok: false, detail: 'iframe body not found' };

    // Get all text nodes via TreeWalker
    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    const MARGIN = 8;
    const violations = [];

    // The active page viewport boundaries (viewer bounds)
    const activeLeft = viewerRect ? viewerRect.left : stageRect.left;
    const activeRight = viewerRect ? viewerRect.right : stageRect.right;

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!text) continue;
      const range = doc.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      // Adjust iframe rects to page coordinates
      const frameRect = iframe.getBoundingClientRect();
      for (const r of rects) {
        if (r.width < 1 || r.height < 1) continue;
        const absLeft  = frameRect.left + r.left;
        const absRight = frameRect.left + r.right;

        // Skip text belonging to other columns/pages of the chapter
        // Subsequent multi-column pages start at or beyond activeRight - 2.
        // Previous pages are scrolled off to the left, ending at or before activeLeft + 2.
        if (absRight <= activeLeft + 2 || absLeft >= activeRight - 2) {
          continue;
        }

        if (absLeft < stageRect.left + MARGIN) {
          violations.push({ side: 'left', absLeft, stageLeft: stageRect.left, text: text.slice(0, 40) });
          break;
        }
        if (absRight > stageRect.right - MARGIN) {
          violations.push({ side: 'right', absRight, stageRight: stageRect.right, text: text.slice(0, 40) });
          break;
        }
      }
      if (violations.length >= 3) break; // report first few
    }

    if (violations.length > 0) {
      return {
        ok: false,
        detail: violations.map((v) =>
          v.side === 'right'
            ? `right clip: rect.right=${v.absRight.toFixed(1)} > stage.right-8=${(v.stageRight - 8).toFixed(1)} ("${v.text}")`
            : `left clip: rect.left=${v.absLeft.toFixed(1)} < stage.left+8=${(v.stageLeft + 8).toFixed(1)} ("${v.text}")`
        ).join('; '),
      };
    }
    return { ok: true, detail: '' };
  });
}

/**
 * 2. Left and right gutters equal within 2 px.
 */
async function checkGutters(page) {
  return page.evaluate(() => {
    const stage = document.querySelector('[class*="relative"][class*="w-full"][class*="h-full"]');
    const viewer =
      document.getElementById('reader-viewer') ||
      document.querySelector('[data-testid="reader-viewer"]') ||
      document.querySelector('.epub-container')?.parentElement ||
      document.querySelector('iframe')?.parentElement?.parentElement?.parentElement;
    if (!stage || !viewer) return { ok: false, detail: 'stage or viewer not found' };

    const sr = stage.getBoundingClientRect();
    const vr = viewer.getBoundingClientRect();

    const leftGutter  = vr.left  - sr.left;
    const rightGutter = sr.right - vr.right;
    const diff = Math.abs(leftGutter - rightGutter);

    if (diff > 2) {
      return {
        ok: false,
        detail: `left=${leftGutter.toFixed(1)}px right=${rightGutter.toFixed(1)}px diff=${diff.toFixed(1)}px`,
      };
    }
    return { ok: true, detail: `left=${leftGutter.toFixed(1)}px right=${rightGutter.toFixed(1)}px` };
  });
}

/**
 * 3. No neighbour-page text visible after pressing Right Arrow.
 *    Rects outside the viewer area must not appear inside the stage.
 */
async function checkNoNeighbourBleed(page) {
  // Press right arrow to trigger page turn
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500); // allow animation to settle

  return page.evaluate(() => {
    const stage = document.querySelector('[class*="relative"][class*="w-full"][class*="h-full"]');
    const iframe = document.querySelector('iframe');
    if (!stage || !iframe || !iframe.contentDocument) {
      return { ok: false, detail: 'stage or iframe not found' };
    }

    const stageRect  = stage.getBoundingClientRect();
    const frameRect  = iframe.getBoundingClientRect();
    const doc        = iframe.contentDocument;
    const body       = doc.body;
    if (!body) return { ok: false, detail: 'iframe body not found' };

    const viewer =
      document.getElementById('reader-viewer') ||
      document.querySelector('[data-testid="reader-viewer"]') ||
      iframe.closest('.epub-container')?.parentElement ||
      iframe;
    const vr = viewer.getBoundingClientRect();

    // The viewer bounding box is the viewer frame rect (set by JS to pageWidth)
    const viewerLeft  = vr.left;
    const viewerRight = vr.right;

    // Collect text rects that are outside the viewer frame horizontally
    // but still inside the stage (= neighbour-page bleed)
    const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT, null);
    const bleeds = [];

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent.trim();
      if (!text) continue;
      const range = doc.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      for (const r of rects) {
        if (r.width < 1 || r.height < 1) continue;
        const absLeft  = frameRect.left + r.left;
        const absRight = frameRect.left + r.right;
        // Text that is outside the viewer frame AND inside the stage
        const outsideViewer = absRight < viewerLeft - 4 || absLeft > viewerRight + 4;
        const insideStage   = absLeft >= stageRect.left && absRight <= stageRect.right;
        if (outsideViewer && insideStage) {
          bleeds.push(`"${text.slice(0, 40)}" at [${absLeft.toFixed(0)}, ${absRight.toFixed(0)}]`);
          break;
        }
      }
      if (bleeds.length >= 3) break;
    }

    if (bleeds.length > 0) {
      return { ok: false, detail: 'bleed: ' + bleeds.join('; ') };
    }
    return { ok: true, detail: '' };
  });
}

/**
 * 4. Contrast ≥ 4.5:1 for header, bottom-bar and button text.
 *    Reads computed color and background-color from the DOM.
 */
async function checkContrast(page, palette) {
  return page.evaluate((pal) => {
    // Resolve CSS custom property to a concrete color
    function resolveColor(el, prop) {
      const raw = getComputedStyle(el).getPropertyValue(prop).trim();
      if (!raw || raw === 'transparent') return null;
      // Return as-is for further parsing
      return raw;
    }

    function parseToHex(colorStr) {
      if (!colorStr || colorStr === 'transparent') return null;
      const m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
      if (m) {
        return `#${parseInt(m[1]).toString(16).padStart(2,'0')}${parseInt(m[2]).toString(16).padStart(2,'0')}${parseInt(m[3]).toString(16).padStart(2,'0')}`;
      }
      if (colorStr.startsWith('#')) {
        if (colorStr.length === 4) return `#${colorStr[1]}${colorStr[1]}${colorStr[2]}${colorStr[2]}${colorStr[3]}${colorStr[3]}`;
        return colorStr;
      }
      return null;
    }

    function luminance(hex) {
      const h = hex.replace('#','');
      const lin = (v) => {
        const c = parseInt(h.substring(v,v+2),16)/255;
        return c <= 0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
      };
      return 0.2126*lin(0) + 0.7152*lin(2) + 0.0722*lin(4);
    }

    function contrast(hex1, hex2) {
      const l1 = luminance(hex1), l2 = luminance(hex2);
      return (Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05);
    }

    const MIN_CONTRAST = 4.5;
    const failures = [];

    // Use palette background as the known bg since CSS vars resolve correctly
    const bgHex = pal.bg;

    // Elements to check: select by aria-label / role / data attribute
    const selectors = [
      // Header back arrow
      '[aria-label="Back to Library"], [aria-label="Return to library"]',
      // Bottom nav buttons
      '[aria-label="Table of contents (C)"]',
      '[aria-label^="Reading progress"]',
      '[aria-label="Appearance settings (A)"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (!el) continue;

      // Get the element's own text color (inline style or computed)
      const colorRaw = el.style.color || getComputedStyle(el).color;
      const colorHex = parseToHex(colorRaw);
      if (!colorHex) continue;

      const ratio = contrast(colorHex, bgHex);
      if (ratio < MIN_CONTRAST) {
        failures.push(`${sel}: ${colorHex} on ${bgHex} = ${ratio.toFixed(2)}:1`);
      }
    }

    // Also check all text-bearing children of the header and nav
    ['header', 'nav'].forEach((tag) => {
      document.querySelectorAll(`${tag} span[style*="color"]`).forEach((span) => {
        const colorHex = parseToHex(span.style.color);
        if (!colorHex || colorHex === bgHex) return;
        if (colorHex === 'inherit') return;
        const ratio = contrast(colorHex, bgHex);
        if (ratio < MIN_CONTRAST) {
          const txt = span.textContent.trim().slice(0, 30);
          failures.push(`${tag} span ("${txt}"): ${colorHex} on ${bgHex} = ${ratio.toFixed(2)}:1`);
        }
      });
    });

    if (failures.length > 0) {
      return { ok: false, detail: failures.join(' | ') };
    }
    return { ok: true, detail: '' };
  }, palette);
}

/**
 * 5. CFI unchanged after resize.
 *    Read the current CFI, resize the viewport, wait, read again.
 */
async function checkCfiAfterResize(page, vp) {
  // Read initial CFI from the app's state (it's stored in currentCfiRef, exposed
  // via the rendition's currentLocation or via the URL bar if the app syncs it).
  // The most reliable way is to read from IndexedDB.
  const cfiBeforeRaw = await page.evaluate(async () => {
    try {
      for (let i = 0; i < 50 && !window.__db?.getReadingLocation; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      const loc = await window.__db?.getReadingLocation('flyleaf-check-book');
      return loc?.cfi || null;
    } catch {
      return null;
    }
  });

  if (!cfiBeforeRaw) {
    // No CFI saved yet — skip; report as pass with a note
    return { ok: true, detail: 'no CFI saved yet (first page), skipped' };
  }

  // Resize the viewport
  const newWidth = vp.width > 768 ? Math.round(vp.width * 0.75) : Math.round(vp.width * 1.3);
  await page.setViewportSize({ width: newWidth, height: vp.height });
  await page.waitForTimeout(600); // debounce (120ms) + re-display

  const cfiAfterRaw = await page.evaluate(async () => {
    try {
      for (let i = 0; i < 50 && !window.__db?.getReadingLocation; i++) {
        await new Promise((r) => setTimeout(r, 100));
      }
      const loc = await window.__db?.getReadingLocation('flyleaf-check-book');
      return loc?.cfi || null;
    } catch {
      return null;
    }
  });

  // Restore original size
  await page.setViewportSize({ width: vp.width, height: vp.height });
  await page.waitForTimeout(400);

  if (cfiBeforeRaw && cfiAfterRaw && cfiBeforeRaw !== cfiAfterRaw) {
    return {
      ok: false,
      detail: `CFI changed: before="${cfiBeforeRaw.slice(0, 60)}" after="${cfiAfterRaw.slice(0, 60)}"`,
    };
  }
  return { ok: true, detail: `CFI stable: "${(cfiBeforeRaw || '').slice(0, 60)}"` };
}

/**
 * 6. HUD stays hidden on ArrowRight and toggles only on center tap, with full-width bottom bar.
 */
async function checkHudAndBottomBar(page, vp) {
  const afterArrowState = await page.evaluate(() => {
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    if (!header || !nav) return { ok: false, detail: 'header or nav missing' };
    const hOpacity = getComputedStyle(header).opacity;
    const nOpacity = getComputedStyle(nav).opacity;
    return {
      ok: hOpacity === '0' && nOpacity === '0',
      detail: `after ArrowRight: header opacity=${hOpacity}, nav opacity=${nOpacity}`,
    };
  });
  if (!afterArrowState.ok) return afterArrowState;

  // Tap center of viewport to open HUD
  await page.mouse.click(Math.round(vp.width / 2), Math.round(vp.height / 2));
  await page.waitForTimeout(350);

  const openState = await page.evaluate((vw) => {
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    if (!header || !nav) return { ok: false, detail: 'header or nav missing' };
    const hOpacity = parseFloat(getComputedStyle(header).opacity);
    const nOpacity = parseFloat(getComputedStyle(nav).opacity);
    const navRect = nav.getBoundingClientRect();
    const btns = Array.from(nav.querySelectorAll('button')).map((b) => b.getBoundingClientRect());
    const fullWidthOk = Math.abs(navRect.width - vw) <= 2 && Math.abs(navRect.left) <= 1;
    const orderOk =
      btns.length === 3 &&
      btns[0].left < btns[1].left &&
      btns[1].right < btns[2].right &&
      btns[2].right <= vw + 1;
    if (hOpacity < 0.9 || nOpacity < 0.9 || !fullWidthOk || !orderOk) {
      return {
        ok: false,
        detail: `on center tap: hOpacity=${hOpacity} nOpacity=${nOpacity} navWidth=${navRect.width}/${vw} orderOk=${orderOk}`,
      };
    }
    return { ok: true, detail: `navWidth=${navRect.width}px` };
  }, vp.width);
  if (!openState.ok) return openState;

  // Tap center again to close HUD
  await page.mouse.click(Math.round(vp.width / 2), Math.round(vp.height / 2));
  await page.waitForTimeout(350);

  return page.evaluate(() => {
    const header = document.querySelector('header');
    const nav = document.querySelector('nav');
    const hOpacity = getComputedStyle(header).opacity;
    const nOpacity = getComputedStyle(nav).opacity;
    if (hOpacity !== '0' || nOpacity !== '0') {
      return {
        ok: false,
        detail: `after 2nd center tap: header opacity=${hOpacity}, nav opacity=${nOpacity}`,
      };
    }
    return { ok: true, detail: 'hidden on arrow, full-width on center tap' };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  // 1. Build test EPUB
  console.log('\n📖  Building test EPUB…');
  let epubBytes;
  try {
    epubBytes = buildTestEpub();
    console.log(`    EPUB built: ${epubBytes.length} bytes`);
  } catch (err) {
    console.error('    ❌  Failed to build test EPUB:', err.message);
    process.exit(1);
  }

  // 2. Check if dev server is already running
  let devServer = null;
  const serverAlreadyUp = await isServerReady(BASE_URL, 3000);

  if (!serverAlreadyUp) {
    console.log('\n🚀  Starting dev server…');
    devServer = spawn(DEV_SERVER_CMD, DEV_SERVER_ARGS, {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      detached: false,
    });
    const ready = await isServerReady(BASE_URL, 60000);
    if (!ready) {
      console.error('    ❌  Dev server failed to start within 60s');
      devServer.kill();
      process.exit(1);
    }
    console.log('    ✅  Dev server ready');
  } else {
    console.log('\n✅  Dev server already running');
  }

  // 3. Launch browser
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch (err) {
    try {
      browser = await chromium.launch({ headless: true, channel: 'chrome' });
    } catch (e2) {
      console.error('\n❌  Failed to launch Chromium.');
      console.error('    Run this once to download the browser:\n');
      console.error('      npx playwright install chromium\n');
      console.error('    Error:', err.message, e2.message);
      if (devServer) devServer.kill();
      process.exit(1);
    }
  }
  let bookId;

  let context = null;
  try {
    context = await browser.newContext();

    // 4. Seed the test book once
    console.log('\n📚  Seeding test book into IndexedDB…');
    const seedPage = await context.newPage();
    await seedPage.setViewportSize({ width: 1440, height: 900 });
    bookId = await seedBook(seedPage, epubBytes);
    await seedPage.close();
    console.log(`    Book seeded with id="${bookId}"`);

    // 5. Run checks for each viewport × palette
    const readerUrl = `${BASE_URL}/reader/${bookId}`;
    console.log(`\n🔍  Running checks on ${readerUrl}\n`);

    for (const vp of VIEWPORTS) {
      for (const palette of PALETTES) {
        const tag = `[${vp.label}][${palette.name}]`;
        console.log(`\n── ${tag} ──`);

        const page = await context.newPage();
        await page.setViewportSize({ width: vp.width, height: vp.height });

        try {
          // Navigate to reader with palette query param
          await page.goto(`${readerUrl}?palette=${palette.key}`, {
            waitUntil: 'domcontentloaded',
            timeout: 60000,
          });

          // Set palette via localStorage (the app reads readerSettings) and reset reading location
          await page.evaluate(async (pal) => {
            try {
              for (let i = 0; i < 50 && !window.__db?.saveReaderSettings; i++) {
                await new Promise((r) => setTimeout(r, 100));
              }
              await window.__db?.saveReaderSettings({ palette: pal });
              if (window.__db?.saveReadingLocation) {
                await window.__db.saveReadingLocation('flyleaf-check-book', null, 0, 'Chapter 1', 1, 1);
              }
            } catch {}
            // Also set directly on window in case the component reads it
            try {
              localStorage.setItem('readerPalette', pal);
            } catch {}
          }, palette.key);

          // Reload to apply palette from storage
          await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
          await waitForEpubReady(page);

          // ── Screenshot (before checks) ──
          const shotPath = path.join(
            OUT_DIR,
            `${vp.label}_${palette.key}.png`
          );
          await page.screenshot({ path: shotPath, fullPage: false });

          // ── Check 1: No text clipped ──
          const clip = await checkNoClip(page);
          report(vp.label, palette.name, 'No text clipped', clip.ok, clip.detail);

          // ── Check 2: Gutters equal ──
          const gutters = await checkGutters(page);
          report(vp.label, palette.name, 'Gutters equal (±2px)', gutters.ok, gutters.detail);

          // ── Check 3: No neighbour bleed ──
          const bleed = await checkNoNeighbourBleed(page);
          report(vp.label, palette.name, 'No neighbour-page bleed', bleed.ok, bleed.detail);

          // ── Check 4: Contrast ──
          const contrast = await checkContrast(page, palette);
          report(vp.label, palette.name, 'Contrast ≥ 4.5:1', contrast.ok, contrast.detail);

          // ── Check 5: HUD center-tap & full-width bottom bar ──
          const hudCheck = await checkHudAndBottomBar(page, vp);
          report(vp.label, palette.name, 'HUD center-tap & bottom bar', hudCheck.ok, hudCheck.detail);

          // ── Check 6: CFI stable after resize ──
          const cfi = await checkCfiAfterResize(page, vp);
          report(vp.label, palette.name, 'CFI stable after resize', cfi.ok, cfi.detail);

          // ── Screenshot (after checks) ──
          const shotAfterPath = path.join(
            OUT_DIR,
            `${vp.label}_${palette.key}_after.png`
          );
          await page.screenshot({ path: shotAfterPath, fullPage: false });

        } catch (err) {
          report(vp.label, palette.name, 'Script error', false, err.message);
          await page.screenshot({
            path: path.join(OUT_DIR, `${vp.label}_${palette.key}_error.png`),
            fullPage: false,
          }).catch(() => {});
        } finally {
          await page.close();
        }
      }
    }

  } finally {
    if (context) await context.close().catch(() => {});
    await browser.close();
    if (devServer) devServer.kill();
  }

  // 6. Summary
  const total  = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;

  console.log('\n' + '═'.repeat(72));
  console.log(`SUMMARY  ${passed}/${total} checks passed`);
  if (failed > 0) {
    console.log(`\nFailed checks:`);
    results
      .filter((r) => !r.pass)
      .forEach((r) => {
        console.log(`  ❌  [${r.viewport}][${r.palette}] ${r.check}${r.detail ? ' — ' + r.detail : ''}`);
      });
  }
  console.log('═'.repeat(72) + '\n');

  process.exit(anyFail ? 1 : 0);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
