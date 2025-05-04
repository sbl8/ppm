/**
 * ParaPowerMapping Service Worker
 * Enables offline functionality, faster loads through caching,
 * and provides a more app-like experience
 */

const CACHE_NAME = 'ppm-cache-v1';
const OFFLINE_URL = '/index.html';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/css/icons.css',
    '/js/main.js',
    '/images/logo.jpeg',
    '/images/art.jpeg',
    '/images/art2.jpeg',
    '/images/art3.png',
    '/images/art4.png',
    '/images/background6.png',
    '/images/icons/apple.svg',
    '/images/icons/arrow-up.svg',
    '/images/icons/email.svg',
    '/images/icons/facebook.svg',
    '/images/icons/link.svg',
    '/images/icons/patreon.svg',
    '/images/icons/rss.svg',
    '/images/icons/share.svg',
    '/images/icons/spotify.svg',
    '/images/icons/twitter.svg',
    '/images/icons/youtube.svg',
];

// Install service worker and cache core assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching app shell and content');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => caches.delete(cacheName))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Network-first strategy for dynamic API content with fallback to cache
self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) &&
        !event.request.url.includes('api-proxy.parapowermapping.com')) {
        return;
    }

    // For API requests, use network-first strategy
    if (event.request.url.includes('/api/') ||
        event.request.url.includes('api-proxy')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache a copy of the response
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            // Only cache successful responses
                            if (response.status === 200) {
                                cache.put(event.request, responseClone);
                            }
                        });
                    return response;
                })
                .catch(() => {
                    // If network fails, try the cache
                    return caches.match(event.request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                return cachedResponse;
                            }
                            // If no cache, show offline page
                            return caches.match(OFFLINE_URL);
                        });
                })
        );
        return;
    }

    // For non-API requests, use cache-first strategy
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                // If not in cache, fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Return the response but also cache it for future
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                // Only cache successful responses for static assets
                                if (response.status === 200 &&
                                    (event.request.url.endsWith('.css') ||
                                        event.request.url.endsWith('.js') ||
                                        event.request.url.endsWith('.jpg') ||
                                        event.request.url.endsWith('.jpeg') ||
                                        event.request.url.endsWith('.png') ||
                                        event.request.url.endsWith('.svg'))) {
                                    cache.put(event.request, responseClone);
                                }
                            });
                        return response;
                    })
                    .catch(() => {
                        // If both cache and network fail, show offline page for HTML requests
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match(OFFLINE_URL);
                        }
                        // Otherwise just fail
                        return new Response('Network error happened', {
                            status: 408,
                            headers: { 'Content-Type': 'text/plain' }
                        });
                    });
            })
    );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
    if (event.tag === 'contact-form-submission') {
        event.waitUntil(syncContactForm());
    }
});

// Handle contact form submissions when back online
async function syncContactForm() {
    try {
        // Get saved form data from IndexedDB
        const db = await openDB();
        const tx = db.transaction('contact-forms', 'readonly');
        const store = tx.objectStore('contact-forms');
        const formData = await store.getAll();

        // Submit each form
        const submissions = formData.map(async (data) => {
            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    // Remove from IndexedDB if successful
                    const deleteTx = db.transaction('contact-forms', 'readwrite');
                    const deleteStore = deleteTx.objectStore('contact-forms');
                    await deleteStore.delete(data.id);
                    return true;
                }
            } catch (error) {
                console.error('Error submitting form:', error);
                return false;
            }
        });

        // Wait for all submissions to complete
        await Promise.all(submissions);

    } catch (error) {
        console.error('Error syncing contact forms:', error);
        return false;
    }

    return true;
}

// Open IndexedDB for storing offline form submissions
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ppm-offline-db', 1);

        request.onerror = event => {
            reject('IndexedDB error: ' + request.error);
        };

        request.onsuccess = event => {
            resolve(request.result);
        };

        request.onupgradeneeded = event => {
            const db = event.target.result;
            db.createObjectStore('contact-forms', { keyPath: 'id' });
        };
    });
}
