const cacheName = 'folheto-v2'; // Muda este nome sempre que quiseres um update total
const assets = ['./', './index.html', './style.css', './app.js', './manifest.json'];

// Instalação: força a ativação imediata
self.addEventListener('install', e => {
  self.skipWaiting(); // Não espera que a app feche para atualizar
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(assets))
  );
});

// Ativação: limpa caches antigas para não ocupar espaço
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== cacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});

// Serve os ficheiros da cache (modo offline)
self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});