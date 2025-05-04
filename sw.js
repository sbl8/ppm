const CACHE_NAME = 'ppm-cache-v2'; const OFFLINE_URL = 'index.html'; const ASSETS_TO_CACHE = ['index.html', 'manifest.json', 'css/styles.css', 'css/icons.css', 'js/main.js', 'images/logo.jpeg', 'images/art.jpeg', 'images/art2.jpeg', 'images/background.png', 'images/background3.png', 'images/background4.png', 'images/background6.png', 'images/icons/apple.svg', 'images/icons/arrow-up.svg', 'images/icons/email.svg', 'images/icons/instagram.svg', 'images/icons/link.svg', 'images/icons/patreon.svg', 'images/icons/rss.svg', 'images/icons/share.svg', 'images/icons/spotify.svg', 'images/icons/substack.svg', 'images/icons/threads.svg', 'images/icons/twitter.svg', 'images/icons/youtube.svg',]; self.addEventListener('install', event => { console.log(`[SW] Attempting to install and cache: ${CACHE_NAME}`); event.waitUntil(caches.open(CACHE_NAME).then(cache => { console.log('[SW] Caching app shell and content'); console.log('[SW] Assets to cache:', ASSETS_TO_CACHE); return cache.addAll(ASSETS_TO_CACHE) }).then(() => { console.log(`[SW] Cache ${CACHE_NAME} installed successfully`); return self.skipWaiting() }).catch(error => { console.error(`[SW] Failed to cache assets during install for ${CACHE_NAME}:`, error) })) }); self.addEventListener('activate', event => { console.log(`[SW] Activating new service worker: ${CACHE_NAME}`); event.waitUntil(caches.keys().then(cacheNames => { return Promise.all(cacheNames.filter(cacheName => cacheName !== CACHE_NAME).map(cacheName => { console.log(`[SW] Deleting old cache: ${cacheName}`); return caches.delete(cacheName) })) }).then(() => { console.log('[SW] Old caches deleted, claiming clients.'); return self.clients.claim() })) }); self.addEventListener('fetch', event => {
    const url = new URL(event.request.url); if (url.origin !== self.location.origin && !url.hostname.includes('api-proxy.parapowermapping.com') && !url.hostname.includes('fonts.googleapis.com') && !url.hostname.includes('fonts.gstatic.com')) { return }
    if (url.pathname.includes('/api/') || url.hostname.includes('api-proxy')) {
        event.respondWith(fetch(event.request).then(response => {
            if (response.ok) { const responseClone = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone)) }
            return response
        }).catch(async () => {
            console.log(`[SW] Network failed for ${url.href}, trying cache.`); const cachedResponse = await caches.match(event.request); if (cachedResponse) { console.log(`[SW] Serving from cache: ${url.href}`); return cachedResponse }
            if (event.request.mode === 'navigate') { console.log('[SW] Serving offline page.'); return caches.match(OFFLINE_URL) }
            console.error(`[SW] Network and cache failed for: ${url.href}`); return new Response('Network error and no cache available.', { status: 408, headers: { 'Content-Type': 'text/plain' } })
        })); return
    }
    event.respondWith(caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) { return cachedResponse }
        return fetch(event.request).then(response => {
            if (response.ok) { const responseClone = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone)) }
            return response
        }).catch(async () => {
            if (event.request.mode === 'navigate') { console.log(`[SW] Network failed for navigation to ${url.href}, serving offline page.`); return caches.match(OFFLINE_URL) }
            console.error(`[SW] Network failed for asset: ${url.href}`); return new Response(`Failed to fetch ${url.pathname}`, { status: 503, headers: { 'Content-Type': 'text/plain' } })
        })
    }))
}); self.addEventListener('sync', event => { if (event.tag === 'contact-form-submission') { event.waitUntil(syncContactForm()) } }); async function syncContactForm() {
    try { const db = await openDB(); const tx = db.transaction('contact-forms', 'readonly'); const store = tx.objectStore('contact-forms'); const formData = await store.getAll(); const submissions = formData.map(async (data) => { try { const response = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (response.ok) { const deleteTx = db.transaction('contact-forms', 'readwrite'); const deleteStore = deleteTx.objectStore('contact-forms'); await deleteStore.delete(data.id); return !0 } } catch (error) { console.error('Error submitting form:', error); return !1 } }); await Promise.all(submissions) } catch (error) { console.error('Error syncing contact forms:', error); return !1 }
    return !0
}
function openDB() { return new Promise((resolve, reject) => { const request = indexedDB.open('ppm-offline-db', 1); request.onerror = event => { reject('IndexedDB error: ' + request.error) }; request.onsuccess = event => { resolve(request.result) }; request.onupgradeneeded = event => { const db = event.target.result; db.createObjectStore('contact-forms', { keyPath: 'id' }) } }) }