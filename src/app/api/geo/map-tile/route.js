import { NextResponse } from "next/server";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const z = searchParams.get("z");
		const x = searchParams.get("x");
		const y = searchParams.get("y");

		if (!z || !x || !y) {
			return new NextResponse("Missing tile coordinates (z, x, y required)", {
				status: 400,
			});
		}

		// Sanitize z, x, y (only positive integers)
		if (!/^\d+$/.test(z) || !/^\d+$/.test(x) || !/^\d+$/.test(y)) {
			return new NextResponse("Invalid tile coordinates", { status: 400 });
		}

		const headers = {
			"User-Agent":
				"SDM-Handal/1.0 (Hospital Attendance System; contact@sdm-handal.local)",
		};

		let imageBuffer = null;

		// 1. Primary: CartoDB Voyager
		try {
			const cartoUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;
			const cartoRes = await fetch(cartoUrl, {
				headers,
			});
			if (cartoRes.ok) {
				imageBuffer = await cartoRes.arrayBuffer();
			}
		} catch {
			// Fallback to OSM if CartoDB fails
		}

		// 2. Fallback: OpenStreetMap
		if (!imageBuffer) {
			try {
				const osmUrl = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
				const osmRes = await fetch(osmUrl, {
					headers,
				});
				if (osmRes.ok) {
					imageBuffer = await osmRes.arrayBuffer();
				} else if (osmRes.status === 404) {
					return new NextResponse("Tile not found", { status: 404 });
				}
			} catch {
				// OSM fallback failed
			}
		}

		if (!imageBuffer) {
			return new NextResponse("Failed to fetch map tile", { status: 502 });
		}

		return new NextResponse(imageBuffer, {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "public, max-age=86400",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (error) {
		console.error("Map tile proxy error:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}
