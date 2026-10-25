/**
 * Breakpoints: phone < 768px, tablet 768-1023px, desktop >= 1024px.
 * Sizing rules:
 * - phone: stage width minus 2x16px (stageWidth - 32px)
 * - tablet single page: min(stageWidth, 44rem)
 * - desktop single page: min(stageWidth minus 2x48px, 44rem)
 */
export function getPageAreaDimensions(
  stageWidth,
  stageHeight,
  isShortLandscape = false,
  isTwoPage = false,
  margins = 'normal'
) {
  const remInPx =
    typeof document !== 'undefined'
      ? parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
      : 16;
  const max44rem = 44 * remInPx; // 704px at 16px base font

  let pageWidth;
  if (stageWidth < 768) {
    // phone < 768px: stage width minus 2x16px
    const phonePadding = margins === 'narrow' ? 16 : margins === 'wide' ? 48 : 32;
    pageWidth = Math.max(0, stageWidth - phonePadding);
  } else if (stageWidth < 1024) {
    // tablet 768-1023px: min(stage, 44rem)
    const tabletMax = margins === 'narrow' ? max44rem + 48 : margins === 'wide' ? max44rem - 48 : max44rem;
    pageWidth = Math.min(stageWidth, tabletMax);
  } else if (isTwoPage) {
    // desktop two facing pages: at most 1200px wide
    const twoPageMax = margins === 'narrow' ? 1280 : margins === 'wide' ? 1080 : 1200;
    pageWidth = Math.min(stageWidth - 96, twoPageMax);
  } else {
    // desktop single page: min(stage minus 2x48px, 44rem)
    const desktopMax = margins === 'narrow' ? max44rem + 48 : margins === 'wide' ? max44rem - 48 : max44rem;
    pageWidth = Math.min(stageWidth - 96, desktopMax);
  }

  pageWidth = Math.floor(pageWidth);

  const topOffset = isShortLandscape ? 44 : 80;
  const bottomOffset = isShortLandscape ? 52 : 112;
  const pageHeight = Math.max(100, Math.floor(stageHeight - topOffset - bottomOffset));

  return { pageWidth, pageHeight, topOffset, bottomOffset };
}
