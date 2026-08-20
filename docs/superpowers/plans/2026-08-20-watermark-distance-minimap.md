# Watermark Office Distance & Mini Map Thumbnail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan kalkulasi jarak ke kantor (`NEXT_PUBLIC_OFFICE_LAT`, `NEXT_PUBLIC_OFFICE_LNG`), status validitas radius (`NEXT_PUBLIC_ALLOWED_RADIUS`), dan *mini map thumbnail* visual (CartoDB/OpenStreetMap) dengan pin lokasi pada watermark foto presensi.

**Architecture:**
- `geoHelper.js`: Menyediakan fungsi `calculateDistance`, `formatDistance`, `latLonToTile`, dan `fetchMiniMapTile`.
- `imageOptimizer.js`: Memperbarui `stampGpsWatermark` untuk merender kotak mini map di kiri banner dan baris teks jarak kantor di kolom kanan.
- `attendance/page.js`: Menghitung jarak terhadap env vars dan memuat tile peta mini secara paralel sebelum diteruskan ke kamera.

**Tech Stack:** React, Next.js, HTML5 Canvas API, OpenStreetMap / CartoDB raster tiles, Moment.js.

---

### Task 1: Add Distance & Mini Map Utilities in `src/utils/geoHelper.js`

**Files:**
- Modify: `src/utils/geoHelper.js`

**Interfaces:**
- Produces:
  - `calculateDistance(lat1, lon1, lat2, lon2): number`
  - `formatDistance(meters): string`
  - `latLonToTile(lat, lon, zoom): { x, y, z }`
  - `fetchMiniMapTile(latitude, longitude, zoom = 16): Promise<HTMLImageElement | null>`

- [ ] **Step 1: Implement functions in `src/utils/geoHelper.js`**

```javascript
export function calculateDistance(lat1, lon1, lat2, lon2) {
	if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
	const R = 6371e3; // meters
	const φ1 = (lat1 * Math.PI) / 180;
	const φ2 = (lat2 * Math.PI) / 180;
	const Δφ = ((lat2 - lat1) * Math.PI) / 180;
	const Δλ = ((lon2 - lon1) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

export function formatDistance(distanceInMeters) {
	if (distanceInMeters === null || distanceInMeters === undefined || isNaN(distanceInMeters)) {
		return "-";
	}
	if (distanceInMeters < 1000) {
		return `${Math.round(distanceInMeters)}m`;
	}
	return `${(distanceInMeters / 1000).toFixed(2)}km`;
}

export function latLonToTile(lat, lon, zoom = 16) {
	const latRad = (lat * Math.PI) / 180;
	const n = Math.pow(2, zoom);
	const x = Math.floor(((lon + 180) / 360) * n);
	const y = Math.floor(
		((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
	);
	return { x, y, z: zoom };
}

export function fetchMiniMapTile(latitude, longitude, zoom = 16) {
	if (typeof window === "undefined" || !latitude || !longitude) {
		return Promise.resolve(null);
	}

	return new Promise((resolve) => {
		try {
			const { x, y, z } = latLonToTile(Number(latitude), Number(longitude), zoom);
			const tileUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;

			const img = new Image();
			img.crossOrigin = "anonymous";

			const timer = setTimeout(() => {
				resolve(null);
			}, 1500);

			img.onload = () => {
				clearTimeout(timer);
				resolve(img);
			};

			img.onerror = () => {
				clearTimeout(timer);
				resolve(null);
			};

			img.src = tileUrl;
		} catch (err) {
			console.warn("Mini map tile fetch failed:", err);
			resolve(null);
		}
	});
}
```

- [ ] **Step 2: Commit Task 1**
```bash
git add src/utils/geoHelper.js
git commit -m "feat(attendance): add distance calculation and minimap tile fetcher"
```

---

### Task 2: Update Watermark Stamping in `src/utils/imageOptimizer.js`

**Files:**
- Modify: `src/utils/imageOptimizer.js`

- [ ] **Step 1: Update `stampGpsWatermark` to render mini map and distance**

- Terima parameter tambahan pada metadata:
  - `distance`: number (dalam meter)
  - `allowedRadius`: number (dalam meter)
  - `isWithinRadius`: boolean
  - `mapImage`: HTMLImageElement | null
- Jika `mapImage` tersedia:
  - Tentukan ukuran map box: misal `mapSize = Math.min(100 * scale, totalTextHeight)` (~75-90px).
  - Gambar map box di sebelah kiri (dengan rounded rectangle clip, border tipis, dan red pin marker + shadow di tengah map).
  - Geser kolom teks ke sebelah kanan kotak map.
- Tambahkan baris jarak kantor:
  - Teks: `📏 Jarak Kantor: ${formattedDistance} (Radius: ${allowedRadius}m - ${isWithinRadius ? 'Valid' : 'Di Luar Area'})`
  - Warna: Emerald (`#34D399`) jika `isWithinRadius`, Rose (`#F87171`) jika di luar radius.

- [ ] **Step 2: Commit Task 2**
```bash
git add src/utils/imageOptimizer.js
git commit -m "feat(attendance): render mini map thumbnail and office distance in watermark"
```

---

### Task 3: Integrate Distance & Mini Map in `src/app/dashboard/attendance/page.js`

**Files:**
- Modify: `src/app/dashboard/attendance/page.js`

- [ ] **Step 1: Compute distance & fetch mini map in `handleCheckIn`**

- Import `calculateDistance`, `formatDistance`, `fetchMiniMapTile` dari `@/utils/geoHelper`.
- Dapatkan nilai env:
  ```javascript
  const officeLat = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LAT || "-7.9797");
  const officeLng = parseFloat(process.env.NEXT_PUBLIC_OFFICE_LNG || "112.6304");
  const allowedRadius = parseFloat(process.env.NEXT_PUBLIC_ALLOWED_RADIUS || "500");
  ```
- Hitung:
  ```javascript
  const distance = calculateDistance(lat, lng, officeLat, officeLng);
  const isWithinRadius = distance <= allowedRadius;
  ```
- Muat `getReverseGeocode(lat, lng)` dan `fetchMiniMapTile(lat, lng)` secara paralel via `Promise.all`:
  ```javascript
  const [address, mapImage] = await Promise.all([
      getReverseGeocode(lat, lng).catch(() => ""),
      fetchMiniMapTile(lat, lng).catch(() => null)
  ]);
  ```
- Teruskan ke `watermarkMetadata`:
  ```javascript
  const watermarkMetadata = {
      userName: currentUser?.nama || "",
      nik: currentUser?.nik || "",
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      timestamp: momentInstance.format("dddd, DD MMMM YYYY, HH:mm:ss"),
      address: address || "",
      distance,
      allowedRadius,
      isWithinRadius,
      mapImage,
  };
  ```

- [ ] **Step 2: Commit Task 3**
```bash
git add src/app/dashboard/attendance/page.js
git commit -m "feat(attendance): pass office distance and minimap to camera watermark"
```

---

### Task 4: Build Verification & End-to-End Test

- [ ] **Step 1: Run `npm run build`**
```bash
npm run build
```
Verify build compiles cleanly with 0 errors.
