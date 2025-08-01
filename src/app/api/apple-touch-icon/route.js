import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
	try {
		// Get apple touch icon path from environment variable or use default
		const appleIconPath =
			process.env.NEXT_PUBLIC_APP_ICON_192 || "/icons/icon-192x192.png";
		const publicPath = path.join(process.cwd(), "public");
		const fullPath = path.join(publicPath, appleIconPath.replace(/^\//, ""));

		// Check if file exists
		if (!fs.existsSync(fullPath)) {
			// Return default apple touch icon if custom one doesn't exist
			const defaultPath = path.join(publicPath, "icons/icon-192x192.png");
			if (fs.existsSync(defaultPath)) {
				const fileBuffer = fs.readFileSync(defaultPath);
				return new NextResponse(fileBuffer, {
					headers: {
						"Content-Type": "image/png",
						"Cache-Control": "public, max-age=86400", // Cache for 24 hours
					},
				});
			}
			// Return 404 if no apple touch icon found
			return new NextResponse("Apple touch icon not found", { status: 404 });
		}

		// Read and return the custom apple touch icon
		const fileBuffer = fs.readFileSync(fullPath);
		const contentType = getContentType(fullPath);

		return new NextResponse(fileBuffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=86400", // Cache for 24 hours
			},
		});
	} catch (error) {
		console.error("Error serving apple touch icon:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}

function getContentType(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	switch (ext) {
		case ".png":
			return "image/png";
		case ".jpg":
		case ".jpeg":
			return "image/jpeg";
		case ".svg":
			return "image/svg+xml";
		case ".webp":
			return "image/webp";
		default:
			return "image/png";
	}
}
