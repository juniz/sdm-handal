import { NextResponse } from "next/server";
import { select } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - Ambil semua data status kerja
export async function GET(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await select({
			table: "stts_kerja",
			fields: ["stts", "ktg", "indek", "hakcuti"],
			orderBy: "indek",
			order: "ASC",
		});

		return NextResponse.json({
			status: "success",
			data,
		});
	} catch (error) {
		console.error("Error fetching stts_kerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data status kerja" },
			{ status: 500 }
		);
	}
}
