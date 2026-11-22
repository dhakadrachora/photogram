// ============================================================
// PHOTOGRAM (photogramweb.online) - PRODUCTION SERVICE WORKER
// ============================================================

const CACHE_NAME = 'photogram-pwa-v1';

// Static assets to precache for offline shell
const PRECACHE_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
];

// Install: precache essential shell assets and skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[Photogram SW] Precache notice:', err);
        return self.skipWaiting();
      })
  );
});

// Activate: clean up old versions of cache and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            if (name !== CACHE_NAME) {
              return caches.delete(name);
            }
            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Stale-While-Revalidate for static assets, Network-First for API/Supabase/HTML
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // Never intercept or cache Supabase API, Cloudinary uploads, Auth endpoints, or WebSocket upgrades
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('cloudinary.com') ||
    url.pathname.startsWith('/api/') ||
    request.headers.get('upgrade') === 'websocket'
  ) {
    return;
  }

  // Next.js hashed static assets (_next/static/*) -> Cache First with Network Fallback
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // HTML Navigation -> Network First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/') || caches.match(request);
      })
    );
    return;
  }

  // Other assets (images, icons, styles) -> Stale While Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Message listener for skipWaiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
