const cacheName = 'folheto-v2.7';
const assets = [
  './?v=2.7',
  './index.html?v=2.7',
  './style-v2.css?v=2.7',
  './app-v2.js?v=2.7',
  './manifest.json?v=2.7'
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
    if (e.request.mode === 'navigate') {
        e.respondWith(fetch(e.request).catch(() => caches.match('./index.html?v=2.7')));
        return;
    }
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});