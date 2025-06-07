import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";
import moment from "moment-timezone";
import "moment/locale/id";
import {
	select,
	selectFirst,
	insert,
	update,
	delete_,
	rawQuery,
} from "@/lib/db-helper";

// Set locale ke Indonesia dan default timezone
moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Fungsi untuk mendapatkan waktu dalam zona Asia/Jakarta
function getJakartaTime(date) {
	return moment(date).tz("Asia/Jakarta");
}

// Fungsi untuk format tanggal ke format MySQL
function formatToMySQLDateTime(date) {
	return moment(date).format("YYYY-MM-DD HH:mm:ss");
}

// Helper untuk format 2 digit
const padZero = (num) => {
	return String(num).padStart(2, "0");
};

// Fungsi helper untuk mengkonversi menit ke format HH:mm:ss
const formatMinutesToTime = (minutes) => {
	const hours = Math.floor(minutes / 60);
	const remainingMinutes = minutes % 60;
	const seconds = 0; // Karena input dalam menit, detik selalu 0

	// Format dengan leading zero
	const formattedHours = hours.toString().padStart(2, "0");
	const formattedMinutes = remainingMinutes.toString().padStart(2, "0");
	const formattedSeconds = seconds.toString().padStart(2, "0");

	return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
};

function calculateStatus(jamMasuk, currentTime) {
	// Konversi waktu ke zona Jakarta
	const jakartaTime = moment(currentTime);

	// Ambil setting keterlambatan
	const toleransi = 5; // 5 menit
	const terlambat1 = 15; // 15 menit
	const terlambat2 = 30; // 30 menit

	// Konversi jam masuk dan waktu saat ini ke menit
	const [jamMasukHour, jamMasukMinute] = jamMasuk.split(":").map(Number);
	const jamMasukInMinutes = jamMasukHour * 60 + jamMasukMinute;

	const currentInMinutes = jakartaTime.hours() * 60 + jakartaTime.minutes();

	// Hitung selisih dalam menit
	const diffInMinutes = currentInMinutes - jamMasukInMinutes;

	// Tentukan status berdasarkan selisih waktu
	if (diffInMinutes <= toleransi) {
		return { status: "Tepat Waktu", keterlambatan: "00:00:00" };
	} else if (diffInMinutes <= terlambat1) {
		return {
			status: "Terlambat Toleransi",
			keterlambatan: formatMinutesToTime(diffInMinutes),
		};
	} else if (diffInMinutes <= terlambat2) {
		return {
			status: "Terlambat I",
			keterlambatan: formatMinutesToTime(diffInMinutes),
		};
	} else {
		return {
			status: "Terlambat II",
			keterlambatan: formatMinutesToTime(diffInMinutes),
		};
	}
}

// Fungsi untuk menyimpan file base64 ke folder public
async function saveBase64Image(base64Data, idPegawai) {
	try {
		// Hapus header base64 jika ada
		const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");
		const buffer = Buffer.from(base64Image, "base64");

		// Buat nama file unik dengan timestamp
		const timestamp = new Date().getTime();
		const fileName = `attendance_${idPegawai}_${timestamp}.jpg`;

		// Pastikan folder photos ada di public
		const uploadDir = path.join(process.cwd(), "public", "photos");
		try {
			await fs.access(uploadDir);
		} catch {
			await fs.mkdir(uploadDir, { recursive: true });
		}

		// Simpan file
		const filePath = path.join(uploadDir, fileName);
		await fs.writeFile(filePath, buffer);

		// Return URL relatif untuk disimpan di database
		return process.env.NEXT_PUBLIC_URL + `/photos/${fileName}`;
	} catch (error) {
		console.error("Error saving image:", error);
		throw new Error("Gagal menyimpan foto");
	}
}

