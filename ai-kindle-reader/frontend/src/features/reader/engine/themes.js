import { READER_PALETTES } from '../constants';

export const THEME_PALETTES = new Proxy({}, {
  get(target, prop) {
    const key = prop === 'day' ? 'paper' : prop === 'dark' ? 'night' : prop;
    const p = (typeof READER_PALETTES !== 'undefined' && READER_PALETTES?.[key]) || READER_PALETTES?.paper;
    if (p) {
      return { bg: p.bg, text: p.fg, outer: p.bg };
    }
    return { bg: 'var(--reader-bg)', text: 'var(--reader-fg)', outer: 'var(--reader-bg)' };
  },
});

export function getFontStack(chosenFontFamily) {
  return chosenFontFamily === 'sans' || chosenFontFamily === 'inter'
    ? "'Inter', sans-serif"
    : chosenFontFamily === 'newsreader'
    ? "'Newsreader', Georgia, serif"
    : chosenFontFamily === 'garamond'
    ? "'EB Garamond', Georgia, serif"
    : chosenFontFamily === 'source-serif'
    ? "'Source Serif 4', Georgia, serif"
    : chosenFontFamily === 'lora'
    ? "'Lora', Georgia, serif"
    : chosenFontFamily === 'opendyslexic'
    ? "'OpenDyslexic', sans-serif"
    : "'Literata', Georgia, serif";
}

export function applyThemeToRendition(
  rendition,
  {
    settings = {},
    theme = 'paper',
    fontSize = 18.5,
    fontFamily = 'literata',
    cursorHidden = false,
  } = {}
) {
  if (!rendition) return;

  const chosenTheme = settings?.palette || settings?.theme || theme;
  const isSysDark =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const effectiveTheme =
    chosenTheme === 'auto' ? (isSysDark ? 'night' : 'paper') : chosenTheme;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const isPhone = typeof window !== 'undefined' && window.innerWidth < 768;
  const isTablet =
    typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024;
  const defaultResponsiveFontSize = isPhone ? 18 : isTablet ? 19 : 20;

  const chosenFontSize = settings?.fontSize || fontSize || defaultResponsiveFontSize;
  const chosenFontFamily = settings?.typeface || settings?.fontFamily || fontFamily;
  const rawAlign = settings?.align || settings?.textAlign || 'auto';
  const chosenAlign = rawAlign === 'auto' ? (isMobile ? 'left' : 'justify') : rawAlign;
  const chosenLineHeight = settings?.lineHeight || '1.75';

  const palette = THEME_PALETTES[effectiveTheme] || THEME_PALETTES.paper;
  const fontStack = getFontStack(chosenFontFamily);

  rendition.themes.default({
    'html, body': {
      background: `${palette.bg} !important`,
      color: `${palette.text} !important`,
      'font-family': `${fontStack} !important`,
      padding: '0 !important',
      margin: '0 !important',
      'padding-left': '0 !important',
      'padding-right': '0 !important',
      'padding-top': '0 !important',
      'padding-bottom': '0 !important',
      height: '100% !important',
      width: '100% !important',
      'box-sizing': 'border-box !important',
      '-webkit-user-select': 'text !important',
      'user-select': 'text !important',
      cursor: `${cursorHidden ? 'none' : 'default'} !important`,
      overflow: 'hidden !important',
      'scrollbar-width': 'none !important',
    },
    '::selection': {
      background: 'rgba(133, 82, 36, 0.25) !important',
      color: `${palette.text} !important`,
    },
    p: {
      'text-align': `${chosenAlign} !important`,
      'line-height': `${chosenLineHeight} !important`,
      'font-size': `${chosenFontSize}px !important`,
      'text-indent': '1.5em !important',
      'margin-top': '0 !important',
      'margin-bottom': '0.45em !important',
      ...(chosenAlign === 'justify'
        ? {
            '-webkit-hyphens': 'auto !important',
            '-ms-hyphens': 'auto !important',
            hyphens: 'auto !important',
          }
        : {}),
    },
    'p:first-of-type': {
      'text-indent': '0 !important',
    },
    'a, h1, h2, h3, h4, span, div': {
      color: `${palette.text} !important`,
    },
    img: {
      'max-width': '100% !important',
      'max-height': '100% !important',
      'object-fit': 'contain !important',
    },
  });
  rendition.themes.fontSize(`${chosenFontSize}px`);

  if (settings?.spread) {
    try {
      rendition.spread(settings.spread === 'auto' ? 'auto' : 'none');
    } catch (err) {
      console.warn('[ReaderCanvas] Failed to update spread:', err);
    }
  }
}
