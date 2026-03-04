import { NextResponse } from "next/server";
import { select, insert, update, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - List kelompok_jabatan
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await select({
			table: "kelompok_jabatan",
			fields: ["kode_kelompok", "nama_kelompok", "indek"],
			orderBy: "indek",
			order: "ASC",
		});

		return NextResponse.json({ status: "success", data });
	} catch (error) {
		console.error("Error fetching kelompok_jabatan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data kelompok jabatan" },
			{ status: 500 }
		);
	}
}

// POST - Tambah kelompok_jabatan
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { kode_kelompok, nama_kelompok, indek } = await request.json();

		if (!kode_kelompok) {
			return NextResponse.json(
				{ message: "Kode kelompok harus diisi" },
				{ status: 400 }
			);
		}

		await insert({
			table: "kelompok_jabatan",
			data: {
				kode_kelompok,
				nama_kelompok: nama_kelompok || null,
				indek: parseInt(indek) ?? null,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Kelompok jabatan berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating kelompok_jabatan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menambah kelompok jabatan" },
			{ status: 500 }
		);
	}
}

// PUT - Update kelompok_jabatan
export async function PUT(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { kode_kelompok, nama_kelompok, indek } = await request.json();

		if (!kode_kelompok) {
			return NextResponse.json(
				{ message: "Kode kelompok harus diisi" },
				{ status: 400 }
			);
		}

		const data = {};
		if (nama_kelompok !== undefined) data.nama_kelompok = nama_kelompok;
		if (indek !== undefined) data.indek = parseInt(indek);

		if (Object.keys(data).length === 0) {
			return NextResponse.json(
				{ message: "Tidak ada data yang diupdate" },
				{ status: 400 }
			);
		}

		await update({
			table: "kelompok_jabatan",
			data,
			where: { kode_kelompok },
		});

		return NextResponse.json({
			status: "success",
			message: "Kelompok jabatan berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating kelompok_jabatan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate kelompok jabatan" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus kelompok_jabatan
export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const kode_kelompok = searchParams.get("kode_kelompok");

		if (!kode_kelompok) {
			return NextResponse.json(
				{ message: "Kode kelompok harus diisi" },
				{ status: 400 }
			);
		}

		await delete_({
			table: "kelompok_jabatan",
			where: { kode_kelompok },
		});

		return NextResponse.json({
			status: "success",
			message: "Kelompok jabatan berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting kelompok_jabatan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus kelompok jabatan" },
			{ status: 500 }
		);
	}
}
