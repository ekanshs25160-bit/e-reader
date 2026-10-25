export const ROUTES = {
  HOME: '/',
  LIBRARY: '/library',
  BROWSE: '/browse',
  VOCABULARY: '/vocabulary',
  STATS: '/stats',
  SETTINGS: '/settings',
  BOOK: (id) => `/book/${id}`,
  READER: (id) => `/reader/${id}`,
};

export default ROUTES;
