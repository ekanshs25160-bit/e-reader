/* Service Worker for Flyleaf Reader */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.1.0/workbox-sw.js');

const PRECACHE_SHELL = [
  '/',
  '/library',
  '/browse',
  '/vocabulary',
  '/stats',
  '/settings',
  '/favicon.ico',
  '/favicon.svg',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('flyleaf-app-shell-v1').then((cache) => {
      return cache.addAll(PRECACHE_SHELL).catch((err) => {
        console.warn('[SW] Precache partial warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

if (typeof workbox !== 'undefined' && workbox) {
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // EXPLICIT REQUIREMENT: Do not cache /api/ai
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/ai'),
    new workbox.strategies.NetworkOnly()
  );

  // 1. Font Caching (Google Fonts, jsDelivr OpenDyslexic, Fontsource)
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com' ||
      url.origin === 'https://cdn.jsdelivr.net' ||
      /\.(?:woff|woff2|ttf|otf|eot)$/i.test(url.pathname),
    new workbox.strategies.CacheFirst({
      cacheName: 'flyleaf-fonts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 60,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 2. Book covers & Image caching (Gutenberg covers, local icons, images)
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'image' ||
      url.pathname.includes('/cache/epub/') ||
      /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/i.test(url.pathname),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'flyleaf-covers-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 150,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // 3. Next.js Static Assets & Chunks
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/_next/static/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'flyleaf-static-assets',
    })
  );

  // 4. App Shell Navigation Routes (NetworkFirst with precached fallback)
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.mode === 'navigate' && !url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'flyleaf-app-shell-v1',
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 40,
        }),
      ],
    })
  );
} else {
  // Fallback offline handler
  self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);
    if (url.pathname.startsWith('/api/ai')) {
      return; // Never cache /api/ai
    }
    if (event.request.method !== 'GET') return;

    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const clone = response.clone();
              caches.open('flyleaf-runtime-v1').then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return response;
          })
        );
      })
    );
  });
}
