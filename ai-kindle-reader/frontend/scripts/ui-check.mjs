#!/usr/bin/env node
/**
 * ui-check.mjs  –  Playwright smoke-check for Flyleaf Editorial Design Spec
 *
 * Visits every route:
 *   /, /library, /browse, /stats, /vocabulary, /settings, /book/[id], /reader/[id]
 *
 * Across viewports:
 *   390x844 (phone), 820x1180 (tablet), 1440x900 (desktop)
 *
 * In all 4 palettes:
 *   Paper, Sepia, Night, OLED
 *
 * Checks:
 *   1. No horizontal scroll (document.scrollWidth <= window.innerWidth + 2)
 *   2. Text/background contrast >= 4.5:1 on all visible text
 *   3. Touch targets >= 44x44px on phone (390x844)
 *   4. Zero console errors / uncaught page errors
 *   5. No forbidden styles in the DOM:
 *      - box-shadow other than floating overlays
 *      - background-image gradients on page containers
 *
 * Outputs:
 *   - Screenshots saved to scripts/out/
 *   - One visual contact sheet per palette (PNG + HTML) in scripts/out/
 *   - Detailed PASS/FAIL reporting and exit code (0 = all pass, 1 = failures)
 *
 * Usage:
 *   node scripts/ui-check.mjs
 *   npm run check:ui
 */

import { chromium } from 'playwright';
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'out');
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────
const BASE_URL = process.env.UI_CHECK_URL || 'http://localhost:3000';
const TEST_BOOK_ID = 'flyleaf-check-book';

const VIEWPORTS = [
  { label: 'phone',   width: 390,  height: 844,  isPhone: true  },
  { label: 'tablet',  width: 820,  height: 1180, isPhone: false },
  { label: 'desktop', width: 1440, height: 900,  isPhone: false },
];

const PALETTES = [
  { key: 'paper', name: 'Paper', bg: '#FAF9F6', ink: '#152A41', muted: '#43474D', accent: '#855224' },
  { key: 'sepia', name: 'Sepia', bg: '#F4ECD8', ink: '#2C2214', muted: '#5B472C', accent: '#7A491B' },
  { key: 'night', name: 'Night', bg: '#141824', ink: '#F0F2F5', muted: '#A0AEC0', accent: '#E2B170' },
  { key: 'oled',  name: 'OLED',  bg: '#000000', ink: '#EDEDED', muted: '#A0A0A0', accent: '#E2B170' },
];

const ALL_ROUTES = [
  { path: '/', slug: 'home', name: 'Home' },
  { path: '/library', slug: 'library', name: 'Library' },
  { path: '/browse', slug: 'browse', name: 'Browse' },
  { path: '/stats', slug: 'stats', name: 'Stats' },
  { path: '/vocabulary', slug: 'vocabulary', name: 'Vocabulary' },
  { path: '/settings', slug: 'settings', name: 'Settings' },
  { path: `/book/${TEST_BOOK_ID}`, slug: 'book-detail', name: 'Book Detail' },
  { path: `/reader/${TEST_BOOK_ID}`, slug: 'reader', name: 'Reader View' },
];

const ROUTES = process.env.UI_CHECK_ROUTES
  ? ALL_ROUTES.filter((r) =>
      process.env.UI_CHECK_ROUTES.split(',').some(
        (f) => r.slug === f.trim() || r.path === f.trim()
      )
    )
  : ALL_ROUTES;

