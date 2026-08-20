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
