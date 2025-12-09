// GuardiaVault Service Worker (improved, more robust)

// IMPORTANT: Ensure this file is emitted to the BUILD ROOT as /serviceWorker.js
// e.g. your Vite plugin must emit fileName: "serviceWorker.js"

// Cache/version settings
const CACHE_PREFIX = 'guardiavault-';
const CACHE_VERSION = 'v4'; // Incremented to force cache invalidation
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;

// Static assets to cache on install (adjust as needed)
// Include manifest.json for PWA installability
const STATIC_ASSETS = ['/', '/offline.html', '/manifest.json'];

// Timeouts
const DEFAULT_NETWORK_TIMEOUT_MS = 10000;

// Helpers -------------------------------------------------------------

/** Timeout wrapper using AbortController for broader compatibility */
function fetchWithTimeout(request, timeoutMs = DEFAULT_NETWORK_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(request, { signal: controller.signal })
    .finally(() => clearTimeout(id));
}

/** Open cache safely */
async function openCache(name = CACHE_NAME) {
  return caches.open(name);
}

/** Put response in cache if valid */
async function maybeCacheResponse(cache, request, response) {
  try {
    if (!response || response.type === 'error') return;
    if (response.status && response.status >= 200 && response.status < 300) {
      // clone and put - ignore any failure silently
      cache.put(request, response.clone()).catch(() => {});
    }
  } catch (e) {
    // swallow - caching is best-effort
  }
}

// Strategies ----------------------------------------------------------

async function cacheFirst(request, cacheName = CACHE_NAME) {
  const cache = await openCache(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    await maybeCacheResponse(cache, request, response);
    return response;
  } catch (err) {
    // if no network and no cached result -> fallback
    return cached || new Response('Network error', { status: 408 });
  }
}

async function networkFirst(request, cacheName = CACHE_NAME, timeoutMs = DEFAULT_NETWORK_TIMEOUT_MS) {
  const cache = await openCache(cacheName);
  try {
    const networkResponse = await fetchWithTimeout(request, timeoutMs);
    await maybeCacheResponse(cache, request, networkResponse);
    return networkResponse;
  } catch (err) {
    // network failed or timed out -> try cache
    const cached = await cache.match(request);
    if (cached) return cached;
    // if navigation, return offline page if present
    if (request.mode === 'navigate' || (request.headers && request.headers.get('accept')?.includes('text/html'))) {
      const offline = await caches.match('/offline.html');
      return offline || new Response('Offline', { status: 503, statusText: 'Offline' });
    }
    return new Response('Network error', { status: 408 });
  }
}

async function staleWhileRevalidate(request, cacheName = CACHE_NAME) {
  const cache = await openCache(cacheName);
  const cached = await cache.match(request);

  // Kick off background fetch but return cached immediately if present
  const fetchAndCache = fetch(request)
    .then((response) => {
      maybeCacheResponse(cache, request, response);
      return response;
    })
    .catch(() => {
      // ignore background fetch failures
    });

  return cached || fetchAndCache;
}

// Lifecycle events ---------------------------------------------------

