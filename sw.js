const cacheName = 'folheto-v2.1'; // MUDA ISTO sempre que fizeres update
const assets = ['./', './index.html', './style.css', './app.js', './manifest.json'];

self.addEventListener('install', e => {
    self.skipWaiting(); // Não pede licença, instala logo
    e.waitUntil(
        caches.open(cacheName).then(cache => cache.addAll(assets))
    );
});

self.addEventListener('activate', e => {
    // Apaga todas as caches antigas que não sejam a v2.1
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys.map(key => {
                if (key !== cacheName) return caches.delete(key);
            }));
        })
    );
});

self.addEventListener('fetch', e => {
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});