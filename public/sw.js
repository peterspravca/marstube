self.addEventListener('install', (event) => {
  console.log('Service worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // PWA requires a fetch handler to show the install prompt.
  // We'll just pass through the requests.
  event.respondWith(fetch(event.request));
});
