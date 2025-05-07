/**
 * ParaPowerMapping Service Worker
 * Provides offline capabilities and performance optimizations
 */

const CACHE_NAME = "ppm-cache-v1";
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/css/main.min.css",
  "/css/icons.min.css",
  "/js/main.min.js",
  "/images/logo.jpeg",
  "/images/background4.png",
  "/images/background6.png",
  "/images/art.jpeg",
  "/images/art2.jpeg",
  "/manifest.json",
  "/images/icons/apple.svg",
  "/images/icons/spotify.svg",
  "/images/icons/patreon.svg",
  "/images/icons/youtube.svg",
  "/images/icons/substack.svg",
  "/images/icons/rss.svg",
  "/images/icons/email.svg",
  "/images/icons/twitter.svg",
  "/images/icons/instagram.svg",
  "/images/icons/threads.svg",
  "/images/icons/facebook.svg",
  "/images/icons/link.svg",
  "/images/icons/arrow-up.svg",
  "/images/icons/share.svg",
  "/images/ghost.gif",
  "/images/ghost2.gif",
  "/images/ghost3.gif",
  "/images/substack.jpg",
];

// Install Service Worker and cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Service Worker: Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Clean up old caches on activation
self.addEventListener("activate", (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log("Service Worker: Deleting old cache", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Serve cached content when offline using a network-first strategy
self.addEventListener("fetch", (event) => {
  // Skip cross-origin requests like Spotify and Apple Podcasts embeds
  if (
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes("livereload")
  ) {
    return;
  }

  // Network-first approach for HTML and JSON (dynamic content)
  if (
    event.request.url.includes(".html") ||
    event.request.url.includes(".json") ||
    event.request.url.endsWith("/")
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If the response was good, clone it and store it in the cache
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Network failed, try the cache
          return caches.match(event.request).then((response) => {
            return response || caches.match("/offline.html");
          });
        })
    );
  }
  // Cache-first approach for static assets
  else if (
    event.request.url.includes("/images/") ||
    event.request.url.includes("/css/") ||
    event.request.url.includes("/js/")
  ) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return (
          response ||
          fetch(event.request).then((fetchResponse) => {
            const responseClone = fetchResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
            return fetchResponse;
          })
        );
      })
    );
  }
  // Default network-first strategy for everything else
  else {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});
