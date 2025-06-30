// public/service-worker.js

const cacheName = 'my-pwa-cache-v1';
const filesToCache = [
  '/',
  '/index.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      console.log('Service Worker: Caching Files');
      return cache.addAll(filesToCache);
    })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((thisCacheName) => {
          if (thisCacheName !== cacheName) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(thisCacheName);
          }
        })
      );
    })
  );
});

// Fetch files from cache or network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached file or fetch from network
      return response || fetch(event.request);
    })
  );
});
