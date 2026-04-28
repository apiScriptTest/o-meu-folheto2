const cacheName = 'folheto-v2.2'; // Incrementa isto sempre
const assets = ['./', './index.html', './style.css', './app.js', './manifest.json'];

// Instalação e Cache
self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(cacheName).then(cache => cache.addAll(assets))
    );
});

// Limpeza de Caches Antigas
self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== cacheName).map(key => caches.delete(key))
            );
        }).then(() => self.clients.claim()) // Garante que o SW controla a página logo
    );
});

// Estratégia: Tenta Rede, se falhar vai à Cache
self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});