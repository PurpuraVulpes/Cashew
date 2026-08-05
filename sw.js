const CACHE_NAME = 'cashew-v3';

self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(names =>
            Promise.all(
                names.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    if (!e.request.url.startsWith('http')) return;
    
    e.respondWith(
        fetch(e.request)
            .then(response => {
                if (!response || response.status !== 200) {
                    return response;
                }
                
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, responseToCache).catch(() => {});
                });
                
                return response;
            })
            .catch(() => {
                return caches.match(e.request).then(cached => {
                    if (cached) return cached;
                    if (e.request.mode === 'navigate') {
                        return caches.match('./');
                    }
                });
            })
    );
});
