import { NextResponse } from "next/server";
import { insert, rawQuery, selectFirst, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";
import { differenceInDays, format } from "date-fns";

/**
 * @route GET /api/izin
 * @description Mengambil daftar pengajuan izin dengan pagination
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
			FROM pengajuan_izin i
			WHERE i.nik = ?
		`;

		const queryParams = [pegawai.nik];

		// Tambahkan filter tanggal ke query params
		if (startDate) {
			countQuery += ` AND i.tanggal_awal >= ?`;
			queryParams.push(startDate);
		}
		if (endDate) {
			countQuery += ` AND i.tanggal_akhir <= ?`;
			queryParams.push(endDate);
		}

		// Eksekusi query total
		const [totalResult] = await rawQuery(countQuery, queryParams);
		const total = totalResult.total;
		const totalPages = Math.ceil(total / limit);

		// Buat query untuk data dengan pagination
		let dataQuery = `
			SELECT 
				i.*,
				p1.nama as nama_pegawai,
				p2.nama as nama_pj
			FROM pengajuan_izin i
			LEFT JOIN pegawai p1 ON i.nik = p1.nik
			LEFT JOIN pegawai p2 ON i.nik_pj = p2.nik
			WHERE i.nik = ?
		`;

		const dataQueryParams = [...queryParams];

		if (startDate) {
			dataQuery += ` AND i.tanggal >= ?`;
		}
		if (endDate) {
			dataQuery += ` AND i.tanggal <= ?`;
		}

		// Tambahkan ordering dan limit
		dataQuery += ` ORDER BY i.tanggal DESC LIMIT ? OFFSET ?`;
		dataQueryParams.push(limit, offset);

		const izin = await rawQuery(dataQuery, dataQueryParams);

		return NextResponse.json({
			status: "success",
			message: "Data pengajuan izin berhasil diambil",
			data: izin,
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
		console.error("[API] Error fetching izin:", error);
		return NextResponse.json(
			{
				status: "error",
				message: "Gagal mengambil data pengajuan izin",
				error: process.env.NODE_ENV === "development" ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

/**
 * @route POST /api/izin
 * @description Menyimpan pengajuan izin baru
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
		const { tanggal_awal, tanggal_akhir, urgensi, kepentingan, nik_pj } = body;

		// Generate no_pengajuan
		const today = new Date(
			new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
		);
		const day = String(today.getDate()).padStart(2, "0");
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, "0");

		// Get last number
		const lastIzin = await rawQuery(
			"SELECT no_pengajuan FROM pengajuan_izin WHERE YEAR(tanggal) = ? ORDER BY no_pengajuan DESC LIMIT 1",
			[year]
		);

		let sequence = 1;
		if (lastIzin.length > 0) {
			const lastNumber = parseInt(lastIzin[0].no_pengajuan.slice(-3));
			sequence = lastNumber + 1;
		}

		const no_pengajuan = `PI${year}${month}${day}${String(sequence).padStart(
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
			jumlah,
			nik_pj,
			status: "Proses Pengajuan",
		};

		await insert({
			table: "pengajuan_izin",
			data,
		});

		return NextResponse.json({
			status: "success",
			message: "Pengajuan izin berhasil disimpan",
			data: {
				no_pengajuan,
			},
		});
	} catch (error) {
		console.error("[API] Error saving izin:", error);
		return NextResponse.json(
			{
				status: "error",
				message: error.message || "Gagal menyimpan pengajuan izin",
				error: process.env.NODE_ENV === "development" ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}

/**
 * @route DELETE /api/izin
 * @description Menghapus pengajuan izin yang belum disetujui
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

		// Cek apakah pengajuan izin milik user yang login
		const pegawai = await selectFirst({
			table: "pegawai",
			where: {
				id: user.id,
			},
			columns: ["nik"],
		});

		// Cek status pengajuan
		const izin = await selectFirst({
			table: "pengajuan_izin",
			where: {
				no_pengajuan: noPengajuan,
				nik: pegawai.nik,
			},
		});

		if (!izin) {
			return NextResponse.json(
				{ status: "error", message: "Pengajuan izin tidak ditemukan" },
				{ status: 404 }
			);
		}

		if (izin.status === "Disetujui") {
			return NextResponse.json(
				{
					status: "error",
					message: "Tidak dapat menghapus pengajuan yang sudah disetujui",
				},
				{ status: 400 }
			);
		}

		// Hapus pengajuan
		await delete_({
			table: "pengajuan_izin",
			where: {
				no_pengajuan: noPengajuan,
				nik: pegawai.nik,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Pengajuan izin berhasil dihapus",
		});
	} catch (error) {
		console.error("[API] Error deleting izin:", error);
		return NextResponse.json(
			{
				status: "error",
				message: "Gagal menghapus pengajuan izin",
				error: process.env.NODE_ENV === "development" ? error.stack : undefined,
			},
			{ status: 500 }
		);
	}
}
