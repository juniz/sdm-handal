// Service Worker untuk menangani cache foto presensi
const PHOTO_CACHE_NAME = "attendance-photos-v1";

// Install event
self.addEventListener("install", (event) => {
	console.log("Photo handler service worker installed");
	self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
	console.log("Photo handler service worker activated");
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					// Hapus cache foto lama
					if (
						cacheName.startsWith("attendance-photos-") &&
						cacheName !== PHOTO_CACHE_NAME
					) {
						console.log("Deleting old photo cache:", cacheName);
						return caches.delete(cacheName);
					}
				})
			);
		})
	);
});

// Fetch event - handle foto presensi
self.addEventListener("fetch", (event) => {
	const url = new URL(event.request.url);

	// Hanya handle request foto presensi
	if (url.pathname.startsWith("/photos/")) {
		event.respondWith(handlePhotoRequest(event.request));
	}
});

async function handlePhotoRequest(request) {
	const url = new URL(request.url);
	const cacheKey = url.pathname; // Gunakan pathname sebagai cache key

	try {
		// Selalu coba ambil dari network terlebih dahulu
		const networkResponse = await fetch(request, {
			cache: "no-store",
		});

		if (networkResponse.ok) {
			// Simpan ke cache jika berhasil
			const cache = await caches.open(PHOTO_CACHE_NAME);
			await cache.put(cacheKey, networkResponse.clone());

			console.log("Photo cached:", cacheKey);
			return networkResponse;
		}

		// Jika network gagal, coba dari cache
		const cachedResponse = await caches.match(cacheKey);
		if (cachedResponse) {
			console.log("Serving photo from cache:", cacheKey);
			return cachedResponse;
		}

		// Jika tidak ada di cache, return network response (meskipun error)
		return networkResponse;
	} catch (error) {
		console.error("Error fetching photo:", error);

		// Coba dari cache sebagai fallback
		const cachedResponse = await caches.match(cacheKey);
		if (cachedResponse) {
			console.log("Serving photo from cache (fallback):", cacheKey);
			return cachedResponse;
		}

		// Return 404 response jika semua gagal
		return new Response("Photo not found", {
			status: 404,
			statusText: "Not Found",
		});
	}
}

// Message handler untuk clear cache
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "CLEAR_PHOTO_CACHE") {
		event.waitUntil(
			caches.delete(PHOTO_CACHE_NAME).then(() => {
				console.log("Photo cache cleared");
				event.ports[0].postMessage({ success: true });
			})
		);
	}

	if (event.data && event.data.type === "REFRESH_PHOTO") {
		const photoPath = event.data.path;
		event.waitUntil(
			caches.open(PHOTO_CACHE_NAME).then((cache) => {
				return cache.delete(photoPath).then(() => {
					console.log("Photo cache refreshed for:", photoPath);
					event.ports[0].postMessage({ success: true });
				});
			})
		);
	}
});
