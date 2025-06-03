import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

export async function GET(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Token tidak valid",
				},
				{ status: 401 }
			);
		}

		return NextResponse.json({
			status: "success",
			data: {
				username: user.username,
				nama: user.nama,
				departemen: user.departemen,
				departemen_name: user.departemen_name,
			},
		});
	} catch (error) {
		console.error("Error fetching user profile:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil profil user",
			},
			{ status: 500 }
		);
	}
}
