import { NextResponse } from "next/server";
import { select } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - Ambil semua data bank
export async function GET(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await select({
			table: "bank",
			fields: ["namabank"],
			orderBy: "namabank",
			order: "ASC",
		});

		return NextResponse.json({
			status: "success",
			data,
		});
	} catch (error) {
		console.error("Error fetching bank:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data bank" },
			{ status: 500 }
		);
	}
}
