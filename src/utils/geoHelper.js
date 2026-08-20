export async function getReverseGeocode(latitude, longitude) {
	if (!latitude || !longitude) return "";
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 2000);

		const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
		const response = await fetch(url, {
			signal: controller.signal,
			headers: { "Accept": "application/json" }
		});
		clearTimeout(timeoutId);

		if (!response.ok) return "";
		const data = await response.json();
		
		if (data && data.address) {
			const addr = data.address;
			const parts = [
				addr.road || addr.street || addr.pedestrian || addr.building,
				addr.village || addr.suburb || addr.neighbourhood,
				addr.city_district || addr.district || addr.subdistrict,
				addr.city || addr.town || addr.county || addr.state
			].filter(Boolean);

			return parts.join(", ") || data.display_name?.split(",").slice(0, 3).join(",") || "";
		}

		return "";
	} catch (error) {
		console.warn("Reverse geocode error / timeout:", error);
		return "";
	}
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
	if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return 0;
	const R = 6371e3; // meters
	const φ1 = (Number(lat1) * Math.PI) / 180;
	const φ2 = (Number(lat2) * Math.PI) / 180;
	const Δφ = ((Number(lat2) - Number(lat1)) * Math.PI) / 180;
	const Δλ = ((Number(lon2) - Number(lon1)) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

export function formatDistance(distanceInMeters) {
	if (distanceInMeters === null || distanceInMeters === undefined || isNaN(distanceInMeters) || distanceInMeters < 0) {
		return "-";
	}
	if (distanceInMeters < 1000) {
		return `${Math.round(distanceInMeters)}m`;
	}
	return `${(distanceInMeters / 1000).toFixed(2)}km`;
}

export function latLonToTile(lat, lon, zoom = 16) {
	const latRad = (Number(lat) * Math.PI) / 180;
	const n = Math.pow(2, zoom);
	const x = Math.floor(((Number(lon) + 180) / 360) * n);
	const y = Math.floor(
		((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n
	);
	return { x, y, z: zoom };
}

export function fetchMiniMapTile(latitude, longitude, zoom = 16) {
	if (typeof window === "undefined" || latitude == null || longitude == null) {
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
