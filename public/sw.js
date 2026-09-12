/* Cashew — Service Worker : l'app reste utilisable hors-ligne */
const CACHE = 'cashew-v1'
const ROOT = self.registration.scope

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.add(ROOT)).then(() => self.skipWaiting()).catch(() => {})
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  const url = new URL(e.request.url)
  if (url.origin !== location.origin) return

  // Navigation : réseau d'abord, repli sur le cache hors-ligne
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match(ROOT)))
    return
  }

  // Assets : cache d'abord, puis réseau (mis en cache au passage)
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit
      return fetch(e.request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(e.request, copy))
        }
        return res
      })
    })
  )
})
