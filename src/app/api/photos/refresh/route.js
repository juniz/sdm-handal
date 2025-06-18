import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request) {
	try {
		const { filename, path: photoPath } = await request.json();

		// Revalidate specific photo path
		if (filename) {
			revalidatePath(`/photos/${filename}`);
		}

		if (photoPath) {
			revalidatePath(photoPath);
		}

		// Revalidate all photos
		revalidatePath("/photos", "layout");

		return NextResponse.json({
			success: true,
			message: "Photo cache refreshed successfully",
			revalidated: {
				filename: filename || null,
				path: photoPath || null,
				timestamp: new Date().toISOString(),
			},
		});
	} catch (error) {
		console.error("Error refreshing photo cache:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to refresh photo cache",
				error: error.message,
			},
			{ status: 500 }
		);
	}
}

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const filename = searchParams.get("filename");

		if (filename) {
			revalidatePath(`/photos/${filename}`);
		}

		// Revalidate all photos
		revalidatePath("/photos", "layout");

		return NextResponse.json({
			success: true,
			message: "Photo cache refreshed via GET",
			filename: filename || "all",
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error refreshing photo cache:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Failed to refresh photo cache",
				error: error.message,
			},
			{ status: 500 }
		);
	}
}