self.addEventListener('install', (event) => {
  console.log('[SW] install', CACHE_NAME);
  self.skipWaiting(); // take over waiting lifecycle

  event.waitUntil(
    (async () => {
      const cache = await openCache(CACHE_NAME);
      try {
        await cache.addAll(STATIC_ASSETS);
        console.log('[SW] static assets cached');
      } catch (err) {
        // best-effort caching — don't fail install for missing files
        console.warn('[SW] cache.addAll failed (best-effort):', err);
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] activate', CACHE_NAME);

  event.waitUntil(
    (async () => {
      // delete old caches with same prefix but different version
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map((k) => {
            console.log('[SW] deleting old cache', k);
            return caches.delete(k);
          })
      );
      
      // Also clear the 'pages' cache to force fresh HTML fetch
      // This ensures users get the latest HTML with correct asset references
      try {
        await caches.delete('pages');
        console.log('[SW] cleared pages cache to force fresh HTML');
      } catch (e) {
        // Ignore if pages cache doesn't exist
      }

      // take control of uncontrolled clients ASAP
      await self.clients.claim();

      // notify clients about SW update/version
      const clients = await self.clients.matchAll();
      clients.forEach((client) => {
        try {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        } catch (e) {
          // ignore if postMessage fails
        }
      });
    })()
  );
});

// Fetch handler -----------------------------------------------------

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET same-origin requests here as we expect
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return; // malformed URL (shouldn't happen)
  }

  // Only handle same-origin requests in this handler
  if (url.origin !== self.location.origin) {
    // Still allow special-cased origins (fonts) handled below
    // but reject any other cross-origin unless explicitly supported.
  }

  // Skip dev/build/internal assets patterns that shouldn't be cached
  // Also skip requests with cache-busting params - let browser handle directly
  if (
    url.pathname.includes('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.includes('/socket.io/') ||
    url.pathname.startsWith('/api/') ||
    url.search.includes('t=') || // cache-busting query param
    url.search.includes('_t=') // OAuth cache-busting param
  ) {
    return; // Let browser handle directly, bypass service worker
  }

  // Google Fonts (cross-origin special cases)
  if (url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(cacheFirst(request, 'google-fonts-webfonts'));
    return;
  }
  if (url.origin === 'https://fonts.googleapis.com') {
    event.respondWith(staleWhileRevalidate(request, 'google-fonts-stylesheets'));
    return;
  }

  // Files by extension
  const pathname = url.pathname;

  if (/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i.test(pathname)) {
    event.respondWith(staleWhileRevalidate(request, 'static-font-assets'));
    return;
  }

  if (/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i.test(pathname)) {
    event.respondWith(staleWhileRevalidate(request, 'static-image-assets'));
    return;
  }

  // Audio/video: we rely on network and let server support range responses.
  if (/\.(?:mp3|wav|ogg|mp4)$/i.test(pathname)) {
    // NOTE: Proper Range handling is complex. Prefer server-side partial response support.
    event.respondWith(cacheFirst(request, 'static-media-assets'));
    return;
  }

  if (/\.(?:js|mjs)$/i.test(pathname)) {
    event.respondWith(staleWhileRevalidate(request, 'static-js-assets'));
    return;
  }

  if (/\.(?:css|less)$/i.test(pathname)) {
    event.respondWith(staleWhileRevalidate(request, 'static-style-assets'));
    return;
  }

  if (/\.(?:json|xml|csv)$/i.test(pathname)) {
    event.respondWith(networkFirst(request, 'static-data-assets', DEFAULT_NETWORK_TIMEOUT_MS));
    return;
  }

  // Navigation and HTML pages -> networkFirst with offline fallback
  // IMPORTANT: HTML should always fetch fresh to get latest asset references
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    // Use network-only for HTML with cache: 'no-store' to prevent serving stale HTML
    // This ensures we always get the latest HTML with correct asset references
    event.respondWith(
      fetch(request, {
        cache: 'no-store', // Bypass HTTP cache completely
        headers: {
          'Cache-Control': 'no-cache',
        },
      })
        .then((response) => {
          // Only cache if successful, but don't serve from cache for HTML
          if (response.ok) {
            const cache = caches.open('pages');
            cache.then((c) => c.put(request, response.clone())).catch(() => {});
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network completely fails
          // But log a warning since this might serve stale HTML
          console.warn('[SW] Network failed for HTML, falling back to cache (may be stale)');
          return caches.match(request).then((cached) => {
            if (cached) {
              console.warn('[SW] Serving cached HTML - may have stale asset references');
              return cached;
            }
            // Last resort: try offline page
            return caches.match('/offline.html').then((offline) => {
              return offline || new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
            });
          });
        })
    );
    return;
  }

  // Default fallback for same-origin other requests
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request, 'others', DEFAULT_NETWORK_TIMEOUT_MS));
    return;
  }

  // If we reach here, let the browser handle the request (cross-origin without special handling)
});

// Push notifications -----------------------------------------------

self.addEventListener('push', (event) => {
  console.log('[SW] push received');
  let notificationData = {
    title: 'GuardiaVault',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'guardiavault-notification',
    requireInteraction: false,
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = { ...notificationData, ...data };
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      requireInteraction: notificationData.requireInteraction,
      data: notificationData.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        // focus the first client we find (or match route)
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// Background sync ---------------------------------------------------

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-yield-data') {
    event.waitUntil(
      (async () => {
        try {
          const res = await fetch('/api/yield/positions');
          const data = await res.json();
          const clientsList = await self.clients.matchAll();
          clientsList.forEach((client) =>
            client.postMessage({ type: 'YIELD_DATA_SYNCED', data })
          );
        } catch (err) {
          console.error('[SW] background sync failed', err);
        }
      })()
    );
  }
});

// Message handling --------------------------------------------------

self.addEventListener('message', (event) => {
  if (!event.data) return;
  const { type } = event.data;

  if (type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (type === 'CLEAR_CACHE') {
    // return success if a MessagePort exists
    caches.delete(CACHE_NAME).then((ok) => {
      try {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: ok });
        } else {
          // fallback broadcast
          self.clients.matchAll().then((clients) => {
            clients.forEach((c) => {
              c.postMessage({ type: 'CACHE_CLEARED', success: ok });
            });
          });
        }
      } catch (e) {
        console.warn('[SW] CLEAR_CACHE response failed', e);
      }
    });
  }
});
