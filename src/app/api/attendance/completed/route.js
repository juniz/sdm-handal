import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import moment from "moment-timezone";
import { rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Fungsi untuk mengecek presensi yang sudah selesai hari ini
async function getTodayCompletedAttendance(idPegawai, targetDate = null) {
	const dateStr = targetDate
		? moment(targetDate).format("YYYY-MM-DD")
		: moment().format("YYYY-MM-DD");

	// PERBAIKAN: Hanya cek presensi yang benar-benar relevan untuk hari ini
	// Tidak termasuk shift malam dari kemarin yang sudah selesai

	const rekapQuery = `
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

	const result = await rawQuery(rekapQuery, [idPegawai, dateStr, dateStr]);

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

		// Ambil presensi yang sudah selesai hari ini
		const completedAttendance = await getTodayCompletedAttendance(idPegawai);

		return NextResponse.json({
			status: 200,
			message: "Data presensi selesai berhasil diambil",
			data: completedAttendance, // null jika tidak ada
		});
	} catch (error) {
		console.error("Error fetching completed attendance:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data presensi selesai" },
			{ status: 500 }
		);
	}
}
