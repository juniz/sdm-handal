import { NextResponse } from "next/server";
import { select, rawQuery } from "@/lib/db-helper";

/**
 * @route GET /api/pegawai
 * @description Mengambil daftar pegawai aktif untuk combobox
 * @query dep_id - Filter pegawai berdasarkan departemen (opsional)
 * @returns {Promise<NextResponse>} Response dengan data pegawai
 */
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const dep_id = searchParams.get("dep_id");

		let whereClause = "WHERE p.stts_aktif = 'AKTIF'";
		let params = [];

		if (dep_id) {
			whereClause += " AND p.departemen = ?";
			params.push(dep_id);
		}

		const pegawai = await rawQuery(`
			SELECT p.id, p.nik, p.nama, p.departemen, d.nama as nama_departemen
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			${whereClause}
			ORDER BY p.nik
		`, params);

		// Transform data untuk format combobox
		const transformedData = pegawai.map((row) => ({
			id: row.id,
			value: row.nik,
			label: row.nama,
			departemen: row.departemen,
			nama_departemen: row.nama_departemen,
		}));

		return NextResponse.json({
			status: "success",
			message: "Data pegawai berhasil diambil",
			data: transformedData,
		});
	} catch (error) {
		console.error("[API] Error fetching pegawai:", error);

		return NextResponse.json(
			{
				status: "error",
				message: "Gagal mengambil data pegawai",
				error:
					process.env.NODE_ENV === "development" ? error.message : undefined,
			},
			{ status: 500 }
		);
	}
}
