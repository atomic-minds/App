// Atomic Minds — service worker
// Deliberately conservative while this app is still under active
// development: the app shell itself (index.html / any navigation) is
// ALWAYS fetched fresh from the network when online — never served from
// cache — so a new deployment is visible on the very next reload, with
// zero stale-content risk. Only truly static assets that almost never
// change (the manifest and icons) are cached, purely for a bit of offline
// resilience. Firebase, Firestore's realtime channel, Google Drive,
// YouTube, and MathJax's CDN are never touched by this file at all.

const CACHE_NAME = 'atomic-minds-v2'; // bumped — forces old caches to be wiped below
const STATIC_ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k)))) // wipe every old cache, no exceptions
      .then(() => caches.open(CACHE_NAME))
      .then((cache) => cache.addAll(STATIC_ASSETS))
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
