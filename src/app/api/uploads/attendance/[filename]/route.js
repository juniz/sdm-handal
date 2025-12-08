import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// SECURITY FIX CVE-003: Validasi filename yang lebih ketat untuk mencegah path traversal
function validateFilename(filename) {
	if (!filename || typeof filename !== "string") {
		throw new Error("Invalid filename");
	}

	// 1. Decode URL encoding terlebih dahulu
	let decoded;
	try {
		decoded = decodeURIComponent(filename);
	} catch {
		decoded = filename;
	}

	// 2. Normalize path
	const normalized = path.normalize(decoded);

	// 3. Cek path traversal
	if (
		normalized.includes("..") ||
		normalized.includes("/") ||
		normalized.includes("\\") ||
		path.isAbsolute(normalized)
	) {
		throw new Error("Invalid filename: path traversal detected");
	}

	// 4. Whitelist ekstensi
	const allowedExts = [".jpg", ".jpeg", ".png"];
	const ext = path.extname(normalized).toLowerCase();
	if (!allowedExts.includes(ext)) {
		throw new Error("Invalid file extension");
	}

	// 5. Cek panjang filename
	if (normalized.length > 255) {
		throw new Error("Filename too long");
	}

	// 6. Cek karakter berbahaya
	if (!/^[a-zA-Z0-9_\-\.]+$/.test(normalized)) {
		throw new Error("Invalid characters in filename");
	}

	return normalized;
}

export async function GET(request, { params }) {
	try {
		const { filename } = params;

		// SECURITY FIX CVE-003: Validasi filename dengan fungsi yang lebih ketat
		let validatedFilename;
		try {
			validatedFilename = validateFilename(filename);
		} catch (validationError) {
			return NextResponse.json(
				{ error: "Invalid filename" },
				{ status: 400 }
			);
		}

		// Path ke file
		const filePath = path.join(
			process.cwd(),
			"uploads",
			"attendance",
			validatedFilename
		);

		// SECURITY FIX: Pastikan file path tidak keluar dari directory yang diizinkan
		const allowedDir = path.join(process.cwd(), "uploads", "attendance");
		const resolvedPath = path.resolve(filePath);
		const resolvedAllowedDir = path.resolve(allowedDir);

		if (!resolvedPath.startsWith(resolvedAllowedDir)) {
			return NextResponse.json(
				{ error: "Invalid file path" },
				{ status: 400 }
			);
		}

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
