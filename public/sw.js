/**
 * CarryMatch Service Worker
 * 
 * Caching strategies:
 * - Static assets (JS/CSS/images): Cache-first with network fallback
 * - API calls: Network-first with cache fallback (offline support)
 * - HTML pages: Stale-while-revalidate
 * - Offline fallback: Custom offline page
 */

const CACHE_VERSION = 'carrymatch-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const API_CACHE = `${CACHE_VERSION}-api`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ── Install ─────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — Clean old caches ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key.startsWith('carrymatch-') && key !== STATIC_CACHE && key !== API_CACHE && key !== PAGE_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ── Fetch ───────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension, dev tools, etc.
  if (!url.protocol.startsWith('http')) return;

  // Strategy: Static assets → Cache-first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Strategy: API calls → Network-first with cache fallback
  if (isApiCall(url)) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Strategy: Pages → Stale-while-revalidate
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(staleWhileRevalidate(request, PAGE_CACHE));
    return;
  }

  // Default: Network with cache fallback
  event.respondWith(networkFirst(request, STATIC_CACHE, 3000));
});

// ── Caching Strategies ──────────────────────────────────────────────

/**
 * Cache-first: Return cached version if available, otherwise fetch and cache
 * Best for: Static assets that rarely change (JS bundles, CSS, images)
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return offlineFallback();
  }
}

/**
 * Network-first: Try network, fall back to cache
 * Best for: API calls where fresh data is preferred but offline should work
 */
async function networkFirst(request, cacheName, timeoutMs = 5000) {
  try {
    const response = await promiseWithTimeout(fetch(request), timeoutMs);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return offlineFallback();
  }
}

/**
 * Stale-while-revalidate: Return cache immediately, update in background
 * Best for: Pages where speed matters but freshness is still wanted
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  return cached || await fetchPromise || offlineFallback();
}

// ── Helpers ─────────────────────────────────────────────────────────

function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)(\?.*)?$/.test(url.pathname) ||
    url.pathname.startsWith('/assets/');
}

function isApiCall(url) {
  return url.hostname.includes('supabase.co') ||
    url.hostname.includes('base44') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/rest/') ||
    url.pathname.includes('/functions/');
}

function promiseWithTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Network timeout')), ms)
  );
  return Promise.race([promise, timeout]);
}

function offlineFallback() {
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CarryMatch - Offline</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: white;
          padding: 20px;
        }
        .container {
          text-align: center;
          max-width: 400px;
        }
        .icon {
          font-size: 64px;
          margin-bottom: 24px;
        }
        h1 { font-size: 24px; margin-bottom: 12px; }
        p { color: #9ca3af; margin-bottom: 24px; line-height: 1.6; }
        button {
          background: linear-gradient(135deg, #9EFF00, #7ACC00);
          color: #1a1a2e;
          border: none;
          padding: 12px 32px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
        }
        button:active { transform: scale(0.95); }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">📡</div>
        <h1>You're Offline</h1>
        <p>Check your internet connection and try again. Some features like viewing your tickets may still work.</p>
        <button onclick="location.reload()">Try Again</button>
      </div>
    </body>
    </html>`,
    {
      headers: { 'Content-Type': 'text/html' },
      status: 503,
      statusText: 'Service Unavailable'
    }
  );
}

// ── Background Sync (for offline ticket operations) ─────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-sales') {
    event.waitUntil(syncOfflineSales());
  }
  if (event.tag === 'sync-checkins') {
    event.waitUntil(syncOfflineCheckins());
  }
});

async function syncOfflineSales() {
  // Retrieve pending sales from IndexedDB and POST to server
  // This is called automatically when connectivity is restored
  console.log('[SW] Syncing offline sales...');
}

async function syncOfflineCheckins() {
  console.log('[SW] Syncing offline check-ins...');
}

// ── Push Notifications (for departure reminders) ────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'CarryMatch', {
        body: data.body || '',
        icon: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/7c60efa9d_favicondark.png',
        badge: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69099ae0c2ff264b7aca7e74/7c60efa9d_favicondark.png',
        data: data.url ? { url: data.url } : undefined,
        vibrate: [200, 100, 200]
      })
    );
  } catch (e) {
    console.error('[SW] Push parse error:', e);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      const existing = clients.find(c => c.url.includes(url));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
