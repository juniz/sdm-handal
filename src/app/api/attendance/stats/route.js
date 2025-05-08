import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { rawQuery } from "@/lib/db-helper";
import moment from "moment";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request) {
	try {
		const cookieStore = cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			if (error.code === "ERR_JWT_EXPIRED") {
				return NextResponse.json(
					{ error: "Token kedaluwarsa, silakan login kembali" },
					{ status: 401 }
				);
			}
			throw error;
		}

		const idPegawai = verified.payload.id;
		const today = moment();
		const startOfWeek = today.clone().startOf("isoWeek").format("YYYY-MM-DD");
		const endOfWeek = today.clone().endOf("isoWeek").format("YYYY-MM-DD");

		// Query untuk mendapatkan status presensi mingguan
		const weeklyAttendanceQuery = `
			SELECT 
				DATE_FORMAT(jam_datang, '%a') as hari,
				status,
				keterlambatan
			FROM rekap_presensi
			WHERE id = ?
			AND jam_datang BETWEEN ? AND ?
			ORDER BY jam_datang ASC
		`;

		// Query untuk statistik presensi
		const statsQuery = `
			SELECT
				COUNT(*) as total_hari,
				SUM(CASE WHEN status = 'Tepat Waktu' THEN 1 ELSE 0 END) as tepat_waktu,
				SUM(CASE WHEN status LIKE 'Terlambat%' THEN 1 ELSE 0 END) as terlambat
			FROM rekap_presensi
			WHERE id = ?
			AND jam_datang BETWEEN ? AND ?
		`;

		// Query untuk izin/sakit
		const leaveQuery = `
			SELECT COUNT(*) as total_izin
			FROM pengajuan_izin
			WHERE nik = ?
			AND tanggal_awal BETWEEN ? AND ?
			AND status = 'Disetujui'
		`;

		const [weeklyAttendance, stats, leaves] = await Promise.all([
			rawQuery(weeklyAttendanceQuery, [
				idPegawai,
				startOfWeek + "%",
				endOfWeek + "%",
			]),
			rawQuery(statsQuery, [idPegawai, startOfWeek + "%", endOfWeek + "%"]),
			rawQuery(leaveQuery, [idPegawai, startOfWeek + "%", endOfWeek + "%"]),
		]);

		// Hitung persentase
		const totalDays = stats[0].total_hari || 0;
		const totalWorkDays = 5; // Asumsi 5 hari kerja

		const attendance = {
			total: ((totalDays / totalWorkDays) * 100).toFixed(0),
			onTime: ((stats[0].tepat_waktu / totalWorkDays) * 100).toFixed(0),
			late: ((stats[0].terlambat / totalWorkDays) * 100).toFixed(0),
			leave: ((leaves[0].total_izin / totalWorkDays) * 100).toFixed(0),
		};

		// Format data harian
		const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
		const dailyStatus = days.map((day) => {
			const dayData = weeklyAttendance.find(
				(d) => d.hari.substring(0, 3) === day
			);

			if (!dayData) return { day, status: "none" };

			let status = "none";
			if (dayData.status === "Tepat Waktu") {
				status = "hadir";
			} else if (dayData.status.includes("Terlambat")) {
				status = "terlambat";
			} else if (dayData.status === "Sakit") {
				status = "sakit";
			} else if (dayData.status === "Izin") {
				status = "izin";
			}

			return { day, status };
		});

		return NextResponse.json({
			status: 200,
			message: "Data statistik presensi berhasil diambil",
			data: {
				daily: dailyStatus,
				stats: attendance,
			},
		});
	} catch (error) {
		console.error("Error fetching attendance stats:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat mengambil data statistik" },
			{ status: 500 }
		);
	}
}
