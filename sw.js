const cacheName = 'folheto-v1';
const assets = ['./', './index.html', './style.css', './app.js', './manifest.json'];

// Instalar o Service Worker e guardar os ficheiros em cache
self.addEventListener('install', e => {
  e.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets)));
});

// Responder com os ficheiros da cache quando estiver offline
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});