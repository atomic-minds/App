// Atomic Minds — service worker
// Deliberately conservative while this app is still under active
// development: the app shell itself (index.html / any navigation) is
// ALWAYS fetched fresh from the network when online — never served from
// cache — so a new deployment is visible on the very next reload, with
// zero stale-content risk. Only truly static assets that almost never
// change (the manifest and icons) are cached, purely for a bit of offline
// resilience. Firebase, Firestore's realtime channel, Google Drive,
// YouTube, and MathJax's CDN are never touched by this file at all.

const CACHE_NAME = 'atomic-minds-v5'; // bumped to match this file's own versioning convention
const STATIC_ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(
        // PHASE H FIX: cache.addAll() is all-or-nothing — if even ONE of
        // these URLs 404s or fails to fetch, the whole install event
        // rejects, and a service worker that fails to install is
        // discarded entirely (never reaches "active"). That would make
        // navigator.serviceWorker.ready — which Phase H's notification
        // display now depends on — hang forever with no active worker to
        // resolve to. Caching each asset independently means one missing
        // icon can no longer block the whole worker from installing.
        STATIC_ASSETS.map((url) => cache.add(url).catch((err) => {
          console.warn('[SW] could not cache', url, err);
        }))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) // wipe every old cache, no exceptions
      .then(() => caches.open(CACHE_NAME))
      .then((cache) => Promise.all( // same per-asset tolerance as install, see comment there
        STATIC_ASSETS.map((url) => cache.add(url).catch((err) => {
          console.warn('[SW] could not cache', url, err);
        }))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // never intercept Firebase/Drive/YouTube/MathJax

  const isAppShell = req.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname.endsWith('/');

  if (isAppShell) {
    // Network-only for the app itself. No cache fallback except a plain
    // "you're offline" notice if there's truly no connection.
    event.respondWith(
      fetch(req).catch(() => new Response(
        '<!DOCTYPE html><meta charset="utf-8"><body style="font-family:sans-serif;background:#12081c;color:#f3f0fa;padding:40px;text-align:center">You\u2019re offline. Reconnect and reload.</body>',
        { headers: { 'Content-Type': 'text/html' } }
      ))
    );
    return;
  }

  // Everything else same-origin (icons, manifest): cache-first is fine.
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.status === 200) {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
      }
      return res;
    }))
  );
});
