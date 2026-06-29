/* eslint-disable no-restricted-globals */

const CACHE_VERSION = 'super-admin-v2';
const CACHE_NAME = `super-admin-${CACHE_VERSION}`;

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

  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cloned = fresh.clone();
          const cache = await caches.open(CACHE_NAME);
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
        return cached;
      }
    })
  );
});


