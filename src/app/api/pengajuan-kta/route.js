import { NextResponse } from "next/server";
import moment from "moment-timezone";
import "moment/locale/id";
import { select, insert, update, rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";
import { generateUniqueNoPengajuan } from "@/lib/pengajuan-kta-helper";

// Set locale ke Indonesia
moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

// GET - Ambil data pengajuan KTA
export async function GET(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = user.username;

		// Ambil data user untuk cek department
		const userData = await rawQuery(
			`
			SELECT p.departemen, d.nama as departemen_name, p.nik 
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.nik = ?
		`,
			[userId]
		);

		if (userData.length === 0) {
			return NextResponse.json(
				{ message: "Data pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		const userDepartment = userData[0].departemen;
		const userDepartmentName = userData[0].departemen_name;
		const userNik = userData[0].nik;

		// Cek apakah user dari IT atau HRD (bisa berdasarkan ID atau nama)
		const isITorHRD =
			userDepartment === "IT" ||
			userDepartment === "HRD" ||
			userDepartmentName?.toLowerCase().includes("it") ||
			userDepartmentName?.toLowerCase().includes("teknologi") ||
			userDepartmentName?.toLowerCase().includes("hrd") ||
			userDepartmentName?.toLowerCase().includes("human resource");

		let pengajuanData;

		if (isITorHRD) {
			// IT/HRD bisa lihat semua pengajuan (untuk keperluan admin/processing)
			// dan juga bisa mengajukan KTA untuk diri sendiri
			pengajuanData = await rawQuery(`
				SELECT pk.*, p.nama, p.jbtn, p.departemen 
				FROM pengajuan_kta pk
				LEFT JOIN pegawai p ON pk.nik = p.nik
				ORDER BY pk.created_at DESC
			`);
		} else {
			// User biasa hanya bisa lihat pengajuan sendiri
			pengajuanData = await rawQuery(
				`
				SELECT pk.*, p.nama, p.jbtn, p.departemen 
				FROM pengajuan_kta pk
				LEFT JOIN pegawai p ON pk.nik = p.nik
				WHERE pk.nik = ?
				ORDER BY pk.created_at DESC
			`,
				[userNik]
			);
		}

		return NextResponse.json({
			status: 200,
			message: "Data pengajuan KTA berhasil diambil",
			data: pengajuanData,
		});
	} catch (error) {
		console.error("Error fetching pengajuan KTA:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data pengajuan KTA" },
			{ status: 500 }
		);
	}
}

// POST - Buat pengajuan KTA baru (Semua user termasuk IT/HRD bisa mengajukan)
export async function POST(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = user.id;
		const { jenis, alasan } = await request.json();

		// Validasi input
		if (!jenis || !alasan) {
			return NextResponse.json(
				{ message: "Jenis dan alasan pengajuan harus diisi" },
				{ status: 400 }
			);
		}

		// Validasi jenis KTA
		const validJenis = ["Baru", "Ganti", "Hilang"];
		if (!validJenis.includes(jenis)) {
			return NextResponse.json(
				{ message: "Jenis pengajuan tidak valid" },
				{ status: 400 }
			);
		}

		// Ambil data pegawai
		const pegawaiData = await rawQuery(
			`
			SELECT nik, nama, jbtn, departemen 
			FROM pegawai 
			WHERE id = ?
		`,
			[userId]
		);

		if (pegawaiData.length === 0) {
			return NextResponse.json(
				{ message: "Data pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		const userNik = pegawaiData[0].nik;

		// Cek apakah ada pengajuan yang masih pending/dalam proses untuk user ini
		const existingPengajuan = await rawQuery(
			`
			SELECT id FROM pengajuan_kta 
			WHERE nik = ? AND status IN ('pending', 'disetujui', 'proses')
			LIMIT 1
		`,
			[userNik]
		);

		if (existingPengajuan.length > 0) {
			return NextResponse.json(
				{ message: "Anda masih memiliki pengajuan KTA yang sedang diproses" },
				{ status: 400 }
			);
		}

		// Generate nomor pengajuan unik
		const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");
		const noPengajuan = await generateUniqueNoPengajuan(new Date());

		// Insert pengajuan baru
		const result = await insert({
			table: "pengajuan_kta",
			data: {
				no_pengajuan: noPengajuan,
				nik: userNik, // Menggunakan NIK sesuai struktur tabel
				jenis: jenis,
				alasan: alasan,
				status: "pending",
				created_at: currentTime,
				updated_at: currentTime,
			},
		});

		return NextResponse.json({
			status: 201,
			message: "Pengajuan KTA berhasil disubmit",
			data: {
				id: result.insertId,
				no_pengajuan: noPengajuan,
				nik: userNik,
				jenis: jenis,
				alasan: alasan,
				status: "pending",
				created_at: currentTime,
			},
		});
	} catch (error) {
		console.error("Error creating pengajuan KTA:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat membuat pengajuan KTA" },
			{ status: 500 }
		);
	}
}

// PUT - Update status pengajuan (untuk IT/HRD)
export async function PUT(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = user.id;

		// Ambil data user untuk cek department
		const userData = await rawQuery(
			`
			SELECT p.departemen, d.nama as departemen_name 
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.id = ?
		`,
			[userId]
		);

		if (userData.length === 0) {
			return NextResponse.json(
				{ message: "Data pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		const userDepartment = userData[0].departemen;
		const userDepartmentName = userData[0].departemen_name;

		// Cek apakah user dari IT atau HRD (bisa berdasarkan ID atau nama)
		const isITorHRD =
			userDepartment === "IT" ||
			userDepartment === "HRD" ||
			userDepartmentName?.toLowerCase().includes("it") ||
			userDepartmentName?.toLowerCase().includes("teknologi") ||
			userDepartmentName?.toLowerCase().includes("hrd") ||
			userDepartmentName?.toLowerCase().includes("human resource");

		// Hanya IT/HRD yang bisa update status
		if (!isITorHRD) {
			return NextResponse.json(
				{ message: "Tidak memiliki akses untuk mengupdate status" },
				{ status: 403 }
			);
		}

		const { id, status, alasan_ditolak } = await request.json();

		// Validasi input
		if (!id || !status) {
			return NextResponse.json(
				{ message: "ID dan status harus diisi" },
				{ status: 400 }
			);
		}

		// Validasi status
		const validStatus = [
			"pending",
			"disetujui",
			"ditolak",
			"proses",
			"selesai",
		];
		if (!validStatus.includes(status)) {
			return NextResponse.json(
				{ message: "Status tidak valid" },
				{ status: 400 }
			);
		}

		// Jika ditolak, alasan harus diisi
		if (status === "ditolak" && !alasan_ditolak) {
			return NextResponse.json(
				{ message: "Alasan penolakan harus diisi" },
				{ status: 400 }
			);
		}

		// Update data
		const updateData = {
			status: status,
			updated_at: moment().format("YYYY-MM-DD HH:mm:ss"),
		};

		if (status === "ditolak" && alasan_ditolak) {
			updateData.alasan_ditolak = alasan_ditolak;
		}

		await update({
			table: "pengajuan_kta",
			data: updateData,
			where: { id: id },
		});

		return NextResponse.json({
			status: 200,
			message: "Status pengajuan KTA berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating pengajuan KTA:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate pengajuan KTA" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus pengajuan KTA (hanya untuk status pending)
export async function DELETE(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = user.id;
		const { id } = await request.json();

		// Validasi input
		if (!id) {
			return NextResponse.json(
				{ message: "ID pengajuan harus diisi" },
				{ status: 400 }
			);
		}

		// Ambil data user untuk cek department dan NIK
		const userData = await rawQuery(
			`
			SELECT p.departemen, d.nama as departemen_name, p.nik 
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.id = ?
		`,
			[userId]
		);

		if (userData.length === 0) {
			return NextResponse.json(
				{ message: "Data pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		const userDepartment = userData[0].departemen;
		const userDepartmentName = userData[0].departemen_name;
		const userNik = userData[0].nik;

		// Cek apakah user dari IT atau HRD
		const isITorHRD =
			userDepartment === "IT" ||
			userDepartment === "HRD" ||
			userDepartmentName?.toLowerCase().includes("it") ||
			userDepartmentName?.toLowerCase().includes("teknologi") ||
			userDepartmentName?.toLowerCase().includes("hrd") ||
			userDepartmentName?.toLowerCase().includes("human resource");

		// Ambil data pengajuan untuk validasi
		const pengajuanData = await rawQuery(
			`
			SELECT nik, status FROM pengajuan_kta 
			WHERE id = ?
		`,
			[id]
		);

		if (pengajuanData.length === 0) {
			return NextResponse.json(
				{ message: "Pengajuan tidak ditemukan" },
				{ status: 404 }
			);
		}

		const pengajuan = pengajuanData[0];

		// Validasi: hanya bisa hapus jika status pending
		if (pengajuan.status !== "pending") {
			return NextResponse.json(
				{ message: "Hanya pengajuan dengan status pending yang dapat dihapus" },
				{ status: 400 }
			);
		}

		// Validasi: user hanya bisa hapus pengajuan sendiri, kecuali IT/HRD
		if (!isITorHRD && pengajuan.nik !== userNik) {
			return NextResponse.json(
				{ message: "Anda hanya dapat menghapus pengajuan sendiri" },
				{ status: 403 }
			);
		}

		// Hapus pengajuan
		await rawQuery(
			`
			DELETE FROM pengajuan_kta 
			WHERE id = ?
		`,
			[id]
		);

		return NextResponse.json({
			status: 200,
			message: "Pengajuan KTA berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting pengajuan KTA:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus pengajuan KTA" },
			{ status: 500 }
		);
	}
}
