const CACHE_NAME = 'spotify-offline-v3';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Instalación: precache del shell de la aplicación
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activación: limpieza de cachés antiguas
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

// Interceptor de peticiones de red para modo 100% Offline
self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // 1. Los archivos de audio físico se gestionan exclusivamente en IndexedDB (SpotifyOfflineAudioDB)
  if (
    url.includes('.m4a') ||
    url.includes('.mp3') ||
    url.includes('.ogg') ||
    url.includes('.aac') ||
    url.includes('audio-ssl.itunes.apple.com') ||
    url.includes('blob:')
  ) {
    return;
  }

  // 2. Rutas de navegación (cargar la app incluso sin conexión / modo avión)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html') || caches.match('./'))
    );
    return;
  }

  // 3. Recursos estáticos (JS compilado, CSS, Fuentes, Iconos)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // En segundo plano revalidar si hay conexión
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      // Si no estaba en caché, pedir a la red y guardar en caché para la próxima vez
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          return networkResponse;
        })
        .catch(() => {
          // Si falló por falta de red y es un documento, devolver index.html
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
