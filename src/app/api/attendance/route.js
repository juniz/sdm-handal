import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import fs from "fs/promises";
import path from "path";
import moment from "moment-timezone";
import "moment/locale/id";
import { select, selectFirst, insert, update, delete_ } from "@/lib/db-helper";

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
		return { status: "Tepat Waktu", keterlambatan: "0" };
	} else if (diffInMinutes <= terlambat1) {
		return {
			status: "Terlambat Toleransi",
			keterlambatan: diffInMinutes.toString(),
		};
	} else if (diffInMinutes <= terlambat2) {
		return {
			status: "Terlambat I",
			keterlambatan: diffInMinutes.toString(),
		};
	} else {
		return {
			status: "Terlambat II",
			keterlambatan: diffInMinutes.toString(),
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

export async function POST(request) {
	try {
		const {
			photo,
			timestamp,
			latitude,
			longitude,
			isCheckingOut,
		} = await request.json();
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

		if (isCheckingOut) {
			// Update data presensi yang sudah ada dengan jam pulang
			const today = moment().format("YYYY-MM-DD");
			const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");

			const existingAttendance = await selectFirst({
				table: "temporary_presensi",
				where: {
					id: idPegawai,
					jam_datang: {
						operator: "LIKE",
						value: `${today}%`,
					},
				},
			});

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

			// Update data presensi dengan jam pulang
			const updateResult = await update({
				table: "temporary_presensi",
				data: {
					jam_pulang: currentTime,
					durasi: durasi,
				},
				where: {
					id: idPegawai,
					jam_datang: {
						operator: "LIKE",
						value: `${today}%`,
					},
				},
			});

			const insertRekapPresensi = await insert({
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

			if (!insertRekapPresensi) {
				return NextResponse.json(
					{ message: "Gagal menyimpan rekap presensi" },
					{ status: 400 }
				);
			}

			const hapusTemporaryPresensi = await delete_({
				table: "temporary_presensi",
				where: {
					id: idPegawai,
					jam_datang: {
						operator: "LIKE",
						value: `${today}%`,
					},
				},
			});

			return NextResponse.json({
				message: "Presensi pulang berhasil dicatat",
				data: {
					...existingAttendance,
					jam_pulang: currentTime,
					photo_pulang: existingAttendance.photo,
				},
			});
		} else {
			// Upload foto dan dapatkan URL
			const photoUrl = await saveBase64Image(photo, idPegawai);

			// Dapatkan jadwal shift dan jam masuk menggunakan helper
			const schedule = await selectFirst({
				table: "jadwal_pegawai",
				where: {
					id: idPegawai,
					tahun: moment().year(),
					bulan: padZero(moment().month() + 1),
				},
			});

			const shift = await selectFirst({
				table: "jam_masuk",
				where: {
					shift: schedule[`h${moment().format("D")}`],
				},
			});

			if (!schedule) {
				return NextResponse.json(
					{ message: "Tidak ada jadwal shift untuk hari ini" },
					{ status: 400 }
				);
			}

			// Convert timestamp ke format MySQL
			const mysqlTimestamp = formatToMySQLDateTime(timestamp);

			// Hitung status keterlambatan
			const { status, keterlambatan } = calculateStatus(
				shift["jam_masuk"],
				timestamp
			);

			// Simpan data presensi menggunakan helper
			const presensiResult = await insert({
				table: "temporary_presensi",
				data: {
					id: idPegawai,
					shift: schedule[`h${moment().format("D")}`],
					jam_datang: mysqlTimestamp,
					status: status,
					keterlambatan: keterlambatan,
					photo: photoUrl,
				},
			});

			// Simpan data lokasi menggunakan helper
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
				},
			});
		}
	} catch (error) {
		console.error("Error saving attendance:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menyimpan presensi" },
			{ status: 500 }
		);
	}
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

		const result = await select({
			table: "jadwal_pegawai",
			where: {
				id: idPegawai,
				tahun: moment().year(),
				bulan: padZero(moment().month() + 1),
			},
		});

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
