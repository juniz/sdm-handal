import { NextResponse } from "next/server";
import { select, insert, update, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - List pendidikan
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await select({
			table: "pendidikan",
			fields: ["tingkat", "indek", "gapok1", "kenaikan", "maksimal"],
			orderBy: "indek",
			order: "ASC",
		});

		return NextResponse.json({ status: "success", data });
	} catch (error) {
		console.error("Error fetching pendidikan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data pendidikan" },
			{ status: 500 }
		);
	}
}

// POST - Tambah pendidikan
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { tingkat, indek, gapok1, kenaikan, maksimal } = await request.json();

		if (!tingkat) {
			return NextResponse.json(
				{ message: "Tingkat pendidikan harus diisi" },
				{ status: 400 }
			);
		}

		await insert({
			table: "pendidikan",
			data: {
				tingkat,
				indek: parseInt(indek) ?? 0,
				gapok1: parseFloat(gapok1) || 0,
				kenaikan: parseFloat(kenaikan) || 0,
				maksimal: parseInt(maksimal) ?? 0,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Pendidikan berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating pendidikan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menambah pendidikan" },
			{ status: 500 }
		);
	}
}

// PUT - Update pendidikan
export async function PUT(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { tingkat, indek, gapok1, kenaikan, maksimal } = await request.json();

		if (!tingkat) {
			return NextResponse.json(
				{ message: "Tingkat pendidikan harus diisi" },
				{ status: 400 }
			);
		}

		const data = {};
		if (indek !== undefined) data.indek = parseInt(indek);
		if (gapok1 !== undefined) data.gapok1 = parseFloat(gapok1);
		if (kenaikan !== undefined) data.kenaikan = parseFloat(kenaikan);
		if (maksimal !== undefined) data.maksimal = parseInt(maksimal);

		if (Object.keys(data).length === 0) {
			return NextResponse.json(
				{ message: "Tidak ada data yang diupdate" },
				{ status: 400 }
			);
		}

		await update({
			table: "pendidikan",
			data,
			where: { tingkat },
		});

		return NextResponse.json({
			status: "success",
			message: "Pendidikan berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating pendidikan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate pendidikan" },
			{ status: 500 }
		);
	}
}

// DELETE - Hapus pendidikan
export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const tingkat = searchParams.get("tingkat");

		if (!tingkat) {
			return NextResponse.json(
				{ message: "Tingkat pendidikan harus diisi" },
				{ status: 400 }
			);
		}

		await delete_({ table: "pendidikan", where: { tingkat } });

		return NextResponse.json({
			status: "success",
			message: "Pendidikan berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting pendidikan:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus pendidikan" },
			{ status: 500 }
		);
	}
}
