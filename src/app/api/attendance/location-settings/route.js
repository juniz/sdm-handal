import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request) {
	try {
		const cookieStore = cookies();
		const token = await cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Verify token
		await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));

		// Get location validation setting from environment
		const isLocationValidationEnabled =
			process.env.ENABLE_LOCATION_VALIDATION !== "false";

		return NextResponse.json({
			status: 200,
			message: "Pengaturan lokasi berhasil diambil",
			data: {
				isLocationValidationEnabled,
				locationValidationStatus: isLocationValidationEnabled
					? "enabled"
					: "disabled",
				message: isLocationValidationEnabled
					? "Validasi lokasi diaktifkan - Presensi akan divalidasi berdasarkan lokasi"
					: "Validasi lokasi dinonaktifkan - Presensi akan menyimpan lokasi tanpa validasi",
			},
		});
	} catch (error) {
		console.error("Error fetching location settings:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil pengaturan lokasi" },
			{ status: 500 }
		);
	}
}
