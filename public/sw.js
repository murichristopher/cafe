const CACHE_NAME = "cafe-da-manha-v1"
const OFFLINE_URL = "/offline.html"

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install")
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => {
        console.log("[Service Worker] Caching all: app shell and content")
        return cache.add(OFFLINE_URL)
      }),
      self.skipWaiting(), // Força o service worker a se tornar ativo imediatamente
    ]),
  )
})

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate")
  event.waitUntil(
    Promise.all([
      caches.keys().then((keyList) => {
        return Promise.all(
          keyList.map((key) => {
            if (key !== CACHE_NAME) {
              console.log("[Service Worker] Removing old cache:", key)
              return caches.delete(key)
            }
          }),
        )
      }),
      self.clients.claim(), // Toma controle de todos os clientes imediatamente
    ]),
  )
})

self.addEventListener("fetch", (event) => {
  console.log("[Service Worker] Fetch:", event.request.url)

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL)
      }),
    )
  } else {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return response
        })
        .catch(() => {
          return caches.match(event.request)
        }),
    )
  }
})

// Evento para forçar a atualização do service worker
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

