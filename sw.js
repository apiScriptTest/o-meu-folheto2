const cacheName = 'folheto-v2.5'; // Muda para v2.5
const assets = ['./', './index.html', './style-v2.css', './app-v2.js', './manifest.json'];

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
    // Tenta rede primeiro para garantir que apanha o index.html novo
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});