// Fungsi untuk validasi security data
function validateSecurityData(securityData, latitude, longitude) {
	const issues = [];
	let riskLevel = "LOW"; // LOW, MEDIUM, HIGH

	// Check confidence level
	if (securityData.confidence < 40) {
		issues.push("Confidence level sangat rendah");
		riskLevel = "HIGH";
	} else if (securityData.confidence < 60) {
		issues.push("Confidence level rendah");
		if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
	}

	// Check GPS accuracy
	if (securityData.accuracy > 100) {
		issues.push("GPS accuracy sangat rendah");
		riskLevel = "HIGH";
	} else if (securityData.accuracy > 50) {
		issues.push("GPS accuracy rendah");
		if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
	}

	// Check warnings
	if (securityData.warnings && securityData.warnings.length > 0) {
		securityData.warnings.forEach((warning) => {
			if (
				warning.includes("mock location") ||
				warning.includes("tidak natural")
			) {
				riskLevel = "HIGH";
			} else if (warning.includes("kecepatan") || warning.includes("akurasi")) {
				if (riskLevel !== "HIGH") riskLevel = "MEDIUM";
			}
		});
	}

	// Validate coordinates format
	const lat = parseFloat(latitude);
	const lng = parseFloat(longitude);
	if (
		isNaN(lat) ||
		isNaN(lng) ||
		lat < -90 ||
		lat > 90 ||
		lng < -180 ||
		lng > 180
	) {
		issues.push("Koordinat tidak valid");
		riskLevel = "HIGH";
	}

	return {
		isValid: riskLevel !== "HIGH",
		riskLevel,
		issues,
		confidence: securityData.confidence || 0,
	};
}

// OPTIMIZED: Fungsi untuk mendapatkan jadwal dan shift dalam satu query
async function getScheduleWithShift(idPegawai, targetDate = null) {
	const dateToCheck = targetDate || moment();
	const dayOfMonth = dateToCheck.format("D");

	const query = `
		SELECT 
			jp.id,
			jp.tahun,
			jp.bulan,
			jp.h${dayOfMonth} as shift_today,
			jm.jam_masuk,
			jm.jam_pulang
		FROM jadwal_pegawai jp
		LEFT JOIN jam_masuk jm ON jp.h${dayOfMonth} = jm.shift
		WHERE jp.id = ?
		AND jp.tahun = ?
		AND jp.bulan = ?
		LIMIT 1
	`;

	let result = await rawQuery(query, [
		idPegawai,
		dateToCheck.year(),
		padZero(dateToCheck.month() + 1),
	]);

	if (!result[0].shift_today) {
		const queryJadwalTambahan = `
			SELECT 
			jp.id,
			jp.tahun,
			jp.bulan,
			jp.h${dayOfMonth} as shift_today,
			jm.jam_masuk,
			jm.jam_pulang
		FROM jadwal_tambahan jp
		LEFT JOIN jam_masuk jm ON jp.h${dayOfMonth} = jm.shift
		WHERE jp.id = ?
		AND jp.tahun = ?
		AND jp.bulan = ?
		LIMIT 1
	`;

		result = await rawQuery(queryJadwalTambahan, [
			idPegawai,
			dateToCheck.year(),
			padZero(dateToCheck.month() + 1),
		]);
	}

	return result[0] || null;
}

// OPTIMIZED: Fungsi untuk cek attendance hari ini dengan DATE range yang efisien
async function getTodayAttendance(idPegawai, targetDate = null) {
	const dateStr = targetDate
		? moment(targetDate).format("YYYY-MM-DD")
		: moment().format("YYYY-MM-DD");

	const query = `
		SELECT *
		FROM temporary_presensi 
		WHERE id = ? 
		AND DATE(jam_datang) = ?
		LIMIT 1
	`;

	const result = await rawQuery(query, [idPegawai, dateStr]);
	return result[0] || null;
}

// Fungsi untuk cek presensi pulang dari rekap_presensi
async function getTodayCheckout(idPegawai, targetDate = null) {
	const dateStr = targetDate
		? moment(targetDate).format("YYYY-MM-DD")
		: moment().format("YYYY-MM-DD");

	const query = `
		SELECT *
		FROM rekap_presensi 
		WHERE id = ? 
		AND DATE(jam_datang) = ?
		AND jam_pulang IS NOT NULL
		LIMIT 1
	`;

	const result = await rawQuery(query, [idPegawai, dateStr]);
	return result[0] || null;
}

