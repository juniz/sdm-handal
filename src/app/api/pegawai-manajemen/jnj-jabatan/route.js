import { NextResponse } from "next/server";
import { select, insert, update, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - List jnj_jabatan
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await select({
			table: "jnj_jabatan",
			fields: ["kode", "nama", "tnj", "indek"],
			orderBy: "indek",
			order: "ASC",
		});

		return NextResponse.json({ status: "success", data });
	} catch (error) {
		console.error("Error fetching jnj_jabatan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data jenis jabatan" },
			{ status: 500 }
		);
	}
}

// POST - Tambah jnj_jabatan
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { kode, nama, tnj, indek } = await request.json();

		if (!kode || !nama) {
			return NextResponse.json(
				{ message: "Kode dan nama harus diisi" },
				{ status: 400 }
			);
		}

		await insert({
			table: "jnj_jabatan",
			data: {
				kode,
				nama,
				tnj: parseFloat(tnj) || 0,
				indek: parseInt(indek) ?? 0,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Jenis jabatan berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating jnj_jabatan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menambah jenis jabatan" },
			{ status: 500 }
		);
	}
}

// PUT - Update jnj_jabatan
export async function PUT(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { kode, nama, tnj, indek } = await request.json();

		if (!kode) {
			return NextResponse.json(
				{ message: "Kode harus diisi" },
				{ status: 400 }
			);
		}

		const data = {};
		if (nama !== undefined) data.nama = nama;
		if (tnj !== undefined) data.tnj = parseFloat(tnj);
		if (indek !== undefined) data.indek = parseInt(indek);

		if (Object.keys(data).length === 0) {
			return NextResponse.json(
				{ message: "Tidak ada data yang diupdate" },
				{ status: 400 }
			);
		}

		await update({
			table: "jnj_jabatan",
			data,
			where: { kode },
		});

		return NextResponse.json({
			status: "success",
			message: "Jenis jabatan berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating jnj_jabatan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate jenis jabatan" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus jnj_jabatan
export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const kode = searchParams.get("kode");

		if (!kode) {
			return NextResponse.json(
				{ message: "Kode harus diisi" },
				{ status: 400 }
			);
		}

		await delete_({ table: "jnj_jabatan", where: { kode } });

		return NextResponse.json({
			status: "success",
			message: "Jenis jabatan berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting jnj_jabatan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus jenis jabatan" },
			{ status: 500 }
		);
	}
}
