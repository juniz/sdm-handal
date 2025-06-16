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

		// Ambil data presensi hari ini dengan handling shift malam
		let todayAttendance = null;

		// Cek di temporary_presensi dengan handling shift malam
		const tempQuery = `
			SELECT *
			FROM temporary_presensi 
			WHERE id = ? 
			AND (
				DATE(jam_datang) = ? 
				OR (
					DATE(jam_datang) = ? 
					AND jam_pulang IS NULL
					AND EXISTS (
						SELECT 1 FROM jam_masuk jm 
						WHERE jm.shift = temporary_presensi.shift 
						AND TIME(jm.jam_pulang) < TIME(jm.jam_masuk)
					)
				)
			)
			ORDER BY jam_datang DESC
			LIMIT 1
		`;

		let result = await rawQuery(tempQuery, [idPegawai, today, yesterday]);
		todayAttendance = result[0];

		// Jika tidak ada di temporary_presensi, cek di rekap_presensi
		if (!todayAttendance) {
			const rekapQuery = `
				SELECT *
				FROM rekap_presensi 
				WHERE id = ? 
				AND (
					DATE(jam_datang) = ? 
					OR (
						DATE(jam_datang) = ? 
						AND EXISTS (
							SELECT 1 FROM jam_masuk jm 
							WHERE jm.shift = rekap_presensi.shift 
							AND TIME(jm.jam_pulang) < TIME(jm.jam_masuk)
							AND DATE(jam_pulang) = ?
						)
					)
				)
				ORDER BY jam_datang DESC
				LIMIT 1
			`;

			result = await rawQuery(rekapQuery, [idPegawai, today, yesterday, today]);
			todayAttendance = result[0];
		}

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
			data: todayAttendance,
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