export async function POST(request) {
	try {
		const {
			photo,
			timestamp,
			latitude,
			longitude,
			isCheckingOut,
			securityData = {},
		} = await request.json();

		// Validasi photo hanya untuk check-in
		if (!isCheckingOut && !photo) {
			return NextResponse.json(
				{ message: "Foto diperlukan untuk presensi masuk" },
				{ status: 400 }
			);
		}
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

		// Validate security data
		const securityValidation = validateSecurityData(
			securityData,
			latitude,
			longitude
		);

		// Block if high risk
		if (!securityValidation.isValid) {
			return NextResponse.json(
				{
					message: "Presensi ditolak karena masalah keamanan lokasi",
					error: "SECURITY_VALIDATION_FAILED",
					details: {
						riskLevel: securityValidation.riskLevel,
						issues: securityValidation.issues,
						confidence: securityValidation.confidence,
					},
				},
				{ status: 403 }
			);
		}

		if (isCheckingOut) {
			// OPTIMIZED: Gunakan date range yang lebih efisien
			const existingAttendance = await getTodayAttendance(idPegawai);

			if (!existingAttendance) {
				return NextResponse.json(
					{ message: "Data presensi masuk tidak ditemukan" },
					{ status: 400 }
				);
			}

			const durasiPresensi = moment(currentTime).diff(
				existingAttendance.jam_datang
			);

			// Format durasi ke HH:mm:ss
			const durasi = moment.utc(durasiPresensi).format("HH:mm:ss");

			// OPTIMIZED: Gunakan transaction untuk konsistensi data
			try {
				// Simpan security log untuk checkout
				await insert({
					table: "security_logs",
					data: {
						id_pegawai: idPegawai,
						tanggal: moment().format("YYYY-MM-DD"),
						action_type: "CHECKOUT",
						confidence_level: securityValidation.confidence,
						risk_level: securityValidation.riskLevel,
						warnings: JSON.stringify(securityData.warnings || []),
						gps_accuracy: securityData.accuracy || null,
						latitude: latitude,
						longitude: longitude,
						created_at: currentTime,
					},
				});

				// Update temporary_presensi dengan jam pulang
				// await update({
				// 	table: "temporary_presensi",
				// 	data: {
				// 		jam_pulang: currentTime,
				// 		durasi: durasi,
				// 	},
				// 	where: {
				// 		id: idPegawai,
				// 		jam_datang: existingAttendance.jam_datang,
				// 	},
				// });

				// Insert ke rekap_presensi
				await insert({
					table: "rekap_presensi",
					data: {
						id: idPegawai,
						shift: existingAttendance.shift,
						jam_datang: existingAttendance.jam_datang,
						jam_pulang: currentTime,
						durasi: durasi,
						status: existingAttendance.status,
						keterlambatan: existingAttendance.keterlambatan,
						keterangan: "-",
						photo: existingAttendance.photo,
					},
				});

				// Hapus dari temporary_presensi
				await delete_({
					table: "temporary_presensi",
					where: {
						id: idPegawai,
						jam_datang: existingAttendance.jam_datang,
					},
				});

				return NextResponse.json({
					message: "Presensi pulang berhasil dicatat",
					data: {
						...existingAttendance,
						jam_pulang: currentTime,
						durasi: durasi,
					},
					security: {
						riskLevel: securityValidation.riskLevel,
						confidence: securityValidation.confidence,
					},
				});
			} catch (error) {
				console.error("Error in checkout transaction:", error);
				return NextResponse.json(
					{ message: "Gagal menyimpan presensi pulang" },
					{ status: 500 }
				);
			}
		} else {
			// OPTIMIZED: Cek apakah sudah ada presensi hari ini
			const existingAttendance = await getTodayAttendance(idPegawai);
			if (existingAttendance) {
				return NextResponse.json(
					{ message: "Anda sudah melakukan presensi masuk hari ini" },
					{ status: 400 }
				);
			}

			// Upload foto dan dapatkan URL (hanya untuk check-in)
			const photoUrl = await saveBase64Image(photo, idPegawai);

			// OPTIMIZED: Dapatkan jadwal dan shift dalam satu query
			const scheduleWithShift = await getScheduleWithShift(idPegawai);

			if (!scheduleWithShift || !scheduleWithShift.shift_today) {
				return NextResponse.json(
					{ message: "Tidak ada jadwal shift untuk hari ini" },
					{ status: 400 }
				);
			}

			// Convert timestamp ke format MySQL
			const mysqlTimestamp = formatToMySQLDateTime(timestamp);

			// Hitung status keterlambatan
			const { status, keterlambatan } = calculateStatus(
				scheduleWithShift.jam_masuk,
				timestamp
			);

			// OPTIMIZED: Batch insert operations untuk konsistensi
			try {
				// Simpan security log
				await insert({
					table: "security_logs",
					data: {
						id_pegawai: idPegawai,
						tanggal: moment().format("YYYY-MM-DD"),
						action_type: "CHECKIN",
						confidence_level: securityValidation.confidence,
						risk_level: securityValidation.riskLevel,
						warnings: JSON.stringify(securityData.warnings || []),
						gps_accuracy: securityData.accuracy || null,
						latitude: latitude,
						longitude: longitude,
						created_at: currentTime,
					},
				});

				// Simpan data presensi
				const presensiResult = await insert({
					table: "temporary_presensi",
					data: {
						id: idPegawai,
						shift: scheduleWithShift.shift_today,
						jam_datang: mysqlTimestamp,
						status: status,
						keterlambatan: keterlambatan,
						photo: photoUrl,
					},
				});

				// Simpan data lokasi
				const geoResult = await insert({
					table: "geolocation_presensi",
					data: {
						id: idPegawai,
						tanggal: moment().format("YYYY-MM-DD"),
						latitude,
						longitude,
					},
				});

				return NextResponse.json({
					message: "Presensi berhasil disimpan",
					data: {
						presensi: presensiResult,
						geolocation: geoResult,
						status,
						keterlambatan,
						shift_info: {
							shift: scheduleWithShift.shift_today,
							jam_masuk: scheduleWithShift.jam_masuk,
							jam_pulang: scheduleWithShift.jam_pulang,
						},
					},
					security: {
						riskLevel: securityValidation.riskLevel,
						confidence: securityValidation.confidence,
						issues: securityValidation.issues,
					},
				});
			} catch (error) {
				console.error("Error in checkin transaction:", error);
				return NextResponse.json(
					{ message: "Gagal menyimpan presensi masuk" },
					{ status: 500 }
				);
			}
		}
	} catch (error) {
		console.error("Error saving attendance:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menyimpan presensi" },
			{ status: 500 }
		);
	}
}

// OPTIMIZED: Cached schedule query untuk GET
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

		// OPTIMIZED: Simplified schedule query
		const query = `
			SELECT 
				jp.*
			FROM jadwal_pegawai jp
			WHERE jp.id = ?
			AND jp.tahun = ?
			AND jp.bulan = ?
			LIMIT 1
		`;

		let result = await rawQuery(query, [
			idPegawai,
			moment().year(),
			padZero(moment().month() + 1),
		]);

		if (!result[0].shift_today) {
			const queryJadwalTambahan = `
				SELECT 
					jt.*
				FROM jadwal_tambahan jt
				WHERE jt.id = ?
				AND jt.tahun = ?
				AND jt.bulan = ?
				LIMIT 1
			`;

			result = await rawQuery(queryJadwalTambahan, [
				idPegawai,
				moment().year(),
				padZero(moment().month() + 1),
			]);
		}

		return NextResponse.json({
			status: 200,
			message: "Data jadwal berhasil diambil",
			data: result,
		});
	} catch (error) {
		console.error("Error fetching schedule:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil jadwal" },
			{ status: 500 }
		);
	}
}
