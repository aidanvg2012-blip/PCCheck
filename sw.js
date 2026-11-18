const CACHE = 'pccheck-shell-v15';
const CORE = ['./','./index.html','./styles.css','./app.js','./auth.js','./ui.js','./manifest.webmanifest','./icon.svg','./guides.html','./privacy.html','./pc-lab.html','./pc-lab.css','./pc-lab.js','./build-finder.html','./build-finder.css','./build-finder.js'];
self.addEventListener('install', event => event.waitUntil((async () => { const cache = await caches.open(CACHE); await cache.addAll(CORE); await self.skipWaiting(); })()));
self.addEventListener('activate', event => event.waitUntil((async () => { const keys = await caches.keys(); await Promise.all(keys.filter(key => key.startsWith('pccheck-shell-') && key !== CACHE).map(key => caches.delete(key))); await self.clients.claim(); })()));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) { event.respondWith(fetch(request)); return; }
  if (request.mode === 'navigate') {
    const cacheKey = url.pathname === '/' ? './index.html' : '.' + url.pathname;
    event.respondWith(fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(cacheKey, copy)); }
      return response;
    }).catch(() => caches.match(cacheKey).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => { if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); } return response; })));
});
