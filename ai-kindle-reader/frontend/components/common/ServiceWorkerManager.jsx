'use client';

import { useEffect } from 'react';
import { useTheme } from '@/components/common/ThemeProvider';

export default function ServiceWorkerManager() {
  const { showToast } = useTheme();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .catch((err) => {
            console.warn('[SW] Registration failed:', err);
          });
      });
    }

    const handleOffline = () => {
      showToast('You are offline. Reading from local vault.');
    };

    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('offline', handleOffline);
    };
  }, [showToast]);

  return null;
}
