// ============================================================
// PHOTOGRAM (photogramweb.online) - PWA SERVICE WORKER
// Fully Compliant with PWABuilder Offline & Service Worker Standards
// ============================================================

const CACHE_NAME = 'photogram-pwa-v2';
const OFFLINE_URL = '/offline.html';

// Assets cached on install to guarantee offline support for PWABuilder
const PRECACHE_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

// 1. INSTALL EVENT
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[Photogram SW] Install precache warning:', err);
        return self.skipWaiting();
      })
  );
});

// 2. ACTIVATE EVENT
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

// 3. FETCH EVENT - PWABuilder Offline Logic & Live Data Safety
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Handle only GET HTTP/HTTPS requests
  if (request.method !== 'GET' || !request.url.startsWith('http')) {
    return;
  }

  const url = new URL(request.url);

  // CRITICAL: Never intercept or cache Supabase, Auth, API, or Cloudinary uploads
  // Keeps all real-time posts, DMs, likes, comments, and sessions live!
  if (
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('cloudinary.com') ||
    url.pathname.startsWith('/api/') ||
    request.headers.get('upgrade') === 'websocket'
  ) {
    return;
  }

  // A. Navigation requests (HTML pages) -> Network-First with Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.open(CACHE_NAME).then((cache) => {
          return cache.match(OFFLINE_URL);
        });
      })
    );
    return;
  }

  // B. Next.js hashed static chunks (_next/static/*) -> Cache-First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // C. Other assets (images, fonts, styles) -> Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. MESSAGE EVENT
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
