import { NextResponse } from "next/server";
import { select, insert, update, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - List emergency_index
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await select({
			table: "emergency_index",
			fields: ["kode_emergency", "nama_emergency", "indek"],
			orderBy: "indek",
			order: "ASC",
		});

		return NextResponse.json({ status: "success", data });
	} catch (error) {
		console.error("Error fetching emergency_index:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data emergency index" },
			{ status: 500 }
		);
	}
}

// POST - Tambah emergency_index
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { kode_emergency, nama_emergency, indek } = await request.json();

		if (!kode_emergency) {
			return NextResponse.json(
				{ message: "Kode emergency harus diisi" },
				{ status: 400 }
			);
		}

		await insert({
			table: "emergency_index",
			data: {
				kode_emergency,
				nama_emergency: nama_emergency || null,
				indek: parseInt(indek) ?? null,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Emergency index berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating emergency_index:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menambah emergency index" },
			{ status: 500 }
		);
	}
}

// PUT - Update emergency_index
export async function PUT(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { kode_emergency, nama_emergency, indek } = await request.json();

		if (!kode_emergency) {
			return NextResponse.json(
				{ message: "Kode emergency harus diisi" },
				{ status: 400 }
			);
		}

		const data = {};
		if (nama_emergency !== undefined) data.nama_emergency = nama_emergency;
		if (indek !== undefined) data.indek = parseInt(indek);

		if (Object.keys(data).length === 0) {
			return NextResponse.json(
				{ message: "Tidak ada data yang diupdate" },
				{ status: 400 }
			);
		}

		await update({
			table: "emergency_index",
			data,
			where: { kode_emergency },
		});

		return NextResponse.json({
			status: "success",
			message: "Emergency index berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating emergency_index:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate emergency index" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus emergency_index
export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const kode_emergency = searchParams.get("kode_emergency");

		if (!kode_emergency) {
			return NextResponse.json(
				{ message: "Kode emergency harus diisi" },
				{ status: 400 }
			);
		}

		await delete_({
			table: "emergency_index",
			where: { kode_emergency },
		});

		return NextResponse.json({
			status: "success",
			message: "Emergency index berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting emergency_index:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus emergency index" },
			{ status: 500 }
		);
	}
}
