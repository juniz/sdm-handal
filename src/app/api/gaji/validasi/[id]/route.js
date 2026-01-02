import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery } from "@/lib/db-helper";

// GET - Ambil detail validasi gaji
export async function GET(request, { params }) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;

		const result = await rawQuery(
			`
			SELECT 
				gv.*,
				gp.gaji,
				p.nik,
				p.nama,
				p.jbtn,
				p.departemen,
				d.nama as departemen_name,
				signed_by_pegawai.nama as signed_by_name
			FROM gaji_validasi gv
			LEFT JOIN gaji_pegawai gp ON gv.gaji_id = gp.id
			LEFT JOIN pegawai p ON gv.nik = p.nik
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN pegawai signed_by_pegawai ON gv.signed_by = signed_by_pegawai.nik
			WHERE gv.id = ?
		`,
			[parseInt(id)]
		);

		if (result.length === 0) {
			return NextResponse.json(
				{ message: "Data validasi tidak ditemukan" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: result[0],
		});
	} catch (error) {
		console.error("Error fetching validasi detail:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data validasi" },
			{ status: 500 }
		);
	}
}

