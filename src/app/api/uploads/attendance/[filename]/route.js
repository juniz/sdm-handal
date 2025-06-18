import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET(request, { params }) {
	try {
		const { filename } = params;

		// Validasi filename untuk security
		if (!filename || filename.includes("..") || filename.includes("/")) {
			return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
		}

		// Path ke file
		const filePath = path.join(
			process.cwd(),
			"uploads",
			"attendance",
			filename
		);

		try {
			// Cek apakah file exists
			await fs.access(filePath);

			// Baca file
			const fileBuffer = await fs.readFile(filePath);

			// Tentukan content type
			const contentType = filename.toLowerCase().endsWith(".png")
				? "image/png"
				: "image/jpeg";

			// Return file dengan headers yang sesuai
			return new NextResponse(fileBuffer, {
				status: 200,
				headers: {
					"Content-Type": contentType,
					"Cache-Control": "public, max-age=31536000, immutable", // Cache 1 year
					"Content-Length": fileBuffer.length.toString(),
				},
			});
		} catch (fileError) {
			// File tidak ditemukan
			return NextResponse.json({ error: "File not found" }, { status: 404 });
		}
	} catch (error) {
		console.error("Error serving attendance photo:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
