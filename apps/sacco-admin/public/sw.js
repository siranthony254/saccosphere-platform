/* eslint-disable no-restricted-globals */

// NOTE:
// - This SW is intentionally simple (no Workbox) but provides a real offline app shell.
// - After building, the Vite outputs live under /assets/*, so we must precache them.
// - This file is used at runtime from the Vite build (copy to /sw.js).

const CACHE_VERSION = 'sacco-admin-v2';
const CACHE_NAME = `sacco-admin-${CACHE_VERSION}`;

// The app shell must include the built entry and all static assets.
// We precache known Vite entry points; additional assets are runtime-cached.
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];


self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      // Try to precache; ignore failures (e.g., missing dev-only URLs).
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            await cache.add(url);
          } catch {
            // ignore
          }
        })
      );

      self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return undefined;
        })
      );

      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Navigation requests (deep links): serve the shell when offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cloned = fresh.clone();
          const cache = await caches.open(CACHE_NAME);
          // Cache the latest shell response for next offline load.
          await cache.put('/index.html', cloned).catch(() => undefined);
          return fresh;
        } catch {
          const cachedShell = await caches.match('/index.html');
          if (cachedShell) return cachedShell;
          return caches.match('/');
        }
      })()
    );
    return;
  }

  // For other assets: cache-first then network.
  event.respondWith(
    caches.match(req).then(async (cached) => {
      if (cached) return cached;

      try {
        const res = await fetch(req);
        const cloned = res.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, cloned).catch(() => undefined);
        return res;
      } catch {
        // If it was an asset request and we can't fetch, just fail.
        return cached;
      }
    })
  );
});


