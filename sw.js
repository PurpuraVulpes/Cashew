const CACHE_NAME = 'cashew-v2';

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
    // Only cache GET requests
    if (e.request.method !== 'GET') return;
    
    e.respondWith(
        caches.match(e.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            
            return fetch(e.request).then(response => {
                // Only cache successful responses
                if (!response || response.status !== 200 || response.type === 'error') {
                    return response;
                }
                
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, responseToCache).catch(() => {});
                });
                
                return response;
            }).catch(() => {
                // Fallback for navigation requests
                if (e.request.mode === 'navigate') {
                    return caches.match('index.html');
                }
            });
        })
    );
});
