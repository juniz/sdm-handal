import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import moment from "moment";
import { selectFirst, rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper check authorization
async function isAuthorizedForEmployee(loggedInUser, targetEmployeeId) {
	if (Number(loggedInUser.id) === Number(targetEmployeeId)) return true;
	if (loggedInUser.departemen?.toUpperCase() === "IT") return true;

	const personalMapping = await selectFirst({
		table: "supervisor_mapping",
		where: {
			supervisor_id: loggedInUser.id,
			pegawai_id: targetEmployeeId,
			tipe_relasi: "personal",
			is_aktif: 1
		}
	});
	if (personalMapping) return true;

	const target = await selectFirst({
		table: "pegawai",
		where: { id: targetEmployeeId },
		select: ["departemen", "bidang"]
	});

	if (target) {
		const unitMapping = await rawQuery(`
			SELECT id FROM supervisor_mapping
			WHERE supervisor_id = ?
			  AND tipe_relasi = 'unit'
			  AND is_aktif = 1
			  AND (
			    (tipe_unit = 'departemen' AND kode_unit = ?) OR
			    (tipe_unit = 'bidang' AND kode_unit = ?)
			  )
			LIMIT 1
		`, [loggedInUser.id, target.departemen, target.bidang]);

		if (unitMapping && unitMapping.length > 0) return true;
	}

	return false;
}

function mapCutiToKondisi(urgensi) {
	const map = {
		"Sakit": "sakit",
		"Tahunan": "cuti_tahunan",
		"Melahirkan": "cuti_melahirkan",
		"Ibadah Keagamaan": "cuti_ibadah",
		"Istimewa": "cuti_istimewa",
		"Karena Alasan Penting": "cuti_penting",
		"Di luar tanggungan negara": "cuti_luar_tanggungan",
		"Tahunan ke luar negeri": "cuti_luar_negeri",
		"Keterangan Lainnya": "cuti_lainnya",
	};
	return map[urgensi] || "cuti_lainnya";
}

function mapIzinToKondisi(urgensi) {
	const map = {
		"Perjalanan Dinas": "izin_dinas",
		"Dinas Dalam Kota": "izin_dinas_dalam",
		"Dinas Luar Kota": "izin_dinas_luar",
		"Lain-lain": "izin_lainnya",
	};
	return map[urgensi] || "izin_lainnya";
}

function mapAbsenStatusToKondisi(status) {
	const lower = (status || "").toLowerCase().trim();
	if (lower.includes("toleransi") || lower.includes("terlambat_ringan")) {
		return "terlambat_ringan";
	}
	if (lower.includes("terlambat i") || lower.includes("terlambat_sedang") || lower === "terlambat 1" || lower === "terlambat i") {
		return "terlambat_sedang";
	}
	if (lower.includes("terlambat ii") || lower.includes("terlambat_berat") || lower === "terlambat 2" || lower === "terlambat ii") {
		return "terlambat_berat";
	}
	if (lower.includes("hadir") || lower.includes("tepat") || lower === "tepat_waktu") {
		return "tepat_waktu";
	}
	if (lower.includes("alpha")) {
		return "alpha";
	}
	return "tepat_waktu"; // default fallback jika ada record presensi
}

async function getScoreForKondisi(nilaiKondisi) {
	const param = await selectFirst({
		table: "parameter_penilaian",
		where: {
			nilai_kondisi: nilaiKondisi,
			is_aktif: 1
		}
	});
	return param ? Number(param.nilai_skor) : 0;
}

export async function GET(request) {
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

		const { searchParams } = new URL(request.url);
		const pegawaiId = searchParams.get("pegawai_id") || loggedInUser.id;
		const tanggal = searchParams.get("tanggal"); // format: YYYY-MM-DD

		if (!tanggal) {
			return NextResponse.json({ error: "Tanggal diperlukan" }, { status: 400 });
		}

		// Block future dates
		const inputDate = new Date(tanggal);
		const today = new Date();
		today.setHours(23, 59, 59, 999); // allow today
		if (inputDate > today) {
			return NextResponse.json({ error: "Tidak dapat resolusi tanggal masa depan" }, { status: 400 });
		}

		// Auth gate
		const isAuthorized = await isAuthorizedForEmployee(loggedInUser, pegawaiId);
		if (!isAuthorized) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		// Get NIK
		const pegawai = await selectFirst({
			table: "pegawai",
			where: { id: pegawaiId },
			select: ["nik"]
		});

		if (!pegawai) {
			return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
		}

		const nikPegawai = pegawai.nik;

		// 1. Cek Cuti
		const cuti = await rawQuery(`
			SELECT urgensi, no_pengajuan FROM pengajuan_cuti
			WHERE nik = ? AND status = 'Disetujui'
			  AND tanggal_awal <= ? AND tanggal_akhir >= ?
			LIMIT 1
		`, [nikPegawai, tanggal, tanggal]);

		if (cuti && cuti.length > 0) {
			const kondisi = mapCutiToKondisi(cuti[0].urgensi);
			const skor = await getScoreForKondisi(kondisi);
			return NextResponse.json({
				success: true,
				sumber: "cuti",
				nilai_kondisi: kondisi,
				skor_absensi: skor,
				ref_no: cuti[0].no_pengajuan
			});
		}

		// 2. Cek Izin
		const izin = await rawQuery(`
			SELECT urgensi, no_pengajuan FROM pengajuan_izin
			WHERE nik = ? AND status = 'Disetujui'
			  AND tanggal_awal <= ? AND tanggal_akhir >= ?
			LIMIT 1
		`, [nikPegawai, tanggal, tanggal]);

		if (izin && izin.length > 0) {
			const kondisi = mapIzinToKondisi(izin[0].urgensi);
			const skor = await getScoreForKondisi(kondisi);
			return NextResponse.json({
				success: true,
				sumber: "izin",
				nilai_kondisi: kondisi,
				skor_absensi: skor,
				ref_no: izin[0].no_pengajuan
			});
		}

		// 3. Cek Absensi Existing (temporary_presensi atau rekap_presensi)
		const isToday = tanggal === moment().format("YYYY-MM-DD");
		let absen = [];

		if (isToday) {
			absen = await rawQuery(`
				SELECT status, jam_datang FROM temporary_presensi
				WHERE id = ? AND DATE(jam_datang) = ?
				LIMIT 1
			`, [pegawaiId, tanggal]);

			if (!absen || absen.length === 0) {
				absen = await rawQuery(`
					SELECT status, jam_datang FROM rekap_presensi
					WHERE id = ? AND DATE(jam_datang) = ?
					LIMIT 1
				`, [pegawaiId, tanggal]);
			}
		} else {
			absen = await rawQuery(`
				SELECT status, jam_datang FROM rekap_presensi
				WHERE id = ? AND DATE(jam_datang) = ?
				LIMIT 1
			`, [pegawaiId, tanggal]);

			if (!absen || absen.length === 0) {
				absen = await rawQuery(`
					SELECT status, jam_datang FROM temporary_presensi
					WHERE id = ? AND DATE(jam_datang) = ?
					LIMIT 1
				`, [pegawaiId, tanggal]);
			}
		}

		if (absen && absen.length > 0) {
			const kondisi = mapAbsenStatusToKondisi(absen[0].status);
			const skor = await getScoreForKondisi(kondisi);
			return NextResponse.json({
				success: true,
				sumber: "absensi",
				nilai_kondisi: kondisi,
				skor_absensi: skor,
				ref_no: null
			});
		}

		// 4. Default Fallback
		const fallbackKondisi = "alpha";
		const fallbackSkor = await getScoreForKondisi(fallbackKondisi);
		return NextResponse.json({
			success: true,
			sumber: "alpha",
			nilai_kondisi: fallbackKondisi,
			skor_absensi: fallbackSkor,
			ref_no: null
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/absensi-status:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
