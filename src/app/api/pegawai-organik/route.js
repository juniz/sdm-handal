import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

/**
 * @route GET /api/pegawai-organik
 * @description Mengambil daftar pegawai organik (PNS dan POLRI)
 * @returns {Promise<NextResponse>} Response dengan data pegawai yang dikelompokkan
 */
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

		// Query untuk mengambil data pegawai PNS
		const pnsQuery = `
			SELECT 
				p.nik,
				p.nama,
				p.jbtn,
				d.nama AS departemen
			FROM 
				pegawai p
				LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE 
				p.stts_kerja = 'PNS'
				AND p.stts_aktif = 'AKTIF'
			ORDER BY 
				p.id ASC
		`;

		// Query untuk mengambil data pegawai POLRI
		const polriQuery = `
			SELECT 
				p.nik,
				p.nama,
				p.jbtn,
				d.nama AS departemen
			FROM 
				pegawai p
				LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE 
				p.stts_kerja = 'POL'
				AND p.stts_aktif = 'AKTIF'
			ORDER BY 
				p.id ASC
		`;

		const [pns, polri] = await Promise.all([
			rawQuery(pnsQuery),
			rawQuery(polriQuery),
		]);

		return NextResponse.json({
			status: "success",
			data: {
				pns: pns || [],
				polri: polri || [],
			},
		});
	} catch (error) {
		console.error("Error fetching pegawai organik:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil data pegawai organik",
				message: process.env.NODE_ENV === "development" ? error.message : undefined,
			},
			{ status: 500 }
		);
	}
}