// Mock catalog books for offline/sandboxed test consistency
const MOCK_CATALOG_BOOKS = [
  {
    id: 1342,
    title: 'Pride and Prejudice',
    authors: ['Jane Austen'],
    coverUrl: null,
    downloadUrl: '/api/download/1342',
    languages: ['en'],
    subjects: ['Classics', 'Fiction'],
    downloadCount: 42100,
    description: 'A masterpiece of wit, romance, and societal observation in 19th-century England.',
  },
  {
    id: 84,
    title: 'Frankenstein',
    authors: ['Mary Wollstonecraft Shelley'],
    coverUrl: null,
    downloadUrl: '/api/download/84',
    languages: ['en'],
    subjects: ['Gothic Fiction', 'Horror'],
    downloadCount: 38200,
    description: 'The chilling tale of Victor Frankenstein and the sentient creature of his ambition.',
  },
  {
    id: 28054,
    title: 'The Brothers Karamazov',
    authors: ['Fyodor Dostoyevsky'],
    coverUrl: null,
    downloadUrl: '/api/download/28054',
    languages: ['en'],
    subjects: ['Russian Lit', 'Philosophy'],
    downloadCount: 29500,
    description: 'A passionate philosophical novel that enters into questions of God, free will, and morality.',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// EPUB Builder (generates valid lightweight EPUB for testing)
// ─────────────────────────────────────────────────────────────────────────────
function buildTestEpub() {
  const epubCachedPath = path.join(OUT_DIR, 'test-book.epub');
  if (existsSync(epubCachedPath)) {
    try {
      return readFileSync(epubCachedPath);
    } catch {}
  }

  const chapters = [1, 2, 3].map((n) => {
    const paras = Array.from({ length: 11 }, (_, i) =>
      `<p>Chapter ${n}, paragraph ${i + 1}. ` +
      'The quiet editorial design prioritizes content and typography. '.repeat(6) +
      `End of paragraph ${i + 1}.</p>`
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
  <navMap>${ncxNavPoints}</navMap>
</ncx>`;

  const container = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

  const files = {
    'mimetype': 'application/epub+zip',
    'META-INF/container.xml': container,
    'content.opf': opf,
    'toc.ncx': ncx,
  };
  for (const c of chapters) {
    files[`OEBPS/${c.filename}`] = c.content;
  }

  const tmpDir = path.join(OUT_DIR, '_epub_ui_tmp');
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true });

  for (const [relPath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, relPath);
    mkdirSync(path.dirname(fullPath), { recursive: true });
    writeFileSync(fullPath, content, 'utf8');
  }

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

  const pyScriptPath = path.join(OUT_DIR, '_make_epub_ui.py');
  writeFileSync(pyScriptPath, pyScript, 'utf8');
  execSync(`python3 "${pyScriptPath}" "${epubCachedPath}" "${tmpDir}"`, { stdio: 'pipe' });
  return readFileSync(epubCachedPath);
}

// ─────────────────────────────────────────────────────────────────────────────
// Server Health Check & Start
// ─────────────────────────────────────────────────────────────────────────────
async function isServerReady(url, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.ok || res.status < 500) return true;
    } catch {}
    await new Promise((r) => setTimeout(r, 600));
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Database Seeding
// ─────────────────────────────────────────────────────────────────────────────
async function seedTestData(page, epubBytes) {
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  await page.evaluate(async ({ epubArray, bookId }) => {
    try {
      localStorage.setItem('flyleaf_first_run_completed', 'true');
      localStorage.setItem('flyleaf_first_run_dismissed', 'true');
      localStorage.setItem('flyleaf_display_name', 'Reader');
    } catch {}

    const bytes = new Uint8Array(epubArray);
    const blob = new Blob([bytes], { type: 'application/epub+zip' });

    for (let i = 0; i < 50 && !window.__db?.saveBook; i++) {
      await new Promise((r) => setTimeout(r, 100));
    }
    const { saveBook, saveVocabularyWord, logReadingSession } = window.__db || {};
    if (!saveBook) {
      throw new Error('window.__db is not available on client page');
    }

    // 1. Seed test book
    await saveBook(
      {
        id: bookId,
        title: 'Flyleaf Test Book',
        author: 'Test Author',
        status: 'reading',
        progress: 42,
        currentCfi: 'epubcfi(/6/2[chapter1]!/4/2/1:0)',
        lastRead: Date.now(),
        totalReadingTime: 3720,
        totalPages: 120,
        currentPage: 50,
      },
      blob
    );

    // 2. Seed vocabulary item
    try {
      await saveVocabularyWord({
        id: 'test-word-1',
        word: 'palimpsest',
        definition: 'Something reused or altered but still bearing visible traces of its earlier form.',
        contextSentence: 'The manuscript was a palimpsest of historical annotations.',
        bookId,
        bookTitle: 'Flyleaf Test Book',
        dateAdded: Date.now(),
        timesReviewed: 2,
        status: 'learning',
      });
    } catch {}

    // 3. Seed reading session for stats
    try {
      await logReadingSession({
        bookId,
        duration: 1800,
        pagesRead: 24,
        timestamp: Date.now(),
      });
    } catch {}
  }, { epubArray: Array.from(epubBytes), bookId: TEST_BOOK_ID });
}

// ─────────────────────────────────────────────────────────────────────────────
// In-Page Evaluation Checks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 1. Horizontal Scroll Check
 * Verifies document and body width does not overflow viewport width.
 */
function evaluateHorizontalScroll() {
  const doc = document.documentElement;
  const body = document.body;
  const viewportWidth = window.innerWidth;

  const docScroll = doc ? doc.scrollWidth : 0;
  const bodyScroll = body ? body.scrollWidth : 0;

  // 2px tolerance for sub-pixel zoom/rounding
  const docOverflow = docScroll - viewportWidth;
  const bodyOverflow = bodyScroll - viewportWidth;

  if (docOverflow > 2) {
    return {
      pass: false,
      detail: `document.scrollWidth (${docScroll}px) exceeds viewport width (${viewportWidth}px) by ${docOverflow}px`,
    };
  }
  if (bodyOverflow > 2) {
    return {
      pass: false,
      detail: `body.scrollWidth (${bodyScroll}px) exceeds viewport width (${viewportWidth}px) by ${bodyOverflow}px`,
    };
  }
  return { pass: true, detail: '' };
}

/**
 * 2. Contrast Check
 * Verifies all visible text elements meet WCAG AA contrast ratio (>= 4.5:1).
 */
function evaluateTextContrast(palette) {
  function parseRgba(colorStr) {
    if (!colorStr || colorStr === 'transparent') return null;
    const m = colorStr.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (!m) return null;
    return {
      r: parseInt(m[1], 10),
      g: parseInt(m[2], 10),
      b: parseInt(m[3], 10),
      a: m[4] !== undefined ? parseFloat(m[4]) : 1.0,
    };
  }

  function hexToRgba(hex) {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return { r, g, b, a: 1.0 };
  }

  function blend(fg, bg) {
    const alpha = fg.a;
    return {
      r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
      g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
      b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
      a: 1.0,
    };
  }

  function luminance({ r, g, b }) {
    const lin = (v) => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  }

  function contrastRatio(c1, c2) {
    const l1 = luminance(c1);
    const l2 = luminance(c2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  const rootBg = hexToRgba(palette.bg);
  const failures = [];

  // Find all elements containing direct rendered text
  const textElements = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
  let el = walker.nextNode();

  while (el) {
    const style = window.getComputedStyle(el);
    if (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      parseFloat(style.opacity || '1') >= 0.1 &&
      !el.closest('[disabled], [aria-disabled="true"], .pointer-events-none, [data-skeleton], .animate-pulse')
    ) {
      // Check if element has direct text content
      const hasDirectText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0
      );
      if (hasDirectText) {
        textElements.push({ el, style });
      }
    }
    el = walker.nextNode();
  }

  for (const { el: target, style } of textElements) {
    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    const fgColor = parseRgba(style.color);
    if (!fgColor) continue;

    // Resolve effective background color by traversing ancestors
    let cur = target;
    const bgLayers = [];
    while (cur && cur !== document.documentElement) {
      const cs = cur === target ? style : window.getComputedStyle(cur);
      const bg = parseRgba(cs.backgroundColor);
      if (bg && bg.a > 0) {
        bgLayers.push(bg);
        if (bg.a >= 0.99) break;
      }
      cur = cur.parentElement;
    }
    bgLayers.push(rootBg);

    // Composite background layers
    let compositeBg = rootBg;
    for (let i = bgLayers.length - 1; i >= 0; i--) {
      compositeBg = blend(bgLayers[i], compositeBg);
    }

    const effectiveFg = fgColor.a < 1.0 ? blend(fgColor, compositeBg) : fgColor;
    const ratio = contrastRatio(effectiveFg, compositeBg);

    if (ratio < 4.5) {
      const textPreview = target.textContent.trim().slice(0, 30).replace(/\s+/g, ' ');
      failures.push(
        `<${target.tagName.toLowerCase()}> "${textPreview}": ratio ${ratio.toFixed(2)}:1 (< 4.5:1)`
      );
      if (failures.length >= 6) break;
    }
  }

  if (failures.length > 0) {
    return { pass: false, detail: failures.join(' | ') };
  }
  return { pass: true, detail: '' };
}

/**
 * 3. Touch Target Check
 * Verifies interactive elements on phone (390x844) meet min 44x44px.
 */
function evaluateTouchTargets() {
  const interactiveSelectors = [
    'button',
    'a',
    'input',
    'select',
    'textarea',
    '[role="button"]',
    '[role="tab"]',
    '[role="checkbox"]',
    '[role="switch"]',
  ];

  const elements = document.querySelectorAll(interactiveSelectors.join(','));
  const failures = [];

  for (const el of elements) {
    // Ignore hidden or disabled elements
    if (el.closest('[disabled], [aria-disabled="true"], .pointer-events-none, [aria-hidden="true"]')) {
      continue;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;

    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) {
      continue;
    }

    // Exempt inline text links within flowing prose paragraphs
    if (el.tagName === 'A' && style.display === 'inline') {
      const parent = el.parentElement;
      if (parent && (parent.tagName === 'P' || parent.tagName === 'SPAN')) {
        const pText = parent.textContent.trim();
        const aText = el.textContent.trim();
        if (pText.length > aText.length + 6) {
          continue;
        }
      }
    }

    // Touch targets must be >= 44px in width and height
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);

    if (w < 44 || h < 44) {
      const label = (
        el.getAttribute('aria-label') ||
        el.textContent ||
        el.getAttribute('placeholder') ||
        el.id ||
        el.className
      ).trim().slice(0, 24);
      failures.push(`<${el.tagName.toLowerCase()}> "${label}": ${w}×${h}px (< 44×44px)`);
      if (failures.length >= 6) break;
    }
  }

  if (failures.length > 0) {
    return { pass: false, detail: failures.join(' | ') };
  }
  return { pass: true, detail: '' };
}

/**
 * 5. Forbidden Styles Check
 * Verifies:
 *   - No box-shadow except on floating overlays (popovers, sheets, toasts, dialogs)
 *   - No background-image gradients on page containers / surfaces
 */
function evaluateForbiddenStyles() {
  const failures = [];

  // Helper to test if element is a legitimate floating overlay
  function isOverlay(el) {
    if (!el) return false;
    // Check if element itself or any ancestor is an overlay/dialog/popover
    const overlayAncestor = el.closest(
      '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="tooltip"], [role="status"], [data-overlay], [data-modal], [data-popover], [data-sidepanel], [data-toast], [data-floating]'
    );
    if (overlayAncestor) return true;

    // Check class names and positioning up ancestor chain
    let cur = el;
    while (cur && cur !== document.body && cur !== document.documentElement) {
      const cls = String(cur.className || '').toLowerCase();
      if (
        cls.includes('overlay') ||
        cls.includes('popover') ||
        cls.includes('panel') ||
        cls.includes('sheet') ||
        cls.includes('toast') ||
        cls.includes('modal') ||
        cls.includes('dialog') ||
        cls.includes('drawer') ||
        cls.includes('dropdown')
      ) {
        return true;
      }
      const st = window.getComputedStyle(cur);
      if ((st.position === 'fixed' || st.position === 'absolute') && parseInt(st.zIndex || '0', 10) >= 20) {
        return true;
      }
      cur = cur.parentElement;
    }

    return false;
  }

  // Helper to distinguish real drop shadows from 0px CSS resets (like Tailwind's default ring/shadow variables)
  function hasActualDropShadow(boxShadowStr) {
    if (!boxShadowStr || boxShadowStr === 'none') return false;
    const parts = boxShadowStr.split(/,(?![^(]*\))/);
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('inset')) continue; // Inset hairline styling
      const lengths = trimmed.match(/-?[\d.]+px/g);
      if (!lengths || lengths.length < 2) continue;
      const x = parseFloat(lengths[0]);
      const y = parseFloat(lengths[1]);
      const blur = lengths[2] ? parseFloat(lengths[2]) : 0;
      const spread = lengths[3] ? parseFloat(lengths[3]) : 0;
      // If there is visible displacement or blur
      if (blur > 0 || Math.abs(spread) > 0 || Math.abs(x) > 0 || Math.abs(y) > 0) {
        // Exclude fully transparent shadows
        const colorMatch = trimmed.match(/rgba?\([^)]+\)/);
        if (colorMatch) {
          const rgba = colorMatch[0];
          if (rgba.includes('rgba') && (rgba.endsWith(', 0)') || rgba.endsWith(', 0.0)'))) {
            continue;
          }
        }
        return true;
      }
    }
    return false;
  }

  // 1. Check all elements for drop shadows
  const allElements = document.querySelectorAll('*');
  for (const el of allElements) {
    const style = window.getComputedStyle(el);
    const bs = style.boxShadow;

    if (hasActualDropShadow(bs)) {
      // Allow only on floating overlays
      if (!isOverlay(el)) {
        const cls = String(el.className || '').slice(0, 36);
        failures.push(`Forbidden box-shadow on <${el.tagName.toLowerCase()} class="${cls}">: ${bs.slice(0, 45)}`);
        if (failures.length >= 5) break;
      }
    }
  }

  // 2. Check page containers for background-image gradients
  const containerSelectors = [
    'body',
    'main',
    '#root',
    'header',
    'nav',
    'section',
    'article',
    '[class*="container"]',
    '[class*="card"]',
    '[data-page]',
    '[class*="page"]',
    'div[class*="min-h-screen"]',
    'div[class*="w-full"]',
  ];

  const containers = document.querySelectorAll(containerSelectors.join(','));
  for (const el of containers) {
    const style = window.getComputedStyle(el);
    const bgImg = style.backgroundImage;
    if (bgImg && bgImg !== 'none' && bgImg.includes('gradient')) {
      const cls = String(el.className || '').slice(0, 36);
      failures.push(`Forbidden gradient on container <${el.tagName.toLowerCase()} class="${cls}">: ${bgImg.slice(0, 45)}`);
      if (failures.length >= 5) break;
    }
  }

  if (failures.length > 0) {
    return { pass: false, detail: failures.join(' | ') };
  }
  return { pass: true, detail: '' };
}

/**
 * 6. Desktop Layout & Width Integrity Check
 * Verifies:
 *   - At >= 1024px, on all standard pages (except settings and reader),
 *     content width === min(available width minus gutters, the page's max width)
 *   - No text is clipped or truncated unintentionally
 *     (scrollWidth <= clientWidth + 1 on headings and buttons)
 */
function evaluateDesktopLayout() {
  const container = document.querySelector('[data-page-container]');
  if (!container) {
    return { pass: true, detail: 'No PageContainer' };
  }

  // Settings uses size="narrow" and is explicitly excluded
  const size = container.getAttribute('data-size') || 'default';
  if (size === 'narrow') {
    return { pass: true, detail: 'Skipped narrow (settings)' };
  }

  const mainEl = document.querySelector('main') || container.parentElement;
  // Available width is main content area (clientWidth minus main horizontal padding, e.g. lg:pl-64 sidebar)
  let availableWidth;
  if (mainEl) {
    const mainStyle = window.getComputedStyle(mainEl);
    const mainPl = parseFloat(mainStyle.paddingLeft) || 0;
    const mainPr = parseFloat(mainStyle.paddingRight) || 0;
    availableWidth = mainEl.clientWidth - mainPl - mainPr;
  } else {
    availableWidth = window.innerWidth - 256;
  }

  const containerStyle = window.getComputedStyle(container);
  const paddingLeft = parseFloat(containerStyle.paddingLeft) || 0;
  const paddingRight = parseFloat(containerStyle.paddingRight) || 0;
  const gutters = paddingLeft + paddingRight;

  // Max width of PageContainer (default: 1152px at < 1536px, 1280px at >= 1536px)
  const pageMaxWidth = parseFloat(containerStyle.maxWidth) || 1152;
  const maxContentWidth = pageMaxWidth - gutters;

  // Content width inside PageContainer
  const contentWidth = container.clientWidth - gutters;
  const expectedContentWidth = Math.min(availableWidth - gutters, maxContentWidth);
  const expectedContainerWidth = Math.min(availableWidth, pageMaxWidth);

  const containerDiff = Math.abs(container.clientWidth - expectedContainerWidth);
  const contentDiff = Math.abs(contentWidth - expectedContentWidth);

  // Allow up to 2px tolerance for subpixel / scrollbar rounding
  if (containerDiff > 2 && contentDiff > 2) {
    return {
      pass: false,
      detail: `Content width ${contentWidth}px (container ${container.clientWidth}px) does not match expected min(available - gutters, page max) = ${expectedContentWidth}px (expected container ${expectedContainerWidth}px, diff: ${containerDiff}px)`,
    };
  }

  // Heading and button unintentional clipping check
  // (compare scrollWidth with clientWidth on headings and buttons)
  const elements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, button, [role="button"]');
  const clippingFailures = [];

  for (const el of elements) {
    // Ignore invisible / hidden elements and book cover jackets
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) {
      continue;
    }
    if (el.closest('[aria-hidden="true"], [data-hidden="true"], [data-cover]')) continue;

    // Check horizontal scrollWidth vs clientWidth + 1px tolerance
    if (el.scrollWidth > el.clientWidth + 1) {
      const tag = el.tagName.toLowerCase();
      const text = (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 32);
      clippingFailures.push(
        `<${tag}> "${text}": scrollWidth ${el.scrollWidth}px > clientWidth ${el.clientWidth}px`
      );
      if (clippingFailures.length >= 5) break;
    }
  }

  if (clippingFailures.length > 0) {
    return {
      pass: false,
      detail: `Unintentional text clipping: ${clippingFailures.join(' | ')}`,
    };
  }

  return {
    pass: true,
    detail: `content width ${contentWidth}px === min(${availableWidth - gutters}, ${maxContentWidth})px`,
  };
}

/**
 * Evaluates the 1210x756 Home screen specific requirements:
 * - Full book title visible (up to 3 lines, not clipped)
 * - One-line Resume button (whitespace-nowrap)
 * - One-line stat labels (whitespace-nowrap)
 */
function evaluateHome1210() {
  const container = document.querySelector('[data-page-container]');
  if (!container) return { pass: false, detail: 'PageContainer not found on Home' };

  // 1. Hero title: line-clamp-3, scrollWidth <= clientWidth + 1
  const heroTitle = container.querySelector('h2');
  if (!heroTitle) return { pass: false, detail: 'Hero title not found' };
  if (heroTitle.scrollWidth > heroTitle.clientWidth + 1) {
    return {
      pass: false,
      detail: `Hero title clipped: scrollWidth ${heroTitle.scrollWidth} > clientWidth ${heroTitle.clientWidth}`,
    };
  }

  // 2. Resume button: one-line (not wrapped) and scrollWidth <= clientWidth + 1
  const buttons = Array.from(container.querySelectorAll('button, [role="button"], a button'));
  const resumeBtn = buttons.find((b) => b.textContent && b.textContent.includes('Resume'));
  if (!resumeBtn) return { pass: false, detail: 'Resume button not found' };

  // Verify it is on one line: clientHeight should be standard button height (~40-48px), not double-line (~60-80px)
  if (resumeBtn.clientHeight > 52) {
    return { pass: false, detail: `Resume button wrapped onto multiple lines (height: ${resumeBtn.clientHeight}px)` };
  }
  if (resumeBtn.scrollWidth > resumeBtn.clientWidth + 1) {
    return { pass: false, detail: 'Resume button text clipped horizontally' };
  }

  // 3. Stat labels: one line, whitespace-nowrap, scrollWidth <= clientWidth + 1
  const statLabels = Array.from(container.querySelectorAll('.divide-x span')).filter(
    (s) => s.textContent && ['TIME READ', 'PAGES READ', 'DAY STREAK'].includes(s.textContent.trim().toUpperCase())
  );
  if (statLabels.length < 3) {
    return { pass: false, detail: `Found only ${statLabels.length}/3 stat labels` };
  }
  for (const label of statLabels) {
    if (label.scrollWidth > label.clientWidth + 1) {
      return { pass: false, detail: `Stat label "${label.textContent.trim()}" clipped horizontally` };
    }
    if (label.clientHeight > 24) {
      return { pass: false, detail: `Stat label "${label.textContent.trim()}" wrapped onto multiple lines` };
    }
  }

  return { pass: true, detail: 'Full title visible, one-line Resume button, one-line stat labels' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact Sheet Builder (HTML + PNG per palette)
// ─────────────────────────────────────────────────────────────────────────────
async function generateContactSheet(browser, palette, results) {
  const paletteResults = results.filter((r) => r.palette === palette.key);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Flyleaf Editorial UI Check — ${palette.name} Palette</title>
  <style>
    :root {
      --bg: ${palette.bg};
      --ink: ${palette.ink};
      --muted: ${palette.muted};
      --accent: ${palette.accent};
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--ink);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;
      padding: 40px;
      line-height: 1.5;
    }
    header {
      border-bottom: 1px solid rgba(128,128,128,0.2);
      padding-bottom: 24px;
      margin-bottom: 32px;
    }
    .eyebrow {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--muted);
      margin-bottom: 8px;
    }
    h1 {
      font-family: Newsreader, Literata, Georgia, serif;
      font-size: 36px;
      font-weight: 400;
      color: var(--ink);
    }
    .summary-bar {
      margin-top: 12px;
      display: flex;
      gap: 24px;
      font-size: 14px;
      color: var(--muted);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 32px;
    }
    .card {
      border: 1px solid rgba(128,128,128,0.2);
      border-radius: 12px;
      overflow: hidden;
      background: var(--bg);
      display: flex;
      flex-direction: column;
    }
    .card-header {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(128,128,128,0.15);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-title {
      font-family: Newsreader, Literata, Georgia, serif;
      font-size: 18px;
      color: var(--ink);
    }
    .badge {
      font-size: 11px;
      padding: 3px 8px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 500;
    }
    .badge.pass { background: rgba(42, 107, 72, 0.15); color: #2A6B48; }
    .badge.fail { background: rgba(158, 53, 53, 0.15); color: #9E3535; }
    .thumb-wrap {
      width: 100%;
      height: 240px;
      overflow: hidden;
      background: rgba(128,128,128,0.05);
      display: flex;
      align-items: flex-start;
      justify-content: center;
    }
    .thumb-wrap img {
      width: 100%;
      height: auto;
      display: block;
    }
    .card-checks {
      padding: 12px 16px;
      font-size: 12px;
      color: var(--muted);
      border-top: 1px solid rgba(128,128,128,0.1);
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .check-row {
      display: flex;
      justify-content: space-between;
    }
    .check-name { color: var(--muted); }
    .check-val.ok { color: #2A6B48; }
    .check-val.err { color: #9E3535; font-weight: 500; }
  </style>
</head>
<body>
  <header>
    <div class="eyebrow">Flyleaf Design System — Contact Sheet</div>
    <h1>${palette.name} Palette (${paletteResults.length} Viewports Tested)</h1>
    <div class="summary-bar">
      <span>Pass: ${paletteResults.filter((r) => r.allPass).length}</span>
      <span>Fail: ${paletteResults.filter((r) => !r.allPass).length}</span>
      <span>Background: ${palette.bg}</span>
      <span>Ink: ${palette.ink}</span>
    </div>
  </header>

  <div class="grid">
    ${paletteResults
      .map((r) => {
        const badgeClass = r.allPass ? 'pass' : 'fail';
        const badgeText = r.allPass ? 'ALL PASS' : 'ISSUES DETECTED';
        const relImg = path.basename(r.screenshotPath);
        return `
      <div class="card">
        <div class="card-header">
          <div class="card-title">${r.routeName} (${r.vpLabel})</div>
          <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="thumb-wrap">
          <img src="${relImg}" alt="${r.routeName} - ${r.vpLabel}" />
        </div>
        <div class="card-checks">
          <div class="check-row">
            <span class="check-name">Horizontal Scroll</span>
            <span class="check-val ${r.checks.noHScroll.pass ? 'ok' : 'err'}">${r.checks.noHScroll.pass ? 'PASS' : 'FAIL'}</span>
          </div>
          <div class="check-row">
            <span class="check-name">Text Contrast (≥ 4.5:1)</span>
            <span class="check-val ${r.checks.contrast.pass ? 'ok' : 'err'}">${r.checks.contrast.pass ? 'PASS' : 'FAIL'}</span>
          </div>
          ${
            r.isPhone
              ? `
          <div class="check-row">
            <span class="check-name">Touch Targets (≥ 44px)</span>
            <span class="check-val ${r.checks.touchTargets.pass ? 'ok' : 'err'}">${r.checks.touchTargets.pass ? 'PASS' : 'FAIL'}</span>
          </div>`
              : ''
          }
          <div class="check-row">
            <span class="check-name">Console Errors</span>
            <span class="check-val ${r.checks.consoleErrors.pass ? 'ok' : 'err'}">${r.checks.consoleErrors.pass ? 'PASS' : 'FAIL'}</span>
          </div>
          <div class="check-row">
            <span class="check-name">Forbidden Styles</span>
            <span class="check-val ${r.checks.forbiddenStyles.pass ? 'ok' : 'err'}">${r.checks.forbiddenStyles.pass ? 'PASS' : 'FAIL'}</span>
          </div>
          ${
            r.checks.desktopLayout
              ? `
          <div class="check-row">
            <span class="check-name">Desktop Layout</span>
            <span class="check-val ${r.checks.desktopLayout.pass ? 'ok' : 'err'}">${r.checks.desktopLayout.pass ? 'PASS' : 'FAIL'}</span>
          </div>`
              : ''
          }
        </div>
      </div>`;
      })
      .join('\n')}
  </div>
</body>
</html>`;

  const htmlPath = path.join(OUT_DIR, `contact-sheet-${palette.key}.html`);
  const pngPath = path.join(OUT_DIR, `contact-sheet-${palette.key}.png`);
  writeFileSync(htmlPath, htmlContent, 'utf8');

  // Render HTML contact sheet to PNG screenshot via Playwright
  const csPage = await browser.newPage();
  await csPage.setViewportSize({ width: 1440, height: 1600 });
  await csPage.goto(`file://${htmlPath}`, { waitUntil: 'load' });
  await csPage.screenshot({ path: pngPath, fullPage: true });
  await csPage.close();
}

// ─────────────────────────────────────────────────────────────────────────────
// Source Code Color Audit
// ─────────────────────────────────────────────────────────────────────────────
export function checkSourceForHardcodedColors() {
  const frontendDir = path.resolve(__dirname, '..');
  const searchDirs = [
    path.join(frontendDir, 'app'),
    path.join(frontendDir, 'components'),
  ];

  function walk(dir) {
    let files = [];
    try {
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry);
        const st = statSync(full);
        if (st.isDirectory()) {
          if (entry === 'node_modules' || entry === '.next' || entry === 'out' || entry === '.git') continue;
          files.push(...walk(full));
        } else if (/\.(jsx?|tsx?|css)$/.test(entry)) {
          files.push(full);
        }
      }
    } catch {}
    return files;
  }

  const allFiles = searchDirs.flatMap(walk);
  const violations = [];

  for (const file of allFiles) {
    const rel = path.relative(frontendDir, file);
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

      // 1. Tailwind black/white utilities
      const bwMatches = line.match(/\b(text|bg|border)-(black|white)(\/[0-9]+)?\b/g);
      if (bwMatches) {
        bwMatches.forEach((m) => {
          violations.push({ file: rel, line: lineNum, issue: m, snippet: trimmed });
        });
      }

      // 2. Arbitrary bracket hex/color classes
      const bracketMatches = line.match(/(?:bg|text|border|ring|fill|stroke)-\[#(?:[0-9a-fA-F]{3,8})\]/g);
      if (bracketMatches) {
        bracketMatches.forEach((m) => {
          violations.push({ file: rel, line: lineNum, issue: m, snippet: trimmed });
        });
      }

      // 3. Raw hex colors in JS/JSX code outside of canonical definitions
      if (!file.endsWith('.css')) {
        // Exempt canonical READER_PALETTES in reader/[id]/page.js (single source of truth)
        if (rel.includes('reader/[id]/page.js') && lineNum >= 80 && lineNum <= 113) return;
        // Exempt PWA manifest.js
        if (rel === 'src/app/manifest.js') return;

        const hexMatches = line.match(/#[0-9a-fA-F]{3,8}\b/g);
        if (hexMatches) {
          hexMatches.forEach((m) => {
            violations.push({ file: rel, line: lineNum, issue: m, snippet: trimmed });
          });
        }
      }
    });
  }

  return violations;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Check Suite
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('─────────────────────────────────────────────────────────────────────────────');
  console.log('🏛️   Flyleaf Editorial Design System — UI Check Suite');
  console.log('─────────────────────────────────────────────────────────────────────────────');

  console.log('🔍  Auditing source files for hardcoded colors…');
  const hardcodedViolations = checkSourceForHardcodedColors();
  if (hardcodedViolations.length > 0) {
    console.log(`  ❌  Found ${hardcodedViolations.length} hardcoded color(s) in source files:`);
    for (const v of hardcodedViolations) {
      console.log(`      ↳ ${v.file}:${v.line} [${v.issue}] ${v.snippet}`);
    }
  } else {
    console.log('  ✅  Source code color audit: No hardcoded colors found (all tokens compliant)\n');
  }

  let devServer = null;
  const serverAlreadyUp = await isServerReady(BASE_URL, 3000);
  if (!serverAlreadyUp) {
    console.log('🚀  Starting dev server…');
    devServer = spawn('npm', ['run', 'dev'], {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'pipe',
      detached: false,
    });
    const ready = await isServerReady(BASE_URL, 60000);
    if (!ready) {
      console.error('    ❌  Dev server failed to start within 60s');
      if (devServer) devServer.kill();
      process.exit(1);
    }
    console.log('    ✅  Dev server ready\n');
  } else {
    console.log(`✅  Connected to dev server at ${BASE_URL}\n`);
  }

  console.log('📦  Building test EPUB and preparing test book…');
  const epubBytes = buildTestEpub();

  let browser;
  try {
    browser = await chromium.launch({ headless: true, channel: 'chrome' });
  } catch (err) {
    try {
      browser = await chromium.launch({ headless: true });
    } catch (e2) {
      console.error('❌ Failed to launch browser:', err.message, e2.message);
      process.exit(1);
    }
  }

  // Create single browser context so IndexedDB and settings persist across all checks
  const context = await browser.newContext();

  // Route mock catalog books so /browse renders reliably in sandboxed/offline environments
  await context.route('**/api/catalog/browse*', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        statusCode: 200,
        data: {
          total: MOCK_CATALOG_BOOKS.length,
          page: 1,
          books: MOCK_CATALOG_BOOKS,
        },
        message: 'Mock catalog for UI check',
      }),
    });
  });

  // Seed IndexedDB
  console.log('🌱  Seeding test data into IndexedDB…');
  const seedPage = await context.newPage();
  await seedPage.setViewportSize({ width: 1440, height: 900 });
  await seedTestData(seedPage, epubBytes);
  await seedPage.close();
  console.log('✅  Test data seeded successfully.\n');

  const allResults = [];
  let totalChecks = 1; // 1 for source color audit
  let totalFailures = hardcodedViolations.length;

  const page = await context.newPage();

  for (const palette of PALETTES) {
    console.log(`\n🎨  Palette: ${palette.name.toUpperCase()} (bg: ${palette.bg}, ink: ${palette.ink})`);
    console.log('─'.repeat(75));

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      for (const route of ROUTES) {
        const consoleErrors = [];
        const onConsole = (msg) => {
          if (msg.type() === 'error') {
            consoleErrors.push(msg.text());
          }
        };
        const onPageError = (err) => {
          consoleErrors.push(err.message || String(err));
        };
        const onResponse = (res) => {
          if (res.status() >= 400) {
            consoleErrors.push(`HTTP ${res.status()}: ${res.url()}`);
          }
        };

        page.on('console', onConsole);
        page.on('pageerror', onPageError);
        page.on('response', onResponse);

        const targetUrl = `${BASE_URL}${route.path}`;
        try {
          await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });

          // Apply active palette to document and localStorage
          await page.evaluate((palKey) => {
            try {
              localStorage.setItem('flyleaf-theme', palKey);
              localStorage.setItem('flyleaf_first_run_completed', 'true');
              localStorage.setItem('flyleaf_first_run_dismissed', 'true');
            } catch {}
            const el = document.documentElement;
            el.classList.remove('paper', 'sepia', 'dark', 'night', 'oled');
            if (palKey === 'night') el.classList.add('dark', 'night');
            else if (palKey === 'oled') el.classList.add('dark', 'oled');
            else if (palKey === 'sepia') el.classList.add('sepia');
            else el.classList.add('paper');
            el.setAttribute('data-theme', palKey);
          }, palette.key);

          // Extra settle time for epub.js reader or data fetching
          if (route.slug === 'reader') {
            await page.waitForFunction(
              () => {
                const iframe = document.querySelector('iframe');
                return iframe && iframe.contentDocument?.body?.innerText?.trim().length > 0;
              },
              { timeout: 8000 }
            ).catch(() => {});
            await page.waitForTimeout(1000);
          } else {
            await page.waitForTimeout(400);
          }

          // Capture screenshot
          const screenshotName = `ui-${palette.key}-${route.slug}-${vp.label}.png`;
          const screenshotPath = path.join(OUT_DIR, screenshotName);
          await page.screenshot({ path: screenshotPath, fullPage: false });

          // Run checks
          const hScrollRes = await page.evaluate(evaluateHorizontalScroll);
          const contrastRes = await page.evaluate(evaluateTextContrast, palette);
          const forbiddenRes = await page.evaluate(evaluateForbiddenStyles);
          const touchRes = vp.isPhone
            ? await page.evaluate(evaluateTouchTargets)
            : { pass: true, detail: '' };
          const isEligibleDesktop = !vp.isPhone && vp.width >= 1024 && route.slug !== 'settings' && route.slug !== 'reader' && route.slug !== 'book-detail';
          const desktopLayoutRes = isEligibleDesktop
            ? await page.evaluate(evaluateDesktopLayout)
            : { pass: true, detail: '' };

          const consolePass = consoleErrors.length === 0;
          const consoleDetail = consoleErrors.join(' | ');

          const checkItems = {
            noHScroll: hScrollRes,
            contrast: contrastRes,
            touchTargets: touchRes,
            consoleErrors: { pass: consolePass, detail: consoleDetail },
            forbiddenStyles: forbiddenRes,
          };
          if (isEligibleDesktop) {
            checkItems.desktopLayout = desktopLayoutRes;
          }

          const checkKeys = ['noHScroll', 'contrast', 'consoleErrors', 'forbiddenStyles'];
          if (vp.isPhone) checkKeys.push('touchTargets');
          if (isEligibleDesktop) checkKeys.push('desktopLayout');

          const allPass = checkKeys.every((k) => checkItems[k].pass);
          totalChecks += checkKeys.length;

          const failedKeys = checkKeys.filter((k) => !checkItems[k].pass);
          totalFailures += failedKeys.length;

          const statusIcon = allPass ? '✅' : '❌';
          const routeLabel = `${route.name.padEnd(14)} [${vp.label.padEnd(7)}]`;

          if (allPass) {
            console.log(`  ${statusIcon}  ${routeLabel}  All checks PASSED`);
          } else {
            console.log(`  ${statusIcon}  ${routeLabel}  FAILED: ${failedKeys.join(', ')}`);
            for (const fk of failedKeys) {
              console.log(`      ↳ ${fk}: ${checkItems[fk].detail}`);
            }
          }

          allResults.push({
            palette: palette.key,
            paletteName: palette.name,
            routeName: route.name,
            routeSlug: route.slug,
            vpLabel: vp.label,
            isPhone: vp.isPhone,
            screenshotPath,
            allPass,
            checks: checkItems,
          });
        } catch (routeErr) {
          totalFailures++;
          console.log(`  ❌  ${route.name.padEnd(14)} [${vp.label.padEnd(7)}] CRASHED: ${routeErr.message}`);
          allResults.push({
            palette: palette.key,
            paletteName: palette.name,
            routeName: route.name,
            routeSlug: route.slug,
            vpLabel: vp.label,
            isPhone: vp.isPhone,
            screenshotPath: '',
            allPass: false,
            checks: {
              noHScroll: { pass: false, detail: 'Page crashed' },
              contrast: { pass: false, detail: 'Page crashed' },
              touchTargets: { pass: false, detail: 'Page crashed' },
              consoleErrors: { pass: false, detail: routeErr.message },
              forbiddenStyles: { pass: false, detail: 'Page crashed' },
            },
          });
        } finally {
          page.off('console', onConsole);
          page.off('pageerror', onPageError);
          page.off('response', onResponse);
        }
      }
    }

    // Generate Contact Sheet for this palette
    console.log(`\n📸  Generating contact sheet for ${palette.name}…`);
    await generateContactSheet(browser, palette, allResults);
    console.log(`    Saved: scripts/out/contact-sheet-${palette.key}.png`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Desktop Layout Integrity Check (1024, 1210, 1280, 1440, 1920px)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📐  Desktop Layout & Width Integrity Check (1024, 1210, 1280, 1440, 1920px)…');
  console.log('─'.repeat(75));

  const desktopTestViewports = [
    { width: 1024, height: 768, label: '1024px' },
    { width: 1210, height: 756, label: '1210px' },
    { width: 1280, height: 800, label: '1280px' },
    { width: 1440, height: 900, label: '1440px' },
    { width: 1920, height: 1080, label: '1920px' },
  ];

  const desktopRoutes = ROUTES.filter(
    (r) => r.slug !== 'settings' && r.slug !== 'reader' && r.slug !== 'book-detail'
  );

  const desktopPage = await context.newPage();

  for (const vp of desktopTestViewports) {
    await desktopPage.setViewportSize({ width: vp.width, height: vp.height });

    for (const route of desktopRoutes) {
      totalChecks++;
      const targetUrl = `${BASE_URL}${route.path}`;
      try {
        await desktopPage.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await desktopPage.waitForTimeout(350);

        const layoutRes = await desktopPage.evaluate(evaluateDesktopLayout);
        if (!layoutRes.pass) {
          totalFailures++;
          console.log(`  ❌  ${route.name.padEnd(14)} [${vp.label.padEnd(7)}] FAILED layout check: ${layoutRes.detail}`);
        } else {
          console.log(`  ✅  ${route.name.padEnd(14)} [${vp.label.padEnd(7)}] Layout OK: ${layoutRes.detail}`);
        }

        if (vp.width === 1210 && route.slug === 'home') {
          totalChecks++;
          const home1210Res = await desktopPage.evaluate(evaluateHome1210);
          if (!home1210Res.pass) {
            totalFailures++;
            console.log(`  ❌  Home 1210x756 Card Check FAILED: ${home1210Res.detail}`);
          } else {
            console.log(`  ✅  Home 1210x756 Card Check PASSED: ${home1210Res.detail}`);
          }
        }
      } catch (err) {
        totalFailures++;
        console.log(`  ❌  ${route.name.padEnd(14)} [${vp.label.padEnd(7)}] Desktop check error: ${err.message}`);
      }
    }
  }

  await desktopPage.close();

  await page.close();
  await context.close();
  await browser.close();
  if (devServer) devServer.kill();

  // Summary Report
  console.log('\n═════════════════════════════════════════════════════════════════════════════');
  console.log('📊  UI Check Results Summary');
  console.log('═════════════════════════════════════════════════════════════════════════════');
  console.log(`Hardcoded colors : ${hardcodedViolations.length === 0 ? '0 (PASS)' : `${hardcodedViolations.length} FAILURES`}`);
  console.log(`Total checks run : ${totalChecks}`);
  console.log(`Failed checks    : ${totalFailures}`);
  console.log(`Passed checks    : ${totalChecks - totalFailures}`);
  console.log(`Contact sheets   : 4 (Paper, Sepia, Night, OLED) in scripts/out/`);
  console.log('═════════════════════════════════════════════════════════════════════════════');

  if (totalFailures > 0) {
    console.log(`\n❌  UI Check completed with ${totalFailures} failures.`);
    process.exit(1);
  } else {
    console.log('\n🎉  All UI checks PASSED! Flyleaf Editorial Design Spec fully verified.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\n💥 Fatal error in ui-check:', err);
  process.exit(1);
});
