import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - Ambil semua alokasi pegawai
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
		const id_unit = searchParams.get("id_unit");

		let whereClause = "WHERE 1=1";
		let params = [];

		if (id_unit) {
			whereClause += " AND pp.id_unit = ?";
			params.push(id_unit);
		}

		const data = await rawQuery(`
			SELECT 
				pp.*,
				p.nik,
				p.nama as nama_pegawai,
				p.mulai_kontrak,
				pu.presentase_dari_kategori,
				pk.presentase_dari_total,
				pk.nama_kategori,
				d.nama as nama_departemen,
				-- Kalkulasi presentase efektif dari total
				ROUND(
					pk.presentase_dari_total * 
					pu.presentase_dari_kategori * 
					pp.presentase_dari_unit / 10000, 
					4
				) as presentase_dari_total_efektif
			FROM presentase_pegawai pp
			JOIN pegawai p ON pp.id_pegawai = p.id
			JOIN presentase_unit pu ON pp.id_unit = pu.id_unit
			JOIN presentase_kategori pk ON pu.id_kategori = pk.id_kategori
			JOIN departemen d ON pu.dep_id = d.dep_id
			${whereClause}
			ORDER BY pk.nama_kategori, d.nama, p.mulai_kontrak ASC
		`, params);

		return NextResponse.json({
			status: "success",
			data
		});
	} catch (error) {
		console.error("Error fetching presentase pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data alokasi pegawai" },
			{ status: 500 }
		);
	}
}

// POST - Tambah alokasi pegawai baru
export async function POST(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id_unit, id_pegawai, presentase_dari_unit } = await request.json();

		// Validasi input
		if (!id_unit || !id_pegawai || presentase_dari_unit === undefined) {
			return NextResponse.json(
				{ message: "Unit, pegawai dan presentase harus diisi" },
				{ status: 400 }
			);
		}

		const presentaseNum = parseFloat(presentase_dari_unit);
		if (presentaseNum < 0 || presentaseNum > 100) {
			return NextResponse.json(
				{ message: "Presentase harus antara 0 dan 100" },
				{ status: 400 }
			);
		}

		// Cek apakah pegawai sudah punya alokasi aktif di unit ini
		const existing = await rawQuery(`
			SELECT id_alokasi FROM presentase_pegawai 
			WHERE id_unit = ? AND id_pegawai = ? 
		`, [id_unit, id_pegawai]);

		if (existing.length > 0) {
			return NextResponse.json(
				{ message: "Pegawai ini sudah memiliki alokasi aktif di unit tersebut" },
				{ status: 400 }
			);
		}

		// Cek total presentase dalam unit tidak melebihi 100%
		const existingTotal = await rawQuery(`
			SELECT COALESCE(SUM(presentase_dari_unit), 0) as total
			FROM presentase_pegawai
			WHERE id_unit = ?
		`, [id_unit]);
		
		const currentTotal = parseFloat(existingTotal[0]?.total || 0);
		if (currentTotal + presentaseNum > 100) {
			return NextResponse.json(
				{ 
					message: `Total presentase dalam unit melebihi 100%. Sisa yang tersedia: ${(100 - currentTotal).toFixed(2)}%` 
				},
				{ status: 400 }
			);
		}

		// Insert data
		const result = await rawQuery(`
			INSERT INTO presentase_pegawai (id_unit, id_pegawai, presentase_dari_unit)
			VALUES (?, ?, ?)
		`, [id_unit, id_pegawai, presentaseNum]);

		return NextResponse.json({
			status: "success",
			message: "Alokasi pegawai berhasil ditambahkan",
			data: { id_alokasi: result.insertId }
		});
	} catch (error) {
		console.error("Error creating presentase pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat membuat alokasi pegawai" },
			{ status: 500 }
		);
	}
}

// PUT - Update alokasi pegawai
export async function PUT(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id_alokasi, presentase_dari_unit } = await request.json();

		if (!id_alokasi) {
			return NextResponse.json(
				{ message: "ID alokasi harus diisi" },
				{ status: 400 }
			);
		}

		const presentaseNum = parseFloat(presentase_dari_unit);
		if (presentaseNum < 0 || presentaseNum > 100) {
			return NextResponse.json(
				{ message: "Presentase harus antara 0 dan 100" },
				{ status: 400 }
			);
		}

		// Get current alokasi data
		const currentAlokasi = await rawQuery(`
			SELECT id_unit FROM presentase_pegawai WHERE id_alokasi = ?
		`, [id_alokasi]);

		if (currentAlokasi.length === 0) {
			return NextResponse.json(
				{ message: "Alokasi tidak ditemukan" },
				{ status: 404 }
			);
		}

		// Cek total presentase dalam unit tidak melebihi 100% (exclude current alokasi)
		const existingTotal = await rawQuery(`
			SELECT COALESCE(SUM(presentase_dari_unit), 0) as total
			FROM presentase_pegawai
			WHERE id_unit = ? AND id_alokasi != ?
		`, [currentAlokasi[0].id_unit, id_alokasi]);
		
		const currentTotal = parseFloat(existingTotal[0]?.total || 0);
		if (currentTotal + presentaseNum > 100) {
			return NextResponse.json(
				{ 
					message: `Total presentase dalam unit melebihi 100%. Sisa yang tersedia: ${(100 - currentTotal).toFixed(2)}%` 
				},
				{ status: 400 }
			);
		}

		await rawQuery(`
			UPDATE presentase_pegawai 
			SET presentase_dari_unit = ?
			WHERE id_alokasi = ?
		`, [presentaseNum, id_alokasi]);

		return NextResponse.json({
			status: "success",
			message: "Alokasi pegawai berhasil diupdate"
		});
	} catch (error) {
		console.error("Error updating presentase pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate alokasi pegawai" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus alokasi pegawai
export async function DELETE(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { id_alokasi } = await request.json();

		if (!id_alokasi) {
			return NextResponse.json(
				{ message: "ID alokasi harus diisi" },
				{ status: 400 }
			);
		}

		await rawQuery(`
			DELETE FROM presentase_pegawai WHERE id_alokasi = ?
		`, [id_alokasi]);

		return NextResponse.json({
			status: "success",
			message: "Alokasi pegawai berhasil dihapus"
		});
	} catch (error) {
		console.error("Error deleting presentase pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus alokasi pegawai" },
			{ status: 500 }
		);
	}
}

