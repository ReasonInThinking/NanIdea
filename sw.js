const CACHE_NAME = 'pulse-notes-v1';
const ASSETS = [
  '/NanIdea/',
  '/NanIdea/index.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // ЗАЩИТА МИКРОФОНА: Пропускаем Speech API мимо кэша, чтобы он не ломался на мобильных
  if (e.request.url.includes('speech') || e.request.url.includes('google.com') || e.request.url.startsWith('blob:')) {
    return; 
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(e.request).catch(() => {
        if (e.request.mode === 'navigate') {
          return caches.match('/NanIdea/index.html');
        }
      });
    })
  );
});
