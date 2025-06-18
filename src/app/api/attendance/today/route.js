import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import moment from "moment-timezone";
import { selectFirst, rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

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
		console.log("pegawai " + idPegawai ?? "tidak ada");
		const today = moment().format("YYYY-MM-DD");
		const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

		// PERBAIKAN: Hanya cari presensi AKTIF (yang belum checkout)
		// Tidak perlu cek rekap_presensi karena itu untuk presensi yang sudah selesai
		let todayAttendance = null;

		// Cek di temporary_presensi dengan logika yang lebih tepat
		const tempQuery = `
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

		let result = await rawQuery(tempQuery, [
			idPegawai,
			today,
			yesterday,
			yesterday,
			yesterday,
		]);
		todayAttendance = result[0];

		// PERBAIKAN: Tidak perlu cek rekap_presensi
		// rekap_presensi berisi presensi yang sudah selesai, tidak relevan untuk "today attendance"
		// API ini seharusnya hanya mengembalikan presensi yang masih aktif

		const jam = await selectFirst({
			table: "jam_masuk",
			where: {
				shift: {
					operator: "=",
					value: todayAttendance?.shift,
				},
			},
			fields: ["jam_pulang"],
		});

		return NextResponse.json({
			status: 200,
			message: "Data presensi hari ini berhasil diambil",
			data: todayAttendance, // null jika tidak ada presensi aktif
			jam_pulang: jam?.jam_pulang,
		});
	} catch (error) {
		console.error("Error fetching today's attendance:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data presensi" },
			{ status: 500 }
		);
	}
}
