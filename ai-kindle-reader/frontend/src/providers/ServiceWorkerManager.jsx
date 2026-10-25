'use client';

import { useEffect } from 'react';
import { useTheme } from './ThemeContext';

export function ServiceWorkerManager() {
  const { showToast } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // In development mode, unregister active service workers to prevent stale Next.js chunks
    if (process.env.NODE_ENV !== 'production') {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister();
        }
      });
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            newWorker?.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                showToast?.('Update available. Refresh to apply.');
              }
            });
          });
        })
        .catch((err) => {
          console.warn('[SW] Registration failed:', err);
        });
    });
  }, [showToast]);

  return null;
}

export default ServiceWorkerManager;
