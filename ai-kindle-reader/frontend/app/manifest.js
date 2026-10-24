export default function manifest() {
  return {
    name: 'Flyleaf Reader',
    short_name: 'Flyleaf',
    description: 'An atmospheric, AI-enhanced digital reading sanctuary.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#FBF9F4',
    theme_color: '#7A4F2B',
    categories: ['books'],
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
