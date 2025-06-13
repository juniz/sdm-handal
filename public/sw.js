const CACHE_NAME = "sdm-handal-v1";

// Daftar aset yang akan di-cache
const urlsToCache = [
	"/",
	"/offline.html",
	"/manifest.json",
	"/icons/icon-72x72.png",
	"/icons/icon-96x96.png",
	"/icons/icon-128x128.png",
	"/icons/icon-144x144.png",
	"/icons/icon-152x152.png",
	"/icons/icon-192x192.png",
	"/icons/icon-384x384.png",
	"/icons/icon-512x512.png",
];

// Install service worker
self.addEventListener("install", (event) => {
	console.log("Service Worker installing...");
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log("Cache opened");
			return cache.addAll(urlsToCache);
		})
	);
	// Force activation of new service worker
	self.skipWaiting();
});

// Activate service worker
self.addEventListener("activate", (event) => {
	console.log("Service Worker activating...");
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames
					.filter((cacheName) => {
						return (
							cacheName.startsWith("sdm-handal-") && cacheName !== CACHE_NAME
						);
					})
					.map((cacheName) => {
						return caches.delete(cacheName);
					})
			);
		})
	);
	// Take control of all clients immediately
	self.clients.claim();
});

// Handle messages from client
self.addEventListener("message", (event) => {
	console.log("Service Worker received message:", event.data);

	if (event.data && event.data.type === "SYNC_AUTH") {
		// Sync authentication state across all clients
		self.clients.matchAll().then((clients) => {
			clients.forEach((client) => {
				client.postMessage({
					type: "AUTH_SYNC",
					data: event.data.authData,
				});
			});
		});
	}

	if (event.data && event.data.type === "KEEP_ALIVE") {
		// Keep service worker alive for Android PWA
		event.ports[0].postMessage({ status: "alive" });
	}
});

// Enhanced fetch event with better error handling
self.addEventListener("fetch", (event) => {
	// Skip non-GET requests and chrome-extension requests
	if (
		event.request.method !== "GET" ||
		event.request.url.startsWith("chrome-extension://")
	) {
		return;
	}

	event.respondWith(
		caches.match(event.request).then((response) => {
			if (response) {
				// Serve from cache but also try to update in background
				fetch(event.request)
					.then((fetchResponse) => {
						if (fetchResponse && fetchResponse.status === 200) {
							const responseToCache = fetchResponse.clone();
							caches.open(CACHE_NAME).then((cache) => {
								cache.put(event.request, responseToCache);
							});
						}
					})
					.catch(() => {
						// Network error, but we have cache
						console.log(
							"Network error, serving from cache:",
							event.request.url
						);
					});

				return response;
			}

			// Not in cache, try network
			return fetch(event.request)
				.then((response) => {
					// Don't cache non-successful responses
					if (
						!response ||
						response.status !== 200 ||
						response.type !== "basic"
					) {
						return response;
					}

					// Clone response for caching
					const responseToCache = response.clone();

					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});

					return response;
				})
				.catch((error) => {
					console.log("Fetch failed for:", event.request.url, error);

					// If it's a navigation request and we're offline, show offline page
					if (event.request.mode === "navigate") {
						return caches.match("/offline.html");
					}

					// For other requests, throw the error
					throw error;
				});
		})
	);
});

// Handle background sync for Android PWA
self.addEventListener("sync", (event) => {
	console.log("Background sync triggered:", event.tag);

	if (event.tag === "auth-sync") {
		event.waitUntil(
			// Notify all clients to check their auth state
			self.clients.matchAll().then((clients) => {
				clients.forEach((client) => {
					client.postMessage({
						type: "CHECK_AUTH_STATE",
					});
				});
			})
		);
	}
});

// Handle push notifications (for future use)
self.addEventListener("push", (event) => {
	console.log("Push notification received:", event);
	// Handle push notifications if needed
});

// Periodic background sync for keeping session alive (Android PWA)
self.addEventListener("periodicsync", (event) => {
	if (event.tag === "session-keepalive") {
		event.waitUntil(
			self.clients.matchAll().then((clients) => {
				clients.forEach((client) => {
					client.postMessage({
						type: "SESSION_KEEPALIVE",
					});
				});
			})
		);
	}
});
