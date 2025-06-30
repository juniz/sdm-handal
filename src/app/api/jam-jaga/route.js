import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - Ambil data shift dari jam_jaga berdasarkan departemen
export async function GET(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const departemen = searchParams.get("departemen");

		if (!departemen) {
			return NextResponse.json(
				{ message: "Parameter departemen diperlukan" },
				{ status: 400 }
			);
		}

		// Query untuk mengambil data shift berdasarkan departemen
		const shiftData = await rawQuery(
			`
			SELECT DISTINCT shift 
			FROM jam_jaga 
			WHERE dep_id = ?
			ORDER BY 
				CASE 
					WHEN shift = 'Pagi' THEN 1
					WHEN shift = 'Siang' THEN 2  
					WHEN shift = 'Malam' THEN 3
					ELSE 4
				END
		`,
			[departemen]
		);

		return NextResponse.json({
			status: 200,
			message: "Data shift berhasil diambil",
			data: shiftData,
		});
	} catch (error) {
		console.error("Error fetching shift data:", error);
		return NextResponse.json(
			{
				message: "Terjadi kesalahan saat mengambil data shift",
			},
			{ status: 500 }
		);
	}
}
