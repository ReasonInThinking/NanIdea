const CACHE_NAME = 'pulse-notes-v2';
const ASSETS = [
  './',              // Кэширует главную страницу (корневой запрос)
  './index.html',    // Кэширует сам файл страницы
  './ink.png'      // Кэширует картинку (замените на имя вашей иконки, если нужно)
];


// Установка: скачиваем все ресурсы
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Используем комбинацию, чтобы один битый файл не ломал установку
        return cache.addAll(ASSETS).catch(err => {
          console.error('Ошибка предкэширования: некоторые файлы не найдены', err);
        });
      })
      .then(() => self.skipWaiting())
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
  const url = e.request.url;

  // ЗАЩИТА МИКРОФОНА И СЕТЕВЫХ ЗАПРОСОВ: пускаем напрямую в сеть (ИСПРАВЛЕНО)
  if (url.includes('speech') || url.includes('google.com') || url.startsWith('blob:')) {
    return e.respondWith(fetch(e.request)); 
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Если файл есть в кэше — отдаем его мгновенно
      if (cachedResponse) return cachedResponse;
      
      // Если файла нет в кэше — пытаемся скачать из сети
      return fetch(e.request).catch((err) => {
        // Оффлайн-страховка для навигации
        if (e.request.mode === 'navigate') {
          return caches.match('/NanIdea/index.html');
        }
        // Возвращаем пустой ответ, чтобы не было ошибок в консоли
        return new Response('', { status: 404, statusText: 'Offline' });
      });
    })
  );
});
