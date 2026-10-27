const CACHE_NAME = 'spotify-custom-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar llamadas de streaming o APIs directas externas
  if (
    event.request.url.includes('api.spotify.com') ||
    event.request.url.includes('spclient.wg.spotify.com') ||
    event.request.url.includes('accounts.spotify.com') ||
    event.request.url.includes('.mp3') ||
    event.request.url.includes('.ogg')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request).catch(() => caches.match('./index.html'))
      );
    })
  );
});
