# Reliable Geocoding & Mini Map Server-Side Proxy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyediakan API proxy internal untuk reverse geocoding dan tile peta mini agar terbebas dari CORS blocking serta memperbaiki format teks alamat pada watermark foto presensi.

**Architecture:**
- `src/app/api/geo/reverse-geocode/route.js`: Server-side geocoder dengan User-Agent resmi.
- `src/app/api/geo/map-tile/route.js`: Server-side raster tile proxy dengan CORS support & caching.
- `src/utils/geoHelper.js`: Mengarahkan pemanggilan ke endpoint internal.
- `src/utils/imageOptimizer.js`: Memperbaiki format fallback alamat watermark.

---

### Task 1: Create Server-Side Geocoding and Map Tile API Routes

**Files:**
- Create: `src/app/api/geo/reverse-geocode/route.js`
- Create: `src/app/api/geo/map-tile/route.js`

- [ ] **Step 1: Implement `src/app/api/geo/reverse-geocode/route.js`**

```javascript
import { NextResponse } from "next/server";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const lat = searchParams.get("lat");
		const lng = searchParams.get("lng");

		if (!lat || !lng) {
			return NextResponse.json({ address: "" });
		}

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000);

		const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent": "SDM-Handal/1.0 (Hospital Attendance System; contact@sdm-handal.local)",
				"Accept": "application/json",
				"Accept-Language": "id,en",
			},
		});
		clearTimeout(timeoutId);

		if (!response.ok) {
			return NextResponse.json({ address: "" });
		}

		const data = await response.json();
		if (data && data.address) {
			const addr = data.address;
			const parts = [
				addr.road || addr.street || addr.pedestrian || addr.building,
				addr.village || addr.suburb || addr.neighbourhood,
				addr.city_district || addr.district || addr.subdistrict,
				addr.city || addr.town || addr.county || addr.state,
			].filter(Boolean);

			const formattedAddress =
				parts.join(", ") ||
				data.display_name?.split(",").slice(0, 3).join(",") ||
				"";

			return NextResponse.json(
				{ address: formattedAddress },
				{
					headers: {
						"Cache-Control": "public, max-age=3600",
					},
				}
			);
		}

		return NextResponse.json({ address: "" });
	} catch (error) {
		console.warn("Server reverse geocode error:", error?.message);
		return NextResponse.json({ address: "" });
	}
}
```

- [ ] **Step 2: Implement `src/app/api/geo/map-tile/route.js`**

```javascript
import { NextResponse } from "next/server";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const z = searchParams.get("z") || "16";
		const x = searchParams.get("x");
		const y = searchParams.get("y");

		if (!x || !y) {
			return new NextResponse("Missing tile coordinates", { status: 400 });
		}

		const tileUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3000);

		let response = await fetch(tileUrl, {
			signal: controller.signal,
			headers: {
				"User-Agent": "SDM-Handal/1.0",
			},
		});
		clearTimeout(timeoutId);

		if (!response.ok) {
			// Fallback to OSM tile server
			const osmUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
			response = await fetch(osmUrl, {
				headers: {
					"User-Agent": "SDM-Handal/1.0 (Hospital Attendance System)",
				},
			});
		}

		if (!response.ok) {
			return new NextResponse("Tile not found", { status: 404 });
		}

		const imageBuffer = await response.arrayBuffer();

		return new NextResponse(imageBuffer, {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "public, max-age=86400",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (error) {
		console.warn("Server map tile proxy error:", error?.message);
		return new NextResponse("Map tile fetch error", { status: 500 });
	}
}
```

- [ ] **Step 3: Commit Task 1**
```bash
git add src/app/api/geo/
git commit -m "feat(geo): add server-side reverse geocoding and map tile proxy API routes"
```

---

### Task 2: Update Utilities in `src/utils/geoHelper.js` & `src/utils/imageOptimizer.js`

**Files:**
- Modify: `src/utils/geoHelper.js`
- Modify: `src/utils/imageOptimizer.js`

- [ ] **Step 1: Update `src/utils/geoHelper.js` to call internal API endpoints**

```javascript
export async function getReverseGeocode(latitude, longitude) {
	if (!latitude || !longitude) return "";
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 3500);

		const url = `/api/geo/reverse-geocode?lat=${latitude}&lng=${longitude}`;
		const response = await fetch(url, { signal: controller.signal });
		clearTimeout(timeoutId);

		if (!response.ok) return "";
		const data = await response.json();
		return data?.address || "";
	} catch (error) {
		console.warn("Reverse geocode client error:", error?.message);
		return "";
	}
}

export function fetchMiniMapTile(latitude, longitude, zoom = 16) {
	if (typeof window === "undefined" || latitude == null || longitude == null) {
		return Promise.resolve(null);
	}

	return new Promise((resolve) => {
		try {
			const { x, y, z } = latLonToTile(Number(latitude), Number(longitude), zoom);
			const tileUrl = `/api/geo/map-tile?z=${z}&x=${x}&y=${y}`;

			const img = new Image();
			img.crossOrigin = "anonymous";

			const timer = setTimeout(() => {
				resolve(null);
			}, 3000);

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
			console.warn("Mini map tile client fetch failed:", err?.message);
			resolve(null);
		}
	});
}
```

- [ ] **Step 2: Update `src/utils/imageOptimizer.js` fallback format**

In `stampGpsWatermark`:
```javascript
const rawAddress = address || "Area GPS Terverifikasi";
const addressFullText = `📍 ${rawAddress}`;
```

- [ ] **Step 3: Commit Task 2**
```bash
git add src/utils/geoHelper.js src/utils/imageOptimizer.js
git commit -m "feat(attendance): use internal proxy for geocoding and clean address fallback"
```

---

### Task 3: Build Verification & End-to-End Test

- [ ] **Step 1: Run `npm run build`**
```bash
npm run build
```
Verify 0 errors.
