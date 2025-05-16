import { NextResponse } from "next/server";
import { select } from "@/lib/db-helper";

/**
 * @route GET /api/pegawai
 * @description Mengambil daftar pegawai aktif untuk combobox
 * @returns {Promise<NextResponse>} Response dengan data pegawai
 */
export async function GET() {
	try {
		const pegawai = await select({
			table: "pegawai",
			fields: ["nik", "nama"],
			where: {
				stts_aktif: "AKTIF",
			},
			orderBy: "nik",
		});

		// Transform data untuk format combobox
		const transformedData = pegawai.map((row) => ({
			value: row.nik,
			label: row.nama,
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
