// DHOTI AALE Service Worker
//
// Automatic PWA updates + safe caching.
//
// Rules:
// - HTML/navigation is never permanently cached.
// - API requests are never intercepted.
// - Next.js hashed static assets are cached.
// - Service Worker activates automatically.
// - Old caches are deleted.
// - Installed PWA checks for the latest deployment.
// - No dependency on manifest.webmanifest.

const CACHE_NAME = 'dhoti-aale-pwa-v4';

/*
 * INSTALL
 *
 * Do NOT precache files that may not exist.
 * The app itself is always fetched from the network.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.resolve().then(() => {
      console.log('[DHOTI AALE SW] Installed:', CACHE_NAME);
    })
  );

  // Activate the newest worker immediately.
  self.skipWaiting();
});

/*
 * ACTIVATE
 *
 * Delete every old DHOTI AALE cache.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }

            return Promise.resolve(false);
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

/*
 * MESSAGE
 *
 * Compatibility with usePWA.ts.
 */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/*
 * FETCH
 */
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Only handle GET requests.
  if (
    request.method !== 'GET' ||
    !request.url.startsWith('http')
  ) {
    return;
  }

  const url = new URL(request.url);

  /*
   * API REQUESTS
   *
   * Never intercept or cache APIs.
   *
   * This keeps:
   * - battles
   * - votes
   * - comments
   * - World Chat
   * - presence
   * - authentication
   * - admin data
   * - AI data
   *
   * connected to the live server/database.
   */
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  /*
   * HTML / NAVIGATION
   *
   * ALWAYS fetch the latest deployed page.
   *
   * This is the most important part for preventing
   * an installed PWA from showing an old website.
   */
  if (
    request.mode === 'navigate' ||
    request.destination === 'document'
  ) {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
      }).catch(() => {
        return new Response(
          `<!doctype html>
<html lang="hi">
<head>
  <meta charset="utf-8">
  <meta
    name="viewport"
    content="width=device-width,initial-scale=1"
  >
  <title>DHOTI AALE</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
      box-sizing: border-box;
      font-family: system-ui, sans-serif;
      background: #faf7f2;
      color: #292524;
      text-align: center;
    }

    .box {
      max-width: 420px;
    }

    h2 {
      margin-bottom: 12px;
    }

    p {
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="box">
    <h2>DHOTI AALE</h2>
    <p>
      आप अभी ऑफ़लाइन हैं। इंटरनेट कनेक्शन आते ही
      ऐप को दोबारा खोलें।
    </p>
  </div>
</body>
</html>`,
          {
            status: 503,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          }
        );
      })
    );

    return;
  }

  /*
   * NEXT.JS HASHED STATIC ASSETS
   *
   * These files contain hashes in their filenames,
   * so caching them is safe.
   */
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          if (
            response &&
            response.status === 200 &&
            response.type === 'basic'
          ) {
            const responseClone = response.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) => {
                return cache.put(request, responseClone);
              })
              .catch(() => {});
          }

          return response;
        });
      })
    );

    return;
  }

  /*
   * SERVICE WORKER ITSELF
   *
   * Always get the newest version.
   */
  if (url.pathname === '/sw.js') {
    event.respondWith(
      fetch(request, {
        cache: 'no-store',
      })
    );

    return;
  }

  /*
   * OTHER PUBLIC ASSETS
   *
   * Network first.
   *
   * Online:
   *   latest server version.
   *
   * Offline:
   *   cached version if available.
   */
  event.respondWith(
    fetch(request, {
      cache: 'no-store',
    })
      .then((response) => {
        if (
          response &&
          response.status === 200 &&
          response.type === 'basic'
        ) {
          const responseClone = response.clone();

          caches
            .open(CACHE_NAME)
            .then((cache) => {
              return cache.put(request, responseClone);
            })
            .catch(() => {});
        }

        return response;
      })
      .catch(() => caches.match(request))
  );
});