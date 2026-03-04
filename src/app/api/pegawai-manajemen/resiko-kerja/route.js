import { NextResponse } from "next/server";
import { select, insert, update, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - List resiko_kerja
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await select({
			table: "resiko_kerja",
			fields: ["kode_resiko", "nama_resiko", "indek"],
			orderBy: "indek",
			order: "ASC",
		});

		return NextResponse.json({ status: "success", data });
	} catch (error) {
		console.error("Error fetching resiko_kerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data resiko kerja" },
			{ status: 500 }
		);
	}
}

// POST - Tambah resiko_kerja
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { kode_resiko, nama_resiko, indek } = await request.json();

		if (!kode_resiko) {
			return NextResponse.json(
				{ message: "Kode resiko harus diisi" },
				{ status: 400 }
			);
		}

		await insert({
			table: "resiko_kerja",
			data: {
				kode_resiko,
				nama_resiko: nama_resiko || null,
				indek: parseInt(indek) ?? null,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Resiko kerja berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating resiko_kerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menambah resiko kerja" },
			{ status: 500 }
		);
	}
}

// PUT - Update resiko_kerja
export async function PUT(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { kode_resiko, nama_resiko, indek } = await request.json();

		if (!kode_resiko) {
			return NextResponse.json(
				{ message: "Kode resiko harus diisi" },
				{ status: 400 }
			);
		}

		const data = {};
		if (nama_resiko !== undefined) data.nama_resiko = nama_resiko;
		if (indek !== undefined) data.indek = parseInt(indek);

		if (Object.keys(data).length === 0) {
			return NextResponse.json(
				{ message: "Tidak ada data yang diupdate" },
				{ status: 400 }
			);
		}

		await update({
			table: "resiko_kerja",
			data,
			where: { kode_resiko },
		});

		return NextResponse.json({
			status: "success",
			message: "Resiko kerja berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating resiko_kerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate resiko kerja" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus resiko_kerja
export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const kode_resiko = searchParams.get("kode_resiko");

		if (!kode_resiko) {
			return NextResponse.json(
				{ message: "Kode resiko harus diisi" },
				{ status: 400 }
			);
		}

		await delete_({
			table: "resiko_kerja",
			where: { kode_resiko },
		});

		return NextResponse.json({
			status: "success",
			message: "Resiko kerja berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting resiko_kerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus resiko kerja" },
			{ status: 500 }
		);
	}
}
