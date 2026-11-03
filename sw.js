const CACHE_NAME = 'pulse-notes-v2';
const ASSETS = [
  '/NanIdea/',
  '/NanIdea/index.html',
  '/NanIdea/ink.png' // КРИТИЧЕСКИ ВАЖНО: Добавили иконку из манифеста в кэш
];

// Установка: скачиваем все ресурсы в память устройства
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Перебираем массив и жестко кэшируем
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Активация: безопасно удаляем старые версии кэша
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

// Перехват запросов
self.addEventListener('fetch', (e) => {
  // ЗАЩИТА МИКРОФОНА: Голосовые потоки и сервера Google пускаем напрямую в обход кэша
  if (e.request.url.includes('speech') || e.request.url.includes('google.com') || e.request.url.startsWith('blob:')) {
    return; 
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Если файл есть в кэше — отдаем его мгновенно (даже оффлайн)
      if (cachedResponse) return cachedResponse;
      
      // Если файла нет в кэше — пытаемся скачать из сети
      return fetch(e.request).catch((err) => {
        // Оффлайн-страховка: если сети нет, а пользователь обновляет вкладку — отдаем главную страницу
        if (e.request.mode === 'navigate') {
          return caches.match('/NanIdea/index.html');
        }
        // Возвращаем пустой ответ для картинок/скриптов, чтобы воркер не падал в краш
        return new Response('', { status: 404, statusText: 'Offline' });
      });
    })
  );
});
