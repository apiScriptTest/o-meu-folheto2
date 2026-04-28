const cacheName = 'folheto-v2.9';
const assets = [
  './',
  './index.html',
  './style-v2.css',
  './app-v2.js',
  './manifest.json'
];

self.addEventListener('install', e => {
    self.skipWaiting();
    e.waitUntil(caches.open(cacheName).then(c => c.addAll(assets)));
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keys => Promise.all(keys.filter(k => k !== cacheName).map(k => caches.delete(k))))
        .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', e => {
    // IMPORTANTE: Se houver parâmetros na URL (como ?loja=), 
    // ignoramos a cache e vamos à rede para garantir que o JS lê os dados novos
    const url = new URL(e.request.url);
    if (url.search.length > 0) {
        return e.respondWith(fetch(e.request));
    }

    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});