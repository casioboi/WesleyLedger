const CACHE_NAME = 'wesleyledger-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Failed to cache some assets:', err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (request.method !== 'GET') {
    return
  }

  if (url.hostname !== self.location.hostname) {
    return
  }

  if (url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) return response
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
            return response
          })
          .catch(() => {
            return caches.match(request).then((r) => r || new Response('Offline', { status: 503 }))
          })
      })
    )
  } else {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request)
            .then((response) => {
              if (!response || response.status !== 200) {
                return response
              }
              const responseToCache = response.clone()
              if (request.url.includes('.js') || request.url.includes('.css') || request.url.includes('.svg')) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, responseToCache)
                })
              }
              return response
            })
            .catch(() => {
              return new Response('Offline', { status: 503 })
            })
        )
      })
    )
  }
})
