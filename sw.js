
// Nome do cache para controlo de versões
const CACHE_NAME = 'daniels-parfums-v1';

// Recursos essenciais que devem ser guardados em cache para funcionamento offline
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/@phosphor-icons/web',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Evento de Instalação: Cria a cache e guarda os ficheiros estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] A criar cache ativa dos recursos essenciais');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Evento de Ativação: Limpa caches antigas para evitar conflitos de dados
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] A eliminar cache antiga:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Evento de Interceção de Pedidos (Fetch): Tenta servir da cache offline, senão procura na rede
self.addEventListener('fetch', (event) => {
  // Ignora chamadas de APIs externas se necessário, ou aplica estratégia de cache alternada
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // Se o recurso não estiver na cache, faz o pedido à rede
        return fetch(event.request).then((response) => {
          // Não guarda em cache respostas inválidas ou de origens desconhecidas
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clona a resposta para guardar uma cópia na cache dinamicamente
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      }).catch(() => {
        // Fallback caso a rede falhe e o recurso não esteja em cache (pode ser redirecionado para o index.html)
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
