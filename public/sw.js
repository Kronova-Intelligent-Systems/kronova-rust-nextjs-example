const CACHE_NAME = "kronova-v2.0.0"
const STATIC_CACHE_URLS = [
  "/",
  "/dashboard",
  "/dashboard/agents",
  "/dashboard/workflows",
  "/dashboard/assets",
  "/dashboard/asset-gateway",
  "/auth/login",
  "/manifest.json",
  "/kronova-logo-header.svg",
  "/kronova-logo-footer.svg",
  "/favicon.svg",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

const DYNAMIC_CACHE_URLS = ["/api/", "/rspc/"]

// Install event - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Kronova: Caching static assets")
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log("Kronova: Service worker installed")
        return self.skipWaiting()
      }),
  )
})

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Kronova: Deleting old cache:", cacheName)
              return caches.delete(cacheName)
            }
          }),
        )
      })
      .then(() => {
        console.log("Kronova: Service worker activated")
        return self.clients.claim()
      }),
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests with network-first strategy
  if (DYNAMIC_CACHE_URLS.some((path) => url.pathname.startsWith(path))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone)
            })
          }
          return response
        })
        .catch(() => {
          return caches.match(request)
        }),
    )
    return
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type !== "basic") {
          return response
        }

        const responseToCache = response.clone()
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache)
        })

        return response
      })
    }),
  )
})

// Background sync for offline actions
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Handle background sync operations
      handleBackgroundSync(),
    )
  }
})

// Push notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New notification from Kronova",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "View Dashboard",
      },
      {
        action: "close",
        title: "Close",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Kronova", options))
})

// Notification click handling
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/dashboard"))
  }
})

// Helper function for background sync
async function handleBackgroundSync() {
  try {
    // Handle offline actions queue
    const offlineActions = await getOfflineActions()

    for (const action of offlineActions) {
      try {
        await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body,
        })

        // Remove successful action from queue
        await removeOfflineAction(action.id)
      } catch (error) {
        console.log("Failed to sync action:", action.id, error)
      }
    }
  } catch (error) {
    console.log("Background sync failed:", error)
  }
}

// IndexedDB helpers for offline actions
async function getOfflineActions() {
  // Implementation would use IndexedDB to store offline actions
  return []
}

async function removeOfflineAction(id) {
  // Implementation would remove action from IndexedDB
}
