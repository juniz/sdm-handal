import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import moment from "moment-timezone";
import { selectFirst } from "@/lib/db-helper";

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

		// Ambil data presensi hari ini menggunakan operator LIKE
		let todayAttendance = await selectFirst({
			table: "temporary_presensi",
			where: {
				id: idPegawai,
				jam_datang: {
					operator: "LIKE",
					value: `${today}%`,
				},
			},
		});

		if (!todayAttendance) {
			const rekapPresensi = await selectFirst({
				table: "rekap_presensi",
				where: {
					id: idPegawai,
					jam_datang: {
						operator: "LIKE",
						value: `${today}%`,
					},
				},
			});

			if (rekapPresensi) {
				todayAttendance = rekapPresensi;
			}
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
			jam_pulang: jam.jam_pulang,
		});
	} catch (error) {
		console.error("Error fetching today's attendance:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data presensi" },
			{ status: 500 }
		);
	}
}
