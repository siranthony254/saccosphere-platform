/* eslint-disable no-restricted-globals */
const CACHE_VERSION = 'sacco-admin-v1';
const CACHE_NAME = `sacco-admin-${CACHE_VERSION}`;

const CORE_ASSETS = [
  '/',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch(() => undefined);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
          return undefined;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;

      return fetch(req)
        .then((res) => {
          const cloned = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, cloned).catch(() => undefined);
          });
          return res;
        })
        .catch(() => {
          // Fallback to root for navigation requests
          if (req.mode === 'navigate') return caches.match('/');
          return undefined;
        });
    })
  );
});

