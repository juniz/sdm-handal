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
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			console.log("Cache opened");
			return cache.addAll(urlsToCache);
		})
	);
});

// Activate service worker
self.addEventListener("activate", (event) => {
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
});

// Fetch event
self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches
			.match(event.request)
			.then((response) => {
				if (response) {
					return response;
				}

				return fetch(event.request).then((response) => {
					// Jangan cache jika bukan GET request
					if (
						!event.request.url.startsWith("http") ||
						event.request.method !== "GET"
					) {
						return response;
					}

					// Clone response
					const responseToCache = response.clone();

					caches.open(CACHE_NAME).then((cache) => {
						cache.put(event.request, responseToCache);
					});

					return response;
				});
			})
			.catch(() => {
				// Jika offline, tampilkan halaman offline
				if (event.request.mode === "navigate") {
					return caches.match("/offline.html");
				}
			})
	);
});
