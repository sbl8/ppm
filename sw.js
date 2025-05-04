/**
 * ParaPowerMapping Service Worker
 * Enables offline functionality, faster loads through caching,
 * and provides a more app-like experience
 */

const CACHE_NAME = 'ppm-cache-v2'; // Increment cache version
const OFFLINE_URL = 'index.html'; // Use relative path
// Use relative paths and ensure all listed files exist
const ASSETS_TO_CACHE = [
    // Core files relative to sw.js location
    'index.html',
    'manifest.json',
    'css/styles.css',
    'css/icons.css',
    'js/main.js',
    // Images relative to sw.js location
    'images/logo.jpeg',
    'images/art.jpeg',
    'images/art2.jpeg',
    'images/background.png', // Added: Exists
    'images/background3.png', // Added: Exists
    'images/background4.png', // Added: Exists
    'images/background6.png',
    // Icons relative to sw.js location
    'images/icons/apple.svg',
    'images/icons/arrow-up.svg',
    'images/icons/email.svg',
    'images/icons/instagram.svg', // Added: Exists
    'images/icons/link.svg',
    'images/icons/patreon.svg',
    'images/icons/rss.svg',
    'images/icons/share.svg',
    'images/icons/spotify.svg',
    'images/icons/substack.svg', // Added: Exists
    'images/icons/threads.svg', // Added: Exists
    'images/icons/twitter.svg',
    'images/icons/youtube.svg',
];

// Install service worker and cache core assets
self.addEventListener('install', event => {
    console.log(`[SW] Attempting to install and cache: ${CACHE_NAME}`);
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell and content');
                // Log assets being cached for easier debugging
                console.log('[SW] Assets to cache:', ASSETS_TO_CACHE);
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log(`[SW] Cache ${CACHE_NAME} installed successfully`);
                return self.skipWaiting();
            })
            .catch(error => {
                // Log the specific error during cache.addAll
                console.error(`[SW] Failed to cache assets during install for ${CACHE_NAME}:`, error);
                // Optionally, log which asset might have failed if possible, though addAll fails atomically
            })
    );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', event => {
    console.log(`[SW] Activating new service worker: ${CACHE_NAME}`);
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => cacheName !== CACHE_NAME)
                        .map(cacheName => {
                            console.log(`[SW] Deleting old cache: ${cacheName}`);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Old caches deleted, claiming clients.');
                return self.clients.claim();
            })
    );
});

// Network-first strategy for dynamic API content with fallback to cache
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip cross-origin requests that aren't for the API proxy or known CDNs
    if (url.origin !== self.location.origin &&
        !url.hostname.includes('api-proxy.parapowermapping.com') &&
        !url.hostname.includes('fonts.googleapis.com') && // Example: Allow fonts
        !url.hostname.includes('fonts.gstatic.com')) {   // Example: Allow fonts
        // console.log(`[SW] Skipping fetch for cross-origin request: ${url.href}`);
        return;
    }

    // API requests: Network-first
    if (url.pathname.includes('/api/') || url.hostname.includes('api-proxy')) {
        // console.log(`[SW] Handling API request (Network-first): ${url.href}`);
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful responses
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(event.request, responseClone));
                    }
                    return response;
                })
                .catch(async () => {
                    // Network failed, try cache
                    console.log(`[SW] Network failed for ${url.href}, trying cache.`);
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) {
                        console.log(`[SW] Serving from cache: ${url.href}`);
                        return cachedResponse;
                    }
                    // If no cache, return offline page for navigation requests, else generic error
                    if (event.request.mode === 'navigate') {
                        console.log('[SW] Serving offline page.');
                        return caches.match(OFFLINE_URL);
                    }
                    console.error(`[SW] Network and cache failed for: ${url.href}`);
                    return new Response('Network error and no cache available.', {
                        status: 408, headers: { 'Content-Type': 'text/plain' }
                    });
                })
        );
        return;
    }

    // Non-API requests (static assets): Cache-first
    // console.log(`[SW] Handling static asset request (Cache-first): ${url.href}`);
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // console.log(`[SW] Serving from cache: ${url.href}`);
                    return cachedResponse;
                }

                // Not in cache, fetch from network
                // console.log(`[SW] Not in cache, fetching from network: ${url.href}`);
                return fetch(event.request)
                    .then(response => {
                        // Cache successful responses for static assets
                        if (response.ok) {
                            const responseClone = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(event.request, responseClone));
                        }
                        return response;
                    })
                    .catch(async () => {
                        // Network failed, serve offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            console.log(`[SW] Network failed for navigation to ${url.href}, serving offline page.`);
                            return caches.match(OFFLINE_URL);
                        }
                        // For other asset types, just return the error (or a placeholder if needed)
                        console.error(`[SW] Network failed for asset: ${url.href}`);
                        // Return a generic error response or potentially specific placeholders
                        return new Response(`Failed to fetch ${url.pathname}`, {
                            status: 503, headers: { 'Content-Type': 'text/plain' }
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
