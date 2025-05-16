import { NextResponse } from "next/server";
import { insert, rawQuery, selectFirst, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";
import { differenceInDays, format } from "date-fns";

/**
 * @route GET /api/cuti
 * @description Mengambil daftar pengajuan cuti dengan pagination
 */
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{ status: "error", message: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Parse URL params
		const { searchParams } = new URL(request.url);
		const startDate = searchParams.get("start_date");
		const endDate = searchParams.get("end_date");
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");
		const offset = (page - 1) * limit;

		const pegawai = await selectFirst({
			table: "pegawai",
			where: {
				id: user.id,
			},
			columns: ["nik", "nama"],
		});

		// Buat query base untuk total data
		let countQuery = `
			SELECT COUNT(*) as total
			FROM pengajuan_cuti c
			WHERE c.nik = ?
		`;

		const queryParams = [pegawai.nik];

		// Tambahkan filter tanggal ke query params
		if (startDate) {
			countQuery += ` AND c.tanggal >= ?`;
			queryParams.push(startDate);
		}
		if (endDate) {
			countQuery += ` AND c.tanggal <= ?`;
			queryParams.push(endDate);
		}

		// Eksekusi query total
		const [totalResult] = await rawQuery(countQuery, queryParams);
		const total = totalResult.total;
		const totalPages = Math.ceil(total / limit);

		// Buat query untuk data dengan pagination
		let dataQuery = `
			SELECT 
				c.*,
				p1.nama as nama_pegawai,
				p2.nama as nama_pj
			FROM pengajuan_cuti c
			LEFT JOIN pegawai p1 ON c.nik = p1.nik
			LEFT JOIN pegawai p2 ON c.nik_pj = p2.nik
			WHERE c.nik = ?
		`;

		const dataQueryParams = [...queryParams];

		if (startDate) {
			dataQuery += ` AND c.tanggal >= ?`;
		}
		if (endDate) {
			dataQuery += ` AND c.tanggal <= ?`;
		}

		// Tambahkan ordering dan limit
		dataQuery += ` ORDER BY c.tanggal DESC LIMIT ? OFFSET ?`;
		dataQueryParams.push(limit, offset);

		const cuti = await rawQuery(dataQuery, dataQueryParams);

		return NextResponse.json({
			status: "success",
			message: "Data pengajuan cuti berhasil diambil",
			data: cuti,
			meta: {
				total,
				totalPages,
				currentPage: page,
				perPage: limit,
				from: offset + 1,
				to: Math.min(offset + limit, total),
			},
		});
	} catch (error) {
		console.error("[API] Error fetching cuti:", error);
		return NextResponse.json(
			{
				status: "error",
				message: "Gagal mengambil data pengajuan cuti",
				error: process.env.NODE_ENV === "development" ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

/**
 * @route POST /api/cuti
 * @description Menyimpan pengajuan cuti baru
 */
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{ status: "error", message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const {
			tanggal_awal,
			tanggal_akhir,
			urgensi,
			kepentingan,
			alamat,
			nik_pj,
		} = body;

		// Generate no_pengajuan
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, "0");

		// Get last number
		const lastCuti = await rawQuery(
			"SELECT no_pengajuan FROM pengajuan_cuti WHERE YEAR(tanggal) = ? ORDER BY no_pengajuan DESC LIMIT 1",
			[year]
		);

		let sequence = 1;
		if (lastCuti.length > 0) {
			const lastNumber = parseInt(lastCuti[0].no_pengajuan.slice(-3));
			sequence = lastNumber + 1;
		}

		const no_pengajuan = `PC${year}${month}${String(sequence).padStart(
			3,
			"0"
		)}`;

		// Hitung jumlah hari
		const startDate = new Date(tanggal_awal);
		const endDate = new Date(tanggal_akhir);
		const jumlah = differenceInDays(endDate, startDate) + 1;

		// Validasi data
		if (!tanggal_awal || !tanggal_akhir) {
			throw new Error("Tanggal awal dan akhir wajib diisi");
		}
		if (!kepentingan) {
			throw new Error("Kepentingan wajib diisi");
		}
		if (!alamat) {
			throw new Error("Alamat selama cuti wajib diisi");
		}
		if (!nik_pj) {
			throw new Error("Penanggung jawab wajib dipilih");
		}
		if (jumlah < 1) {
			throw new Error(
				"Tanggal akhir harus lebih besar atau sama dengan tanggal awal"
			);
		}

		const pegawai = await selectFirst({
			table: "pegawai",
			where: {
				id: user.id,
			},
			columns: ["nik", "nama"],
		});

		const data = {
			no_pengajuan,
			tanggal: format(today, "yyyy-MM-dd"),
			tanggal_awal,
			tanggal_akhir,
			nik: pegawai.nik,
			urgensi,
			kepentingan,
			alamat,
			jumlah,
			nik_pj,
			status: "Proses Pengajuan",
		};

		await insert({
			table: "pengajuan_cuti",
			data,
		});

		return NextResponse.json({
			status: "success",
			message: "Pengajuan cuti berhasil disimpan",
			data: {
				no_pengajuan,
			},
		});
	} catch (error) {
		console.error("[API] Error saving cuti:", error);
		return NextResponse.json(
			{
				status: "error",
				message: error.message || "Gagal menyimpan pengajuan cuti",
				error: process.env.NODE_ENV === "development" ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

/**
 * @route DELETE /api/cuti
 * @description Menghapus pengajuan cuti yang belum disetujui
 */
export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{ status: "error", message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const noPengajuan = searchParams.get("no_pengajuan");

		if (!noPengajuan) {
			return NextResponse.json(
				{ status: "error", message: "No pengajuan tidak ditemukan" },
				{ status: 400 }
			);
		}

		// Cek apakah pengajuan cuti milik user yang login
		const pegawai = await selectFirst({
			table: "pegawai",
			where: {
				id: user.id,
			},
			columns: ["nik"],
		});

		// Cek status pengajuan
		const cuti = await selectFirst({
			table: "pengajuan_cuti",
			where: {
				no_pengajuan: noPengajuan,
				nik: pegawai.nik,
			},
		});

		if (!cuti) {
			return NextResponse.json(
				{ status: "error", message: "Pengajuan cuti tidak ditemukan" },
				{ status: 404 }
			);
		}

		if (cuti.status === "Disetujui") {
			return NextResponse.json(
				{
					status: "error",
					message: "Pengajuan cuti yang sudah disetujui tidak dapat dihapus",
				},
				{ status: 400 }
			);
		}

		await delete_({
			table: "pengajuan_cuti",
			where: {
				no_pengajuan: noPengajuan,
				nik: pegawai.nik,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Pengajuan cuti berhasil dihapus",
		});
	} catch (error) {
		console.error("[API] Error deleting cuti:", error);
		return NextResponse.json(
			{
				status: "error",
				message: "Gagal menghapus pengajuan cuti",
				error: process.env.NODE_ENV === "development" ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
