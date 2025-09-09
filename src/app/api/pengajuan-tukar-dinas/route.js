import { NextResponse } from "next/server";
import moment from "moment-timezone";
import "moment/locale/id";
import { select, insert, update, rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// Set locale ke Indonesia
moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

// Helper function to generate nomor pengajuan
async function generateNoPengajuan() {
	const now = moment();
	const year = now.format("YYYY");
	const month = now.format("MM");
	const day = now.format("DD");

	// Get the last sequence number for this month
	const lastPengajuan = await rawQuery(
		`SELECT no_pengajuan FROM pengajuan_tudin 
		 WHERE no_pengajuan LIKE ? 
		 ORDER BY no_pengajuan DESC LIMIT 1`,
		[`TD/${year}${month}${day}/%`]
	);

	let nextSequence = 1;
	if (lastPengajuan.length > 0) {
		const lastNo = lastPengajuan[0].no_pengajuan;
		// Parse nomor urut dari format TD/YYYYMMDD/XXX
		const parts = lastNo.split("/");
		if (parts.length === 3) {
			const lastSequence = parseInt(parts[2]);
			if (!isNaN(lastSequence)) {
				nextSequence = lastSequence + 1;
			}
		}
	}

	const sequenceStr = nextSequence.toString().padStart(3, "0");
	return `TD/${year}${month}${day}/${sequenceStr}`;
}

// GET - Ambil data pengajuan tukar dinas
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

		// Cek apakah user dari IT atau HRD
		const isITorHRD =
			userDepartment === "IT" ||
			userDepartment === "HRD" ||
			userDepartmentName?.toLowerCase().includes("it") ||
			userDepartmentName?.toLowerCase().includes("teknologi") ||
			userDepartmentName?.toLowerCase().includes("hrd") ||
			userDepartmentName?.toLowerCase().includes("human resource");

		let pengajuanData;

		if (isITorHRD) {
			// IT/HRD bisa lihat semua pengajuan
			pengajuanData = await rawQuery(`
				SELECT 
					pt.*,
					p1.nama as nama_pemohon,
					p2.nama as nama_pengganti,
					p3.nama as nama_pj
				FROM pengajuan_tudin pt
				LEFT JOIN pegawai p1 ON pt.nik = p1.nik
				LEFT JOIN pegawai p2 ON pt.nik_ganti = p2.nik
				LEFT JOIN pegawai p3 ON pt.nik_pj = p3.nik
				ORDER BY pt.tanggal DESC
			`);
		} else {
			// User biasa bisa lihat pengajuan dimana mereka adalah pemohon (nik) atau penanggung jawab (nik_pj)
			pengajuanData = await rawQuery(
				`
				SELECT 
					pt.*,
					p1.nama as nama_pemohon,
					p2.nama as nama_pengganti,
					p3.nama as nama_pj
				FROM pengajuan_tudin pt
				LEFT JOIN pegawai p1 ON pt.nik = p1.nik
				LEFT JOIN pegawai p2 ON pt.nik_ganti = p2.nik
				LEFT JOIN pegawai p3 ON pt.nik_pj = p3.nik
				WHERE pt.nik = ? OR pt.nik_pj = ?
				ORDER BY pt.tanggal DESC
			`,
				[userNik, userNik]
			);
		}

		return NextResponse.json({
			status: 200,
			message: "Data pengajuan tukar dinas berhasil diambil",
			data: pengajuanData,
		});
	} catch (error) {
		console.error("Error fetching pengajuan tukar dinas:", error);
		return NextResponse.json(
			{
				message: "Terjadi kesalahan saat mengambil data pengajuan tukar dinas",
			},
			{ status: 500 }
		);
	}
}

