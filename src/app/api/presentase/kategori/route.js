import { NextResponse } from "next/server";
import { rawQuery, insert, update, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - Ambil semua kategori presentase
export async function GET(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await rawQuery(`
			SELECT 
				pk.*,
				COALESCE(SUM(pu.presentase_dari_kategori), 0) as total_unit_presentase,
				COUNT(pu.id_unit) as jumlah_unit
			FROM presentase_kategori pk
			LEFT JOIN presentase_unit pu ON pk.id_kategori = pu.id_kategori
			GROUP BY pk.id_kategori
			ORDER BY pk.nama_kategori
		`);

		// Hitung total presentase dari semua kategori
		const totalPresentase = await rawQuery(`
			SELECT COALESCE(SUM(presentase_dari_total), 0) as total
			FROM presentase_kategori
		`);

		return NextResponse.json({
			status: "success",
			data,
			summary: {
				total_presentase: parseFloat(totalPresentase[0]?.total || 0),
				sisa_presentase: 100 - parseFloat(totalPresentase[0]?.total || 0),
			},
		});
	} catch (error) {
		console.error("Error fetching presentase kategori:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data kategori" },
			{ status: 500 }
		);
	}
}

// POST - Tambah kategori baru
export async function POST(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const {
			nama_kategori,
			presentase_dari_total,
			keterangan,
		} = await request.json();

		// Validasi input
		if (!nama_kategori || presentase_dari_total === undefined) {
			return NextResponse.json(
				{ message: "Nama kategori dan presentase harus diisi" },
				{ status: 400 }
			);
		}

		const presentaseNum = parseFloat(presentase_dari_total);
		if (presentaseNum < 0 || presentaseNum > 100) {
			return NextResponse.json(
				{ message: "Presentase harus antara 0 dan 100" },
				{ status: 400 }
			);
		}

		// Cek total presentase tidak melebihi 100%
		const existingTotal = await rawQuery(`
			SELECT COALESCE(SUM(presentase_dari_total), 0) as total
			FROM presentase_kategori
		`);

		const currentTotal = parseFloat(existingTotal[0]?.total || 0);
		if (currentTotal + presentaseNum > 100) {
			return NextResponse.json(
				{
					message: `Total presentase melebihi 100%. Sisa yang tersedia: ${(
						100 - currentTotal
					).toFixed(2)}%`,
				},
				{ status: 400 }
			);
		}

		// Insert data
		const result = await rawQuery(
			`
			INSERT INTO presentase_kategori (nama_kategori, presentase_dari_total, keterangan)
			VALUES (?, ?, ?)
		`,
			[nama_kategori, presentaseNum, keterangan || null]
		);

		return NextResponse.json({
			status: "success",
			message: "Kategori berhasil ditambahkan",
			data: { id_kategori: result.insertId },
		});
	} catch (error) {
		console.error("Error creating presentase kategori:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat membuat kategori" },
			{ status: 500 }
		);
	}
}

// PUT - Update kategori
export async function PUT(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const {
			id_kategori,
			nama_kategori,
			presentase_dari_total,
			keterangan,
		} = await request.json();

		if (!id_kategori) {
			return NextResponse.json(
				{ message: "ID kategori harus diisi" },
				{ status: 400 }
			);
		}

		const presentaseNum = parseFloat(presentase_dari_total);
		if (presentaseNum < 0 || presentaseNum > 100) {
			return NextResponse.json(
				{ message: "Presentase harus antara 0 dan 100" },
				{ status: 400 }
			);
		}

		// Cek total presentase tidak melebihi 100% (exclude current kategori)
		const existingTotal = await rawQuery(
			`
			SELECT COALESCE(SUM(presentase_dari_total), 0) as total
			FROM presentase_kategori
			WHERE id_kategori != ?
		`,
			[id_kategori]
		);

		const currentTotal = parseFloat(existingTotal[0]?.total || 0);
		if (currentTotal + presentaseNum > 100) {
			return NextResponse.json(
				{
					message: `Total presentase melebihi 100%. Sisa yang tersedia: ${(
						100 - currentTotal
					).toFixed(2)}%`,
				},
				{ status: 400 }
			);
		}

		await rawQuery(
			`
			UPDATE presentase_kategori 
			SET nama_kategori = ?, presentase_dari_total = ?, keterangan = ?
			WHERE id_kategori = ?
		`,
			[nama_kategori, presentaseNum, keterangan || null, id_kategori]
		);

		return NextResponse.json({
			status: "success",
			message: "Kategori berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating presentase kategori:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate kategori" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus kategori
export async function DELETE(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { id_kategori } = await request.json();

		if (!id_kategori) {
			return NextResponse.json(
				{ message: "ID kategori harus diisi" },
				{ status: 400 }
			);
		}

		await rawQuery(
			`
			DELETE FROM presentase_kategori WHERE id_kategori = ?
		`,
			[id_kategori]
		);

		return NextResponse.json({
			status: "success",
			message: "Kategori berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting presentase kategori:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus kategori" },
			{ status: 500 }
		);
	}
}
