import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { rawQuery } from "@/lib/db-helper";
import moment from "moment";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Fungsi untuk cek attendance AKTIF hari ini (hanya yang belum checkout)
// PERBAIKAN: Gunakan logika yang sama dengan /api/attendance/today
async function getTodayAttendance(idPegawai, targetDate = null) {
	const dateStr = targetDate
		? moment(targetDate).format("YYYY-MM-DD")
		: moment().format("YYYY-MM-DD");

	// Untuk menangani shift malam yang melewati tengah malam
	const previousDateStr = moment(dateStr)
		.subtract(1, "day")
		.format("YYYY-MM-DD");

	// PERBAIKAN UTAMA: Hanya cari presensi AKTIF (yang belum checkout)
	// Tidak perlu cek rekap_presensi karena itu untuk presensi yang sudah selesai
	const query = `
		SELECT *
		FROM temporary_presensi 
		WHERE id = ? 
		AND jam_pulang IS NULL
		AND (
			-- Presensi hari ini (shift normal atau shift malam yang dimulai hari ini)
			DATE(jam_datang) = ?
			OR (
				-- Shift malam dari kemarin yang masih berlangsung
				DATE(jam_datang) = ? 
				AND EXISTS (
					SELECT 1 FROM jam_masuk jm 
					WHERE jm.shift = temporary_presensi.shift 
					AND TIME(jm.jam_pulang) < TIME(jm.jam_masuk)
				)
				-- PERBAIKAN: Pastikan shift malam ini masih dalam periode aktif
				AND (
					CONCAT(?, ' ', (
						SELECT jam_pulang FROM jam_masuk 
						WHERE shift = temporary_presensi.shift
					)) > NOW()
					OR 
					CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' ', (
						SELECT jam_pulang FROM jam_masuk 
						WHERE shift = temporary_presensi.shift
					)) > NOW()
				)
			)
		)
		ORDER BY jam_datang DESC
		LIMIT 1
	`;

	const result = await rawQuery(query, [
		idPegawai,
		dateStr,
		previousDateStr,
		previousDateStr,
		previousDateStr,
	]);

	return result[0] || null;
}

// Fungsi untuk cek presensi pulang dari rekap_presensi dengan handling shift malam
async function getTodayCheckout(idPegawai, targetDate = null) {
	const dateStr = targetDate
		? moment(targetDate).format("YYYY-MM-DD")
		: moment().format("YYYY-MM-DD");

	// PERBAIKAN: Hanya cek presensi yang benar-benar relevan untuk hari ini
	// Tidak termasuk shift malam dari kemarin yang sudah selesai
	const sql = `
		SELECT *
		FROM rekap_presensi 
		WHERE id = ? 
		AND jam_pulang IS NOT NULL
		AND (
			-- HANYA presensi yang dimulai hari ini dan sudah selesai hari ini juga
			(DATE(jam_datang) = ? AND DATE(jam_pulang) = ?)
		)
		ORDER BY jam_datang DESC
		LIMIT 1
	`;

	const result = await rawQuery(sql, [idPegawai, dateStr, dateStr]);

	return result[0] || null;
}

export async function GET(request) {
	try {
		const cookieStore = cookies();
		const token = await cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const verified = await jwtVerify(
			token,
			new TextEncoder().encode(JWT_SECRET)
		);
		const idPegawai = verified.payload.id;

		// Cek presensi masuk hari ini
		const todayAttendance = await getTodayAttendance(idPegawai);

		// Cek presensi pulang hari ini
		const todayCheckout = await getTodayCheckout(idPegawai);

		const status = {
			hasCheckedIn: !!todayAttendance,
			hasCheckedOut: !!todayCheckout,
			attendance: todayAttendance,
			checkout: todayCheckout,
			isCompleted: !!todayCheckout, // Jika ada di rekap_presensi berarti sudah selesai
		};

		return NextResponse.json({
			message: "Status presensi berhasil diambil",
			data: status,
		});
	} catch (error) {
		console.error("Error getting attendance status:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
