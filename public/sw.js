const CACHE_NAME = 'unihub-cache-v3';
const ASSETS = [
  '/favicon_io/favicon.ico',
  '/favicon_io/android-chrome-192x192.png',
  '/favicon_io/android-chrome-512x512.png'
];
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => {
      if (k !== CACHE_NAME) return caches.delete(k);
    })))
  );
});
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Only handle GET requests
  if (req.method !== 'GET') {
    return;
  }

  const dest = req.destination;

  // Never cache HTML documents to avoid stale landing page/content
  if (dest === 'document' || (req.headers && req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Push Notification Listeners
self.addEventListener('push', function(event) {
  if (event.data) {
    let data;
    try {
      data = JSON.parse(event.data.text());
    } catch (e) {
      data = { title: 'New Notification', body: event.data.text(), url: '/' };
    }

    const options = {
      body: data.body,
      icon: '/favicon_io/android-chrome-192x192.png',
      badge: '/favicon_io/favicon-32x32.png',
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
