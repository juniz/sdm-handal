import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { select } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request) {
	try {
		const cookieStore = cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			if (error.code === "ERR_JWT_EXPIRED") {
				return NextResponse.json(
					{
						error: "Token kedaluwarsa, silakan login kembali",
					},
					{ status: 401 }
				);
			}
			throw error;
		}

		const departemen = verified.payload.departemen;

		// Ambil data shift dari tabel jadwal_tambahan
		const shifts = await select({
			table: "jadwal_tambahan",
			where: {
				dep_id: departemen,
			},
		});

		return NextResponse.json({
			message: "Data shift tambahan berhasil diambil",
			data: shifts,
		});
	} catch (error) {
		console.error("Error fetching additional shifts:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data shift tambahan" },
			{ status: 500 }
		);
	}
}
