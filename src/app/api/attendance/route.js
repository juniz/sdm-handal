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
	withTransaction,
	transactionHelpers,
} from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

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

// Fungsi untuk menyimpan file base64 ke folder uploads di root
async function saveBase64Image(base64Data, idPegawai) {
	try {
		// Validasi input
		if (!base64Data || typeof base64Data !== "string") {
			throw new Error("Data foto tidak valid atau kosong");
		}

		// Hapus header base64 jika ada
		const base64Image = base64Data.replace(/^data:image\/\w+;base64,/, "");

		// Validasi base64 string
		if (!base64Image || base64Image.length === 0) {
			throw new Error("Data base64 tidak valid");
		}

		const buffer = Buffer.from(base64Image, "base64");

		// Validasi buffer
		if (buffer.length === 0) {
			throw new Error("Buffer foto kosong");
		}

		// Buat nama file unik dengan timestamp
		const timestamp = new Date().getTime();
		const fileName = `attendance_${idPegawai}_${timestamp}.jpg`;

		// Pastikan folder uploads ada di root project
		const uploadDir = path.join(process.cwd(), "uploads", "attendance");
		try {
			await fs.access(uploadDir);
		} catch {
			await fs.mkdir(uploadDir, { recursive: true });
		}

		// Simpan file
		const filePath = path.join(uploadDir, fileName);
		await fs.writeFile(filePath, buffer);

		// Return full URL menggunakan NEXT_PUBLIC_URL
		const baseUrl = process.env.NEXT_PUBLIC_URL || "";
		return `${baseUrl}/api/uploads/attendance/${fileName}`;
	} catch (error) {
		console.error("Error saving image:", error);
		throw new Error("Gagal menyimpan foto: " + error.message);
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

	// Check environment setting untuk validasi lokasi
	const isLocationValidationEnabled =
		process.env.ENABLE_LOCATION_VALIDATION !== "false";

	return {
		isValid: isLocationValidationEnabled ? riskLevel !== "HIGH" : true, // Jika disabled, selalu valid
		riskLevel,
		issues,
		confidence: securityData.confidence || 0,
		isValidationEnabled: isLocationValidationEnabled,
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

// Fungsi helper untuk mengecek apakah shift malam masih dalam periode aktif
function isNightShiftStillActive(attendance, currentTime = null) {
	if (
		!attendance ||
		!attendance.jam_datang ||
		!attendance.jam_masuk ||
		!attendance.jam_pulang
	) {
		return false;
	}

	const current = currentTime ? moment(currentTime) : moment();
	const jamDatang = moment(attendance.jam_datang);

	// Cek apakah ini shift malam (jam_pulang < jam_masuk)
	const isNightShift = attendance.jam_pulang < attendance.jam_masuk;

	if (!isNightShift) {
		// Bukan shift malam, gunakan logika normal
		const jamPulangExpected = moment(
			jamDatang.format("YYYY-MM-DD") + " " + attendance.jam_pulang
		);
		return current.isBefore(jamPulangExpected);
	}

	// Untuk shift malam, jam pulang di hari berikutnya
	const jamPulangExpected = moment(
		jamDatang.format("YYYY-MM-DD") + " " + attendance.jam_pulang
	).add(1, "day");

	// Shift malam masih aktif jika:
	// 1. Belum melewati jam pulang keesokan harinya
	// 2. Masih dalam periode yang wajar (tidak lebih dari 24 jam)
	const maxShiftDuration = jamDatang.clone().add(24, "hours");

	return (
		current.isBefore(jamPulangExpected) && current.isBefore(maxShiftDuration)
	);
}

// OPTIMIZED: Fungsi untuk cek presensi yang belum checkout dengan perbaikan logika shift malam
async function getUnfinishedAttendance(idPegawai) {
	const today = moment().format("YYYY-MM-DD");
	const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

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
		AND (
			-- Presensi hari ini yang belum checkout
			DATE(tp.jam_datang) = ?
			OR (
				-- Shift malam dari kemarin yang mungkin masih berlangsung
				DATE(tp.jam_datang) = ?
				AND EXISTS (
					SELECT 1 FROM jam_masuk jm2 
					WHERE jm2.shift = tp.shift 
					AND TIME(jm2.jam_pulang) < TIME(jm2.jam_masuk)
				)
			)
		)
		ORDER BY tp.jam_datang DESC
		LIMIT 1
	`;

	const result = await rawQuery(query, [idPegawai, today, yesterday]);
	const attendance = result[0];

	if (!attendance) {
		return null;
	}

	// PERBAIKAN: Cek apakah shift malam masih aktif
	if (attendance.jam_pulang < attendance.jam_masuk) {
		// Ini shift malam, cek apakah masih dalam periode aktif
		if (!isNightShiftStillActive(attendance)) {
			// Shift malam sudah berakhir, tapi belum di-checkout
			// Kembalikan sebagai unfinished untuk auto-checkout
			return attendance;
		}
	}

	return attendance;
}

// Fungsi untuk mengecek apakah presensi sebelumnya sudah melewati batas waktu checkout
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
					keterangan: "Auto checkout - Overdue",
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
				keterangan: "Auto checkout - Overdue",
			};
		});

		return result;
	} catch (error) {
		console.error("Error in auto checkout:", error);
		throw error;
	}
}

// OPTIMIZED: Fungsi untuk cek attendance hari ini dengan handling shift malam yang lebih akurat
async function getTodayAttendance(idPegawai, targetDate = null) {
	const dateStr = targetDate
		? moment(targetDate).format("YYYY-MM-DD")
		: moment().format("YYYY-MM-DD");

	// Untuk menangani shift malam yang melewati tengah malam,
	// kita perlu cek presensi dari hari sebelumnya juga
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

	let result = await rawQuery(query, [
		idPegawai,
		dateStr,
		previousDateStr,
		previousDateStr,
		previousDateStr,
	]);

	// PERBAIKAN: Tidak perlu cek rekap_presensi
	// Fungsi ini untuk mengecek presensi yang masih aktif
	// rekap_presensi berisi presensi yang sudah selesai

	return result[0] || null;
}

// Fungsi untuk cek presensi pulang dari rekap_presensi dengan handling shift malam
async function getTodayCheckout(idPegawai, targetDate = null) {
	const dateStr = targetDate
		? moment(targetDate).format("YYYY-MM-DD")
		: moment().format("YYYY-MM-DD");

	// Untuk menangani shift malam yang melewati tengah malam
	const previousDateStr = moment(dateStr)
		.subtract(1, "day")
		.format("YYYY-MM-DD");

	const query = `
		SELECT *
		FROM rekap_presensi 
		WHERE id = ? 
		AND jam_pulang IS NOT NULL
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

	const result = await rawQuery(query, [
		idPegawai,
		dateStr,
		previousDateStr,
		dateStr,
	]);
	return result[0] || null;
}

// Fungsi baru untuk mengecek presensi yang sudah selesai hari ini (untuk tampilan UI)
async function getTodayCompletedAttendance(idPegawai, targetDate = null) {
	const dateStr = targetDate
		? moment(targetDate).format("YYYY-MM-DD")
		: moment().format("YYYY-MM-DD");

	const previousDateStr = moment(dateStr)
		.subtract(1, "day")
		.format("YYYY-MM-DD");

	// Cek di rekap_presensi untuk presensi yang sudah selesai
	const rekapQuery = `
		SELECT *
		FROM rekap_presensi 
		WHERE id = ? 
		AND jam_pulang IS NOT NULL
		AND (
			-- Presensi yang dimulai hari ini
			DATE(jam_datang) = ?
			OR (
				-- Shift malam dari kemarin yang pulangnya hari ini
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

	const result = await rawQuery(rekapQuery, [
		idPegawai,
		dateStr,
		previousDateStr,
		dateStr,
	]);

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

		// Debug logging
		console.log("POST attendance request:", {
			hasPhoto: !!photo,
			photoType: typeof photo,
			photoLength: photo ? photo.length : 0,
			photoStart: photo ? photo.substring(0, 50) : "N/A",
			timestamp,
			latitude,
			longitude,
			isCheckingOut,
			securityData: Object.keys(securityData),
		});

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

		// Block if high risk (hanya jika validasi lokasi diaktifkan)
		if (!securityValidation.isValid && securityValidation.isValidationEnabled) {
			return NextResponse.json(
				{
					message: "Presensi ditolak karena masalah keamanan lokasi",
					error: "SECURITY_VALIDATION_FAILED",
					details: {
						riskLevel: securityValidation.riskLevel,
						issues: securityValidation.issues,
						confidence: securityValidation.confidence,
						validationEnabled: securityValidation.isValidationEnabled,
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
				const result = await withTransaction(async (transaction) => {
					// Simpan security log untuk checkout (hanya jika diaktifkan)
					if (process.env.ENABLE_SECURITY_LOGS === "true") {
						await transactionHelpers.insert(transaction, {
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
					}

					// Insert ke rekap_presensi
					await transactionHelpers.insert(transaction, {
						table: "rekap_presensi",
						data: {
							id: idPegawai,
							shift: existingAttendance.shift,
							jam_datang: moment(existingAttendance.jam_datang).format(
								"YYYY-MM-DD HH:mm:ss"
							),
							jam_pulang: currentTime,
							durasi: durasi,
							status: existingAttendance.status,
							keterlambatan: existingAttendance.keterlambatan,
							keterangan: "-",
							photo: existingAttendance.photo,
						},
					});

					// Debug logging untuk existingAttendance
					console.log("Existing attendance data:", {
						id: existingAttendance.id,
						jam_datang: existingAttendance.jam_datang,
						jam_datang_type: typeof existingAttendance.jam_datang,
						jam_datang_value: moment(existingAttendance.jam_datang).format(
							"YYYY-MM-DD HH:mm:ss"
						),
					});

					// Validasi data sebelum delete
					if (!existingAttendance.jam_datang) {
						throw new Error(
							"jam_datang is required for delete operation but got: " +
								existingAttendance.jam_datang
						);
					}

					// Hapus dari temporary_presensi
					await transactionHelpers.delete(transaction, {
						table: "temporary_presensi",
						where: {
							id: idPegawai,
							jam_datang: moment(existingAttendance.jam_datang).format(
								"YYYY-MM-DD HH:mm:ss"
							),
						},
					});

					return {
						...existingAttendance,
						jam_pulang: currentTime,
						durasi: durasi,
					};
				});

				return NextResponse.json({
					message: "Presensi pulang berhasil dicatat",
					data: result,
					security: {
						riskLevel: securityValidation.riskLevel,
						confidence: securityValidation.confidence,
						validationEnabled: securityValidation.isValidationEnabled,
					},
				});
			} catch (error) {
				console.error("Error in checkout transaction:", error);
				return NextResponse.json(
					{ message: "Gagal menyimpan presensi pulang: " + error.message },
					{ status: 500 }
				);
			}
		} else {
			// OPTIMIZED: Cek presensi yang belum checkout terlebih dahulu
			const unfinishedAttendance = await getUnfinishedAttendance(idPegawai);

			if (unfinishedAttendance) {
				// Cek apakah presensi sudah overdue (melewati batas waktu + toleransi)
				const isOverdue = isAttendanceOverdue(
					unfinishedAttendance,
					currentTime
				);

				if (isOverdue) {
					// Auto checkout presensi yang overdue
					try {
						const autoCheckedOut = await autoCheckoutOverdueAttendance(
							unfinishedAttendance,
							currentTime
						);
						console.log(
							"Auto checkout completed for overdue attendance:",
							autoCheckedOut
						);
					} catch (error) {
						console.error("Failed to auto checkout overdue attendance:", error);
						return NextResponse.json(
							{
								message:
									"Gagal menyelesaikan presensi sebelumnya secara otomatis",
								error: "AUTO_CHECKOUT_FAILED",
								details: {
									previousAttendance: {
										jam_datang: unfinishedAttendance.jam_datang,
										shift: unfinishedAttendance.shift,
										jam_pulang_expected: unfinishedAttendance.jam_pulang,
									},
								},
							},
							{ status: 500 }
						);
					}
				} else {
					// Masih dalam batas waktu, user harus checkout manual
					const jamDatang = moment(unfinishedAttendance.jam_datang);
					const jamPulangExpected =
						moment(unfinishedAttendance.jam_datang).format("YYYY-MM-DD") +
						" " +
						unfinishedAttendance.jam_pulang;
					let expectedCheckout = moment(jamPulangExpected);

					// Jika shift melewati tengah malam
					if (
						unfinishedAttendance.jam_pulang < unfinishedAttendance.jam_masuk
					) {
						expectedCheckout.add(1, "day");
					}

					return NextResponse.json(
						{
							message: "Anda masih memiliki presensi yang belum di-checkout",
							error: "UNFINISHED_ATTENDANCE",
							details: {
								previousAttendance: {
									jam_datang: unfinishedAttendance.jam_datang,
									shift: unfinishedAttendance.shift,
									jam_pulang_expected: expectedCheckout.format(
										"YYYY-MM-DD HH:mm:ss"
									),
									time_remaining:
										expectedCheckout.diff(moment(), "minutes") + " menit lagi",
								},
							},
						},
						{ status: 400 }
					);
				}
			}

			// OPTIMIZED: Cek apakah sudah ada presensi hari ini
			const existingAttendance = await getTodayAttendance(idPegawai);
			if (existingAttendance) {
				return NextResponse.json(
					{ message: "Anda sudah melakukan presensi masuk hari ini" },
					{ status: 400 }
				);
			}

			// Upload foto dan dapatkan URL (hanya untuk check-in)
			let photoUrl = null;
			try {
				if (photo) {
					photoUrl = await saveBase64Image(photo, idPegawai);
				} else {
					return NextResponse.json(
						{ message: "Foto diperlukan untuk presensi masuk" },
						{ status: 400 }
					);
				}
			} catch (photoError) {
				console.error("Error saving photo:", photoError);
				return NextResponse.json(
					{ message: "Gagal menyimpan foto: " + photoError.message },
					{ status: 400 }
				);
			}

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

			// OPTIMIZED: Gunakan transaction untuk konsistensi data
			try {
				const result = await withTransaction(async (transaction) => {
					let securityResult = null;

					// Simpan security log (hanya jika diaktifkan)
					if (process.env.ENABLE_SECURITY_LOGS === "true") {
						securityResult = await transactionHelpers.insert(transaction, {
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
					}

					// Simpan data presensi
					const presensiResult = await transactionHelpers.insert(transaction, {
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
					// const geoResult = await transactionHelpers.insert(transaction, {
					// 	table: "geolocation_presensi",
					// 	data: {
					// 		id: idPegawai,
					// 		tanggal: moment().format("YYYY-MM-DD"),
					// 		latitude,
					// 		longitude,
					// 	},
					// });

					return {
						presensi: presensiResult,
						geolocation: true,
						security: securityResult,
						status,
						keterlambatan,
						shift_info: {
							shift: scheduleWithShift.shift_today,
							jam_masuk: scheduleWithShift.jam_masuk,
							jam_pulang: scheduleWithShift.jam_pulang,
						},
					};
				});

				return NextResponse.json({
					message: "Presensi berhasil disimpan",
					data: result,
					security: {
						riskLevel: securityValidation.riskLevel,
						confidence: securityValidation.confidence,
						issues: securityValidation.issues,
						validationEnabled: securityValidation.isValidationEnabled,
					},
				});
			} catch (error) {
				console.error("Error in checkin transaction:", error);
				return NextResponse.json(
					{ message: "Gagal menyimpan presensi masuk: " + error.message },
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

		// console.log(result);

		if (!result[0][`h${moment().format("D")}`]) {
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
