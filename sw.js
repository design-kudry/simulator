/* Simple offline-first cache to speed up repeat loads */
const CACHE_NAME = 'simulator-cache-v1';
const PRECACHE_URLS = [
  'index.html',
  'styles.css',
  'game.min.js', // ignoreSearch will serve versioned query variants
  'assets/background-home.webp',
  'assets/girl-default.webp'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // pass-through non-GET

  const url = new URL(req.url);

  // Only handle same-origin assets and app shell
  const isSameOrigin = url.origin === self.location.origin;
  const isAsset = /\.(?:png|webp|jpg|jpeg|gif|svg|css|js|woff2?)$/i.test(url.pathname) ||
                  url.pathname.includes('/assets/');
  const isHTML = req.mode === 'navigate' || url.pathname.endsWith('.html');

  if (!(isSameOrigin && (isAsset || isHTML))) return; // default network

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Try cache first, ignoring query string (v= cache-bust)
    const cached = await cache.match(req, { ignoreSearch: true });
    const networkPromise = fetch(req).then((resp) => {
      if (resp && resp.ok) {
        cache.put(req, resp.clone());
      }
      return resp;
    }).catch(() => undefined);

    // Serve cached immediately if available, else wait for network
    return cached || networkPromise || new Response('Offline', { status: 503 });
  })());
});
