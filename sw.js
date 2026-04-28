const cacheName = 'folheto-v2.5'; // Muda para v2.5
const assets = [
  './?v=2.5',
  './index.html?v=2.5',
  './style-v2.css?v=2.5',
  './app-v2.js?v=2.5',
  './manifest.json?v=2.5'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(cacheName).then(cache => cache.addAll(assets))
    );
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.filter(k => k !== cacheName).map(k => caches.delete(k)));
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    if (e.request.mode === 'navigate') {
        // Sempre buscar index.html da rede
        e.respondWith(fetch(e.request));
        return;
    }

    // Para os outros ficheiros: cache primeiro
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});