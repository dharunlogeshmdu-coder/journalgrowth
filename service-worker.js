/* Dharun Records — Trading Journal service worker
   Handles offline caching so the "installed" app opens even without a
   network connection, and keeps itself up to date automatically. */

// Bump this string on every deploy (v1 -> v2 -> v3 ...). Changing it is what
// makes the browser treat this as a NEW service worker and fetch fresh files
// instead of reusing whatever was cached before.
const CACHE_NAME = 'dharun-records-v3';

// Add/adjust paths here to match your actual deployed file names.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-16.png',
  './icons/icon-32.png',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install: pre-cache the app shell.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old cache versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Let the page force this worker to activate immediately instead of
// waiting for all tabs to close (used by install-app.js's update flow).
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch: network-first for navigation (so you always get the latest
// journal build when online), cache-first fallback for everything else
// (and for offline navigation).
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      // { cache: 'no-store' } bypasses the BROWSER's own HTTP cache, not just
      // this service worker's cache — without it, GitHub Pages' cache headers
      // can make fetch() silently return a stale copy even in "network-first" mode.
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }).catch(() => cached);
    })
  );
});
