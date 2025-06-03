import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - Ambil daftar pegawai IT
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

		// Validasi user adalah bagian dari departemen IT
		if (user.departemen !== "IT") {
			return NextResponse.json(
				{
					status: "error",
					error: "Akses ditolak - Hanya untuk departemen IT",
				},
				{ status: 403 }
			);
		}

		// Query untuk mengambil daftar pegawai IT
		const itEmployees = await rawQuery(`
			SELECT
                p.nik,
                p.nama,
                d.nama AS departemen_name,
                COUNT(t.ticket_id) AS active_tickets
            FROM
                pegawai p
                LEFT JOIN departemen d ON p.departemen = d.dep_id
                LEFT JOIN assignments_ticket ta ON p.nik = ta.assigned_to AND ta.released_date IS NULL
                LEFT JOIN tickets t ON ta.ticket_id = t.ticket_id
                    AND t.current_status_id NOT IN(
                        SELECT
                            status_id FROM statuses_ticket
                    WHERE
                        status_name IN('Resolved', 'Closed'))
                WHERE
                    d.dep_id = 'IT'
                    AND p.stts_aktif = 'AKTIF'
                GROUP BY
                    p.nik, p.nama, d.nama
                ORDER BY
                    p.nama ASC
		`);

		return NextResponse.json({
			status: "success",
			data: itEmployees,
		});
	} catch (error) {
		console.error("Error fetching IT employees:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil data pegawai IT",
			},
			{ status: 500 }
		);
	}
}
