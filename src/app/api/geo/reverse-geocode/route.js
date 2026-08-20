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

		try {
			const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&zoom=18&addressdetails=1`;
			const response = await fetch(url, {
				headers: {
					"User-Agent":
						"SDM-Handal/1.0 (Hospital Attendance System; contact@sdm-handal.local)",
					"Accept-Language": "id,en;q=0.9",
				},
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!response.ok) {
				return NextResponse.json({ address: "" });
			}

			const data = await response.json();
			const addr = data.address || {};

			const road =
				addr.road || addr.pedestrian || addr.street || addr.footway || addr.path || "";
			const area =
				addr.village ||
				addr.suburb ||
				addr.neighbourhood ||
				addr.quarter ||
				addr.hamlet ||
				"";
			const district =
				addr.city_district || addr.district || addr.subdistrict || "";
			const city =
				addr.city || addr.town || addr.municipality || addr.county || addr.state || "";

			const parts = [road, area, district, city].filter(Boolean);
			const formattedAddress =
				parts.length > 0 ? parts.join(", ") : data.display_name || "";

			return NextResponse.json(
				{ address: formattedAddress },
				{
					headers: {
						"Cache-Control": "public, max-age=3600",
					},
				}
			);
		} catch {
			clearTimeout(timeoutId);
			return NextResponse.json({ address: "" });
		}
	} catch {
		return NextResponse.json({ address: "" });
	}
}
