import { NextResponse } from "next/server";
import { select } from "@/lib/db-helper";

export async function GET(request) {
	try {
		// Ambil semua data pendidikan
		const pendidikan = await select({
			table: "pendidikan",
			orderBy: "indek",
			order: "ASC",
		});

		if (!pendidikan || pendidikan.length === 0) {
			return NextResponse.json(
				{ error: "Data pendidikan tidak ditemukan" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			status: 200,
			message: "Data pendidikan berhasil diambil",
			data: pendidikan,
		});
	} catch (error) {
		console.error("Error fetching pendidikan:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat mengambil data pendidikan" },
			{ status: 500 }
		);
	}
}
