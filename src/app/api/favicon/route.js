import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
	try {
		// Get favicon path from environment variable or use default
		const faviconPath = process.env.NEXT_PUBLIC_FAVICON_PATH || "/favicon.ico";
		const publicPath = path.join(process.cwd(), "public");
		const fullPath = path.join(publicPath, faviconPath.replace(/^\//, ""));

		// Check if file exists
		if (!fs.existsSync(fullPath)) {
			// Return default favicon if custom one doesn't exist
			const defaultPath = path.join(publicPath, "favicon.ico");
			if (fs.existsSync(defaultPath)) {
				const fileBuffer = fs.readFileSync(defaultPath);
				return new NextResponse(fileBuffer, {
					headers: {
						"Content-Type": "image/x-icon",
						"Cache-Control": "public, max-age=86400", // Cache for 24 hours
					},
				});
			}
			// Return 404 if no favicon found
			return new NextResponse("Favicon not found", { status: 404 });
		}

		// Read and return the custom favicon
		const fileBuffer = fs.readFileSync(fullPath);
		const contentType = getContentType(fullPath);

		return new NextResponse(fileBuffer, {
			headers: {
				"Content-Type": contentType,
				"Cache-Control": "public, max-age=86400", // Cache for 24 hours
			},
		});
	} catch (error) {
		console.error("Error serving favicon:", error);
		return new NextResponse("Internal Server Error", { status: 500 });
	}
}

function getContentType(filePath) {
	const ext = path.extname(filePath).toLowerCase();
	switch (ext) {
		case ".ico":
			return "image/x-icon";
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
			return "image/x-icon";
	}
}
