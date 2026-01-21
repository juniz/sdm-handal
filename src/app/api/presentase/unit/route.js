import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - Ambil semua unit presentase
export async function GET(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const id_kategori = searchParams.get("id_kategori");

		let whereClause = "";
		let params = [];

		if (id_kategori) {
			whereClause = "WHERE pu.id_kategori = ?";
			params.push(id_kategori);
		}

		const data = await rawQuery(`
			SELECT 
				pu.*,
				pk.nama_kategori,
				pk.presentase_dari_total,
				d.nama as nama_departemen,
				COALESCE(SUM(pp.presentase_dari_unit), 0) as total_pegawai_presentase,
				COUNT(DISTINCT pp.id_pegawai) as jumlah_pegawai,
				-- Kalkulasi nominal dari presentase
				ROUND(pk.presentase_dari_total * pu.presentase_dari_kategori / 100, 4) as presentase_dari_total_efektif
			FROM presentase_unit pu
			JOIN presentase_kategori pk ON pu.id_kategori = pk.id_kategori
			JOIN departemen d ON pu.dep_id = d.dep_id
			LEFT JOIN presentase_pegawai pp ON pu.id_unit = pp.id_unit 
				AND (pp.berlaku_selesai IS NULL OR pp.berlaku_selesai >= CURDATE())
			${whereClause}
			GROUP BY pu.id_unit
			ORDER BY pk.nama_kategori, d.nama
		`, params);

		return NextResponse.json({
			status: "success",
			data
		});
	} catch (error) {
		console.error("Error fetching presentase unit:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data unit" },
			{ status: 500 }
		);
	}
}

// POST - Tambah unit baru
export async function POST(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id_kategori, dep_id, presentase_dari_kategori, keterangan } = await request.json();

		// Validasi input
		if (!id_kategori || !dep_id || presentase_dari_kategori === undefined) {
			return NextResponse.json(
				{ message: "Kategori, departemen, dan presentase harus diisi" },
				{ status: 400 }
			);
		}

		const presentaseNum = parseFloat(presentase_dari_kategori);
		if (presentaseNum < 0 || presentaseNum > 100) {
			return NextResponse.json(
				{ message: "Presentase harus antara 0 dan 100" },
				{ status: 400 }
			);
		}

		// Cek apakah kombinasi kategori-departemen sudah ada
		const existing = await rawQuery(`
			SELECT id_unit FROM presentase_unit 
			WHERE id_kategori = ? AND dep_id = ?
		`, [id_kategori, dep_id]);

		if (existing.length > 0) {
			return NextResponse.json(
				{ message: "Departemen ini sudah ada di kategori tersebut" },
				{ status: 400 }
			);
		}

		// Cek total presentase dalam kategori tidak melebihi 100%
		const existingTotal = await rawQuery(`
			SELECT COALESCE(SUM(presentase_dari_kategori), 0) as total
			FROM presentase_unit
			WHERE id_kategori = ?
		`, [id_kategori]);
		
		const currentTotal = parseFloat(existingTotal[0]?.total || 0);
		if (currentTotal + presentaseNum > 100) {
			return NextResponse.json(
				{ 
					message: `Total presentase dalam kategori melebihi 100%. Sisa yang tersedia: ${(100 - currentTotal).toFixed(2)}%` 
				},
				{ status: 400 }
			);
		}

		// Insert data
		const result = await rawQuery(`
			INSERT INTO presentase_unit (id_kategori, dep_id, presentase_dari_kategori, keterangan)
			VALUES (?, ?, ?, ?)
		`, [id_kategori, dep_id, presentaseNum, keterangan || null]);

		return NextResponse.json({
			status: "success",
			message: "Unit berhasil ditambahkan",
			data: { id_unit: result.insertId }
		});
	} catch (error) {
		console.error("Error creating presentase unit:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat membuat unit" },
			{ status: 500 }
		);
	}
}

// PUT - Update unit
export async function PUT(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id_unit, presentase_dari_kategori, keterangan } = await request.json();

		if (!id_unit) {
			return NextResponse.json(
				{ message: "ID unit harus diisi" },
				{ status: 400 }
			);
		}

		const presentaseNum = parseFloat(presentase_dari_kategori);
		if (presentaseNum < 0 || presentaseNum > 100) {
			return NextResponse.json(
				{ message: "Presentase harus antara 0 dan 100" },
				{ status: 400 }
			);
		}

		// Get current unit data
		const currentUnit = await rawQuery(`
			SELECT id_kategori FROM presentase_unit WHERE id_unit = ?
		`, [id_unit]);

		if (currentUnit.length === 0) {
			return NextResponse.json(
				{ message: "Unit tidak ditemukan" },
				{ status: 404 }
			);
		}

		// Cek total presentase dalam kategori tidak melebihi 100% (exclude current unit)
		const existingTotal = await rawQuery(`
			SELECT COALESCE(SUM(presentase_dari_kategori), 0) as total
			FROM presentase_unit
			WHERE id_kategori = ? AND id_unit != ?
		`, [currentUnit[0].id_kategori, id_unit]);
		
		const currentTotal = parseFloat(existingTotal[0]?.total || 0);
		if (currentTotal + presentaseNum > 100) {
			return NextResponse.json(
				{ 
					message: `Total presentase dalam kategori melebihi 100%. Sisa yang tersedia: ${(100 - currentTotal).toFixed(2)}%` 
				},
				{ status: 400 }
			);
		}

		await rawQuery(`
			UPDATE presentase_unit 
			SET presentase_dari_kategori = ?, keterangan = ?
			WHERE id_unit = ?
		`, [presentaseNum, keterangan || null, id_unit]);

		return NextResponse.json({
			status: "success",
			message: "Unit berhasil diupdate"
		});
	} catch (error) {
		console.error("Error updating presentase unit:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate unit" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus unit
export async function DELETE(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id_unit } = await request.json();

		if (!id_unit) {
			return NextResponse.json(
				{ message: "ID unit harus diisi" },
				{ status: 400 }
			);
		}

		await rawQuery(`
			DELETE FROM presentase_unit WHERE id_unit = ?
		`, [id_unit]);

		return NextResponse.json({
			status: "success",
			message: "Unit berhasil dihapus"
		});
	} catch (error) {
		console.error("Error deleting presentase unit:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus unit" },
			{ status: 500 }
		);
	}
}

