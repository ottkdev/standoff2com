// Service Worker - Safe Caching Strategy
// NEVER caches: /api/**, /pay, /deposit, /checkout, /payment, /paytr, /admin

const CACHE_NAME = 'standoff2-v1'
const STATIC_CACHE = 'standoff2-static-v1'
const RUNTIME_CACHE = 'standoff2-runtime-v1'

// Paths that should NEVER be cached
const NO_CACHE_PATTERNS = [
  /\/api\/auth\//,
  /\/api\/paytr\//,
  /\/api\/.*\/.*\/(post|put|patch|delete)/i,
  /\/pay/,
  /\/deposit/,
  /\/checkout/,
  /\/payment/,
  /\/paytr/,
  /\/admin/,
]

// Check if URL should be cached
function shouldCache(url) {
  const urlPath = new URL(url).pathname.toLowerCase()
  
  // Never cache API routes
  if (urlPath.startsWith('/api/')) {
    return false
  }
  
  // Check against no-cache patterns
  for (const pattern of NO_CACHE_PATTERNS) {
    if (pattern.test(urlPath)) {
      return false
    }
  }
  
  return true
}

// Install: Precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        // Add other critical static assets here
      ]).catch((err) => {
        console.log('Precache failed:', err)
      })
    })
  )
  self.skipWaiting()
})

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      )
    })
  )
  return self.clients.claim()
})

// Fetch: Safe caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Never cache API routes, payment, or admin
  if (!shouldCache(url.href)) {
    return
  }
  
  // Static assets: CacheFirst
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) {
            return cached
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone())
            }
            return response
          })
        })
      })
    )
    return
  }
  
  // HTML/Data: NetworkFirst with short timeout
  if (request.headers.get('accept')?.includes('text/html') || url.pathname.startsWith('/_next/data/')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request).then((cached) => {
            if (cached) {
              return cached
            }
            // Fallback to offline page for HTML
            if (request.headers.get('accept')?.includes('text/html')) {
              return caches.match('/offline')
            }
            return new Response('Offline', { status: 503 })
          })
        })
    )
    return
  }
  
  // Other requests: StaleWhileRevalidate
  event.respondWith(
    caches.open(RUNTIME_CACHE).then((cache) => {
      return cache.match(request).then((cached) => {
        const fetchPromise = fetch(request).then((response) => {
          if (response.ok) {
            cache.put(request, response.clone())
          }
          return response
        })
        return cached || fetchPromise
      })
    })
  )
})

