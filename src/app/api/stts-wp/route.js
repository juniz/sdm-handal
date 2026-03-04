import { NextResponse } from "next/server";
import { select } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - Ambil semua data status wajib pajak
export async function GET(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await select({
			table: "stts_wp",
			fields: ["stts", "ktg"],
			orderBy: "stts",
			order: "ASC",
		});

		return NextResponse.json({
			status: "success",
			data,
		});
	} catch (error) {
		console.error("Error fetching stts_wp:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data status wajib pajak" },
			{ status: 500 }
		);
	}
}
