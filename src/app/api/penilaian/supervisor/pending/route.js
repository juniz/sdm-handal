import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			return NextResponse.json({ error: "Unauthorized / Session Expired" }, { status: 401 });
		}

		const loggedInUser = verified.payload;
		const supervisorId = loggedInUser.id;

		// Fetch pending list for this supervisor
		const pendingList = await rawQuery(`
			SELECT 
				ph.id AS id, 
				ph.tanggal, 
				ph.skor_total, 
				ph.skor_kegiatan, 
				ph.skor_absensi, 
				ph.shift_jadwal, 
				ph.nilai_kondisi,
				ph.sumber_absensi,
				ph.status, 
				p.id AS pegawai_id, 
				p.nik, 
				p.nama, 
				p.departemen
			FROM penilaian_harian ph
			JOIN pegawai p ON ph.pegawai_id = p.id
			JOIN supervisor_mapping sm
			  ON (
			    (sm.tipe_relasi = 'personal' AND sm.pegawai_id = p.id)
			    OR
			    (sm.tipe_relasi = 'unit' AND (
			       (sm.tipe_unit = 'departemen' AND p.departemen = sm.kode_unit) OR
			       (sm.tipe_unit = 'bidang' AND p.bidang = sm.kode_unit)
			    ))
			  )
			WHERE sm.supervisor_id = ?
			  AND sm.is_aktif = 1
			  AND sm.berlaku_mulai <= CURDATE()
			  AND (sm.berlaku_sampai IS NULL OR sm.berlaku_sampai >= CURDATE())
			  AND p.stts_aktif = 'AKTIF'
			  AND p.id != sm.supervisor_id
			  AND ph.status = 'submitted'
			ORDER BY ph.tanggal DESC
		`, [supervisorId]);

		return NextResponse.json({
			success: true,
			data: pendingList
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/supervisor/pending:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
