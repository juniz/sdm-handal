import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		// Ambil NIK terakhir yang memiliki prefix TKK
		const result = await rawQuery(
			"SELECT nik FROM pegawai WHERE nik LIKE 'TKK%' ORDER BY nik DESC LIMIT 1"
		);

		let nextNik = "TKK0000001"; // Default jika belum ada data

		if (result.length > 0) {
			const lastNik = result[0].nik;
			// Ambil bagian angka dari NIK (7 digit terakhir)
			const numericPartStr = lastNik.substring(3);
			const numericPart = parseInt(numericPartStr, 10);
			
			if (!isNaN(numericPart)) {
				const nextNumericPart = numericPart + 1;
				// Format kembali menjadi TKK + 7 digit angka dengan padding nol
				nextNik = "TKK" + String(nextNumericPart).padStart(7, "0");
			}
		}

		return NextResponse.json({
			status: "success",
			data: { nextNik },
		});
	} catch (error) {
		console.error("Error generating next NIK:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat meng-generate NIK" },
			{ status: 500 }
		);
	}
}
