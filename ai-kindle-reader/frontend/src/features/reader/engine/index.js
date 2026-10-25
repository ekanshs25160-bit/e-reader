export { getPageAreaDimensions } from './layout';
export {
  THEME_PALETTES,
  getFontStack,
  applyThemeToRendition,
} from './themes';
export {
  injectWebFonts,
  enforceNeighborContainment,
  registerRenderHooks,
  createEpubContainerObserver,
} from './create-rendition';
export { setupReaderGestures } from './gestures';
export { getSelectionDetails, clearSelection } from './selection';
export { getChapterText, computeLocationProgress } from './locations';
