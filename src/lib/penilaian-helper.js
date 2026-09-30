import moment from "moment";
import { selectFirst, rawQuery } from "@/lib/db-helper";

export function mapCutiToKondisi(urgensi) {
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

export function mapIzinToKondisi(urgensi) {
	const map = {
		"Perjalanan Dinas": "izin_dinas",
		"Dinas Dalam Kota": "izin_dinas_dalam",
		"Dinas Luar Kota": "izin_dinas_luar",
		"Lain-lain": "izin_lainnya",
	};
	return map[urgensi] || "izin_lainnya";
}

export function mapAbsenStatusToKondisi(status) {
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
	return "tepat_waktu";
}

export async function getScoreForKondisi(nilaiKondisi) {
	const param = await selectFirst({
		table: "parameter_penilaian",
		where: {
			nilai_kondisi: nilaiKondisi,
			is_aktif: 1
		}
	});
	return param ? Number(param.nilai_skor) : 0;
}

export async function resolveAbsensi(pegawaiId, nikPegawai, tanggal, isTambahan = false) {
	// 1. Cek Cuti
	const cuti = await rawQuery(`
		SELECT urgensi, no_pengajuan FROM pengajuan_cuti
		WHERE nik = ? AND status = 'Disetujui'
		  AND tanggal_awal <= ? AND tanggal_akhir >= ?
		LIMIT 1
	`, [nikPegawai, tanggal, tanggal]);

	if (cuti && cuti.length > 0) {
		return {
			sumber: "cuti",
			nilai_kondisi: mapCutiToKondisi(cuti[0].urgensi),
			ref_no: cuti[0].no_pengajuan
		};
	}

	// 2. Cek Izin
	const izin = await rawQuery(`
		SELECT urgensi, no_pengajuan FROM pengajuan_izin
		WHERE nik = ? AND status = 'Disetujui'
		  AND tanggal_awal <= ? AND tanggal_akhir >= ?
		LIMIT 1
	`, [nikPegawai, tanggal, tanggal]);

	if (izin && izin.length > 0) {
		return {
			sumber: "izin",
			nilai_kondisi: mapIzinToKondisi(izin[0].urgensi),
			ref_no: izin[0].no_pengajuan
		};
	}

	// 3. Cek Absensi
	const isToday = tanggal === moment().format("YYYY-MM-DD");
	let absen = [];

	if (isToday) {
		absen = await rawQuery(`
			SELECT status FROM temporary_presensi
			WHERE id = ? AND DATE(jam_datang) = ?
			LIMIT 1
		`, [pegawaiId, tanggal]);

		if (!absen || absen.length === 0) {
			absen = await rawQuery(`
				SELECT status FROM rekap_presensi
				WHERE id = ? AND DATE(jam_datang) = ?
				LIMIT 1
			`, [pegawaiId, tanggal]);
		}
	} else {
		absen = await rawQuery(`
			SELECT status FROM rekap_presensi
			WHERE id = ? AND DATE(jam_datang) = ?
			LIMIT 1
		`, [pegawaiId, tanggal]);

		if (!absen || absen.length === 0) {
			absen = await rawQuery(`
				SELECT status FROM temporary_presensi
				WHERE id = ? AND DATE(jam_datang) = ?
				LIMIT 1
			`, [pegawaiId, tanggal]);
		}
	}

	if (absen && absen.length > 0) {
		return {
			sumber: "absensi",
			nilai_kondisi: mapAbsenStatusToKondisi(absen[0].status),
			ref_no: null
		};
	}

	if (isTambahan) {
		return {
			sumber: "absensi",
			nilai_kondisi: "tepat_waktu",
			ref_no: null
		};
	}

	return {
		sumber: "alpha",
		nilai_kondisi: "alpha",
		ref_no: null
	};
}

export function calculateSkorTotal(skorKegiatan, skorAbsensi, bobotKegiatan = 60) {
	const bobotKgt = Number(bobotKegiatan) || 60;
	const bobotAbs = 100 - bobotKgt;
	const total = (Number(skorKegiatan || 0) * bobotKgt / 100) + (Number(skorAbsensi || 0) * bobotAbs / 100);
	return Math.round(total * 100) / 100;
}