// POST - Buat pengajuan tukar dinas baru
export async function POST(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = user.username; // NIK dari JWT token
		const {
			tanggal,
			tgl_dinas,
			shift1,
			nik_ganti,
			tgl_ganti,
			shift2,
			nik_pj,
			keptingan,
		} = await request.json();

		// Validasi input
		const requiredFields = {
			tanggal,
			tgl_dinas,
			shift1,
			nik_ganti,
			tgl_ganti,
			shift2,
			keptingan,
		};
		for (const [field, value] of Object.entries(requiredFields)) {
			if (!value) {
				return NextResponse.json(
					{ message: `Field ${field.replace("_", " ")} harus diisi` },
					{ status: 400 }
				);
			}
		}

		// Validasi NIK tidak boleh sama
		if (userId === nik_ganti) {
			return NextResponse.json(
				{ message: "NIK pemohon dan NIK pengganti tidak boleh sama" },
				{ status: 400 }
			);
		}

		// Validasi NIK pemohon ada di database
		const pegawaiPemohon = await rawQuery(
			`SELECT nik, nama FROM pegawai WHERE nik = ?`,
			[userId]
		);

		if (pegawaiPemohon.length === 0) {
			return NextResponse.json(
				{ message: "NIK pemohon tidak ditemukan" },
				{ status: 400 }
			);
		}

		// Validasi pegawai pengganti ada
		const pegawaiGanti = await rawQuery(
			`SELECT nik, nama FROM pegawai WHERE nik = ?`,
			[nik_ganti]
		);

		if (pegawaiGanti.length === 0) {
			return NextResponse.json(
				{ message: "NIK pegawai pengganti tidak ditemukan" },
				{ status: 400 }
			);
		}

		// Validasi penanggung jawab jika ada
		if (nik_pj) {
			const pegawaiPJ = await rawQuery(
				`SELECT nik, nama FROM pegawai WHERE nik = ?`,
				[nik_pj]
			);

			if (pegawaiPJ.length === 0) {
				return NextResponse.json(
					{ message: "NIK penanggung jawab tidak ditemukan" },
					{ status: 400 }
				);
			}
		}

		// Validasi shift berdasarkan departemen pemohon
		const pegawaiDept = await rawQuery(
			`SELECT p.departemen FROM pegawai p WHERE p.nik = ?`,
			[userId]
		);

		if (pegawaiDept.length === 0) {
			return NextResponse.json(
				{ message: "Departemen pemohon tidak ditemukan" },
				{ status: 400 }
			);
		}

		const departemenId = pegawaiDept[0].departemen;

		// Validasi shift1 dan shift2 tersedia di departemen
		const validShifts = await rawQuery(
			`SELECT DISTINCT shift FROM jam_jaga WHERE dep_id = ?`,
			[departemenId]
		);

		const availableShifts = validShifts.map((s) => s.shift);

		if (!availableShifts.includes(shift1)) {
			return NextResponse.json(
				{ message: `Shift ${shift1} tidak tersedia untuk departemen Anda` },
				{ status: 400 }
			);
		}

		if (!availableShifts.includes(shift2)) {
			return NextResponse.json(
				{ message: `Shift ${shift2} tidak tersedia untuk departemen Anda` },
				{ status: 400 }
			);
		}

		// Generate nomor pengajuan
		const noPengajuan = await generateNoPengajuan();

		// Insert pengajuan baru
		const result = await insert({
			table: "pengajuan_tudin",
			data: {
				no_pengajuan: noPengajuan,
				tanggal: tanggal,
				nik: userId, // Gunakan NIK dari JWT token
				tgl_dinas: tgl_dinas,
				shift1: shift1,
				nik_ganti: nik_ganti,
				tgl_ganti: tgl_ganti,
				shift2: shift2,
				nik_pj: nik_pj || null,
				kepentingan: keptingan,
				status: "Proses Pengajuan",
			},
		});

		return NextResponse.json({
			status: 201,
			message: "Pengajuan tukar dinas berhasil disubmit",
			data: {
				id: result.insertId,
				no_pengajuan: noPengajuan,
				status: "Proses Pengajuan",
			},
		});
	} catch (error) {
		console.error("Error creating pengajuan tukar dinas:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat membuat pengajuan tukar dinas" },
			{ status: 500 }
		);
	}
}

