import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { rawQuery } from "@/lib/db-helper";
import moment from "moment-timezone";
import "moment/locale/id";

moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Fungsi untuk cek presensi yang belum checkout
async function getUnfinishedAttendance(idPegawai) {
	const today = moment().format("YYYY-MM-DD");

	const query = `
		SELECT 
			tp.*,
			jm.jam_masuk,
			jm.jam_pulang,
			jm.shift as shift_name
		FROM temporary_presensi tp
		LEFT JOIN jam_masuk jm ON tp.shift = jm.shift
		WHERE tp.id = ? 
		AND tp.jam_pulang IS NULL
		AND DATE(tp.jam_datang) < ?
		ORDER BY tp.jam_datang DESC
		LIMIT 1
	`;

	const result = await rawQuery(query, [idPegawai, today]);
	return result[0] || null;
}

// Fungsi untuk mengecek apakah presensi sudah overdue
function isAttendanceOverdue(attendance, currentTime) {
	if (!attendance || !attendance.jam_pulang) return false;

	const jamDatang = moment(attendance.jam_datang);
	const jamPulangExpected =
		moment(attendance.jam_datang).format("YYYY-MM-DD") +
		" " +
		attendance.jam_pulang;
	const expectedCheckout = moment(jamPulangExpected);
	const current = moment(currentTime);

	// Jika shift melewati tengah malam (jam_pulang < jam_masuk)
	if (attendance.jam_pulang < attendance.jam_masuk) {
		expectedCheckout.add(1, "day");
	}

	// Berikan toleransi 2 jam setelah jam pulang
	const overdueTime = expectedCheckout.clone().add(2, "hours");

	return current.isAfter(overdueTime);
}

// Fungsi untuk menghitung waktu tersisa
function calculateTimeRemaining(attendance, currentTime) {
	if (!attendance || !attendance.jam_pulang) return null;

	const jamDatang = moment(attendance.jam_datang);
	const jamPulangExpected =
		moment(attendance.jam_datang).format("YYYY-MM-DD") +
		" " +
		attendance.jam_pulang;
	let expectedCheckout = moment(jamPulangExpected);
	const current = moment(currentTime);

	// Jika shift melewati tengah malam
	if (attendance.jam_pulang < attendance.jam_masuk) {
		expectedCheckout.add(1, "day");
	}

	const diffMinutes = expectedCheckout.diff(current, "minutes");
	const diffHours = Math.floor(Math.abs(diffMinutes) / 60);
	const remainingMinutes = Math.abs(diffMinutes) % 60;

	return {
		total_minutes: diffMinutes,
		is_overdue: diffMinutes < 0,
		hours: diffHours,
		minutes: remainingMinutes,
		formatted:
			diffMinutes < 0
				? `Terlambat ${diffHours}j ${remainingMinutes}m`
				: `${diffHours}j ${remainingMinutes}m lagi`,
		expected_checkout: expectedCheckout.format("YYYY-MM-DD HH:mm:ss"),
	};
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
		const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");

		// Cek presensi yang belum checkout
		const unfinishedAttendance = await getUnfinishedAttendance(idPegawai);

		if (!unfinishedAttendance) {
			return NextResponse.json({
				message: "Tidak ada presensi yang belum di-checkout",
				data: null,
				has_unfinished: false,
			});
		}

		// Hitung informasi waktu
		const timeInfo = calculateTimeRemaining(unfinishedAttendance, currentTime);
		const isOverdue = isAttendanceOverdue(unfinishedAttendance, currentTime);

		// Hitung durasi kerja saat ini
		const currentDuration = moment(currentTime).diff(
			moment(unfinishedAttendance.jam_datang)
		);
		const durationFormatted = moment.utc(currentDuration).format("HH:mm:ss");

		const response = {
			message: "Data presensi yang belum di-checkout ditemukan",
			data: {
				...unfinishedAttendance,
				current_duration: durationFormatted,
				time_info: timeInfo,
				is_overdue: isOverdue,
				can_auto_checkout: isOverdue,
				status_info: {
					jam_datang_formatted: moment(unfinishedAttendance.jam_datang).format(
						"DD/MM/YYYY HH:mm:ss"
					),
					shift_info: `${unfinishedAttendance.shift} (${unfinishedAttendance.jam_masuk} - ${unfinishedAttendance.jam_pulang})`,
					work_date: moment(unfinishedAttendance.jam_datang).format(
						"DD MMMM YYYY"
					),
				},
			},
			has_unfinished: true,
		};

		return NextResponse.json(response);
	} catch (error) {
		console.error("Error getting unfinished attendance:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
