// GreenWave Service Worker for Offline Static Shell & Push Notifications
const CACHE_NAME = 'greenwave-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never cache API calls or sensitive customer data
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Network first, fallback to cached shell
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

// Push notification event listener
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.message || 'New update from GreenWave',
      icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2316A34A'><path d='M12 2a10 10 0 0 0-8.66 15L2 22l5.17-1.32A10 10 0 1 0 12 2zm.05 17.5a7.5 7.5 0 0 1-3.83-1.05l-.27-.16-2.85.73.76-2.78-.18-.28A7.5 7.5 0 1 1 12.05 19.5z'/></svg>",
      badge: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2316A34A'><path d='M12 2a10 10 0 0 0-8.66 15L2 22l5.17-1.32A10 10 0 1 0 12 2zm.05 17.5a7.5 7.5 0 0 1-3.83-1.05l-.27-.16-2.85.73.76-2.78-.18-.28A7.5 7.5 0 1 1 12.05 19.5z'/></svg>",
      data: {
        url: data.link || '/',
      },
    };

    event.waitUntil(self.registration.showNotification(data.title || 'GreenWave Alert', options));
  } catch (err) {
    console.error('Push handling error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