// PUT - Update status pengajuan (untuk nik_pj yang bersangkutan)
export async function PUT(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userNik = user.username; // NIK dari JWT token
		const { id, status, alasan_ditolak } = await request.json();

		// Validasi input
		if (!id || !status) {
			return NextResponse.json(
				{ message: "ID dan status harus diisi" },
				{ status: 400 }
			);
		}

		// Ambil data pengajuan untuk validasi nik_pj
		const pengajuanData = await rawQuery(
			`SELECT nik_pj FROM pengajuan_tudin WHERE id = ?`,
			[id]
		);

		if (pengajuanData.length === 0) {
			return NextResponse.json(
				{ message: "Pengajuan tidak ditemukan" },
				{ status: 404 }
			);
		}

		const pengajuan = pengajuanData[0];

		// Validasi: hanya nik_pj yang bisa update status
		if (pengajuan.nik_pj !== userNik) {
			return NextResponse.json(
				{
					message:
						"Hanya penanggung jawab (nik_pj) yang dapat mengupdate status pengajuan ini",
				},
				{ status: 403 }
			);
		}

		// Validasi status
		const validStatus = ["Proses Pengajuan", "Disetujui", "Ditolak"];
		if (!validStatus.includes(status)) {
			return NextResponse.json(
				{ message: "Status tidak valid" },
				{ status: 400 }
			);
		}

		// Jika ditolak, alasan harus diisi
		if (status === "Ditolak" && !alasan_ditolak) {
			return NextResponse.json(
				{ message: "Alasan penolakan harus diisi" },
				{ status: 400 }
			);
		}

		// Update data
		const updateData = {
			status: status,
		};

		if (status === "Ditolak" && alasan_ditolak) {
			updateData.alasan_ditolak = alasan_ditolak;
		}

		await update({
			table: "pengajuan_tudin",
			data: updateData,
			where: { id: id },
		});

		return NextResponse.json({
			status: 200,
			message: "Status pengajuan tukar dinas berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating pengajuan tukar dinas:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate pengajuan tukar dinas" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus pengajuan tukar dinas (hanya untuk status Proses Pengajuan)
export async function DELETE(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userNik = user.username; // NIK dari JWT token
		const { no_pengajuan } = await request.json();

		// Validasi input
		if (!no_pengajuan) {
			return NextResponse.json(
				{ message: "Nomor pengajuan harus diisi" },
				{ status: 400 }
			);
		}

		// Ambil data user untuk cek department
		const userData = await rawQuery(
			`
			SELECT p.departemen, d.nama as departemen_name 
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.nik = ?
		`,
			[userNik]
		);

		if (userData.length === 0) {
			return NextResponse.json(
				{ message: "Data pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		const userDepartment = userData[0].departemen;
		const userDepartmentName = userData[0].departemen_name;

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
			`SELECT nik, status FROM pengajuan_tudin WHERE no_pengajuan = ?`,
			[no_pengajuan]
		);

		if (pengajuanData.length === 0) {
			return NextResponse.json(
				{ message: "Pengajuan tidak ditemukan" },
				{ status: 404 }
			);
		}

		const pengajuan = pengajuanData[0];

		// Validasi: hanya bisa hapus jika status Proses Pengajuan
		if (pengajuan.status !== "Proses Pengajuan") {
			return NextResponse.json(
				{
					message:
						"Hanya pengajuan dengan status Proses Pengajuan yang dapat dihapus",
				},
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
		await rawQuery(`DELETE FROM pengajuan_tudin WHERE no_pengajuan = ?`, [
			no_pengajuan,
		]);

		return NextResponse.json({
			status: 200,
			message: "Pengajuan tukar dinas berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting pengajuan tukar dinas:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus pengajuan tukar dinas" },
			{ status: 500 }
		);
	}
}
