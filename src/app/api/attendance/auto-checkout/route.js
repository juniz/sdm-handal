import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { rawQuery, withTransaction, transactionHelpers } from "@/lib/db-helper";
import moment from "moment";

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

// Fungsi untuk auto-checkout presensi yang overdue
async function autoCheckoutOverdueAttendance(attendance, currentTime) {
	try {
		const jamDatang = moment(attendance.jam_datang);
		const jamPulangExpected =
			moment(attendance.jam_datang).format("YYYY-MM-DD") +
			" " +
			attendance.jam_pulang;
		let expectedCheckout = moment(jamPulangExpected);

		// Jika shift melewati tengah malam
		if (attendance.jam_pulang < attendance.jam_masuk) {
			expectedCheckout.add(1, "day");
		}

		// Hitung durasi sampai jam pulang yang diharapkan
		const durasiPresensi = expectedCheckout.diff(jamDatang);
		const durasi = moment.utc(durasiPresensi).format("HH:mm:ss");

		const result = await withTransaction(async (transaction) => {
			// Insert ke rekap_presensi dengan jam pulang otomatis
			await transactionHelpers.insert(transaction, {
				table: "rekap_presensi",
				data: {
					id: attendance.id,
					shift: attendance.shift,
					jam_datang: moment(attendance.jam_datang).format(
						"YYYY-MM-DD HH:mm:ss"
					),
					jam_pulang: expectedCheckout.format("YYYY-MM-DD HH:mm:ss"),
					durasi: durasi,
					status: attendance.status,
					keterlambatan: attendance.keterlambatan,
					keterangan: "Auto checkout - Manual trigger",
					photo: attendance.photo,
				},
			});

			// Hapus dari temporary_presensi
			await transactionHelpers.delete(transaction, {
				table: "temporary_presensi",
				where: {
					id: attendance.id,
					jam_datang: moment(attendance.jam_datang).format(
						"YYYY-MM-DD HH:mm:ss"
					),
				},
			});

			return {
				...attendance,
				jam_pulang: expectedCheckout.format("YYYY-MM-DD HH:mm:ss"),
				durasi: durasi,
				keterangan: "Auto checkout - Manual trigger",
			};
		});

		return result;
	} catch (error) {
		console.error("Error in auto checkout:", error);
		throw error;
	}
}

export async function POST(request) {
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
			return NextResponse.json(
				{
					message: "Tidak ada presensi yang belum di-checkout",
					error: "NO_UNFINISHED_ATTENDANCE",
				},
				{ status: 400 }
			);
		}

		// Cek apakah presensi sudah overdue
		const isOverdue = isAttendanceOverdue(unfinishedAttendance, currentTime);

		if (!isOverdue) {
			// Hitung waktu tersisa
			const jamDatang = moment(unfinishedAttendance.jam_datang);
			const jamPulangExpected =
				moment(unfinishedAttendance.jam_datang).format("YYYY-MM-DD") +
				" " +
				unfinishedAttendance.jam_pulang;
			let expectedCheckout = moment(jamPulangExpected);

			if (unfinishedAttendance.jam_pulang < unfinishedAttendance.jam_masuk) {
				expectedCheckout.add(1, "day");
			}

			const timeRemaining = expectedCheckout.diff(moment(), "minutes");

			return NextResponse.json(
				{
					message: "Presensi belum melewati batas waktu auto-checkout",
					error: "NOT_OVERDUE",
					details: {
						expected_checkout: expectedCheckout.format("YYYY-MM-DD HH:mm:ss"),
						time_remaining_minutes: timeRemaining,
						can_auto_checkout_after: expectedCheckout
							.clone()
							.add(2, "hours")
							.format("YYYY-MM-DD HH:mm:ss"),
					},
				},
				{ status: 400 }
			);
		}

		// Lakukan auto checkout
		try {
			const result = await autoCheckoutOverdueAttendance(
				unfinishedAttendance,
				currentTime
			);

			return NextResponse.json({
				message: "Auto checkout berhasil dilakukan",
				data: result,
				details: {
					original_jam_datang: unfinishedAttendance.jam_datang,
					auto_jam_pulang: result.jam_pulang,
					durasi_kerja: result.durasi,
					shift: result.shift,
					keterangan: result.keterangan,
				},
			});
		} catch (error) {
			console.error("Error in auto checkout:", error);
			return NextResponse.json(
				{
					message: "Gagal melakukan auto checkout",
					error: "AUTO_CHECKOUT_FAILED",
					details: error.message,
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in auto checkout endpoint:", error);
		return NextResponse.json(
			{ message: "Internal server error" },
			{ status: 500 }
		);
	}
}
