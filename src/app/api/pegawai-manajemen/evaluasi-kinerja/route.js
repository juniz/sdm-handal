import { NextResponse } from "next/server";
import {
	select,
	insert,
	update,
	delete_ as deleteQuery,
} from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const data = await select({
			table: "evaluasi_kinerja",
			orderBy: "kode_evaluasi",
			order: "ASC",
		});

		return NextResponse.json({
			status: "success",
			data,
		});
	} catch (error) {
		console.error("Error fetching evaluasi kinerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data" },
			{ status: 500 },
		);
	}
}

export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { kode_evaluasi, nama_evaluasi, indek } = body;

		if (!kode_evaluasi || !nama_evaluasi) {
			return NextResponse.json(
				{ message: "Kode dan Nama Evaluasi wajib diisi" },
				{ status: 400 },
			);
		}

		await insert({
			table: "evaluasi_kinerja",
			data: {
				kode_evaluasi,
				nama_evaluasi,
				indek: indek || 0,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Data evaluasi berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating evaluasi kinerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menyimpan data" },
			{ status: 500 },
		);
	}
}

export async function PUT(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { kode_evaluasi, nama_evaluasi, indek } = body;

		if (!kode_evaluasi) {
			return NextResponse.json(
				{ message: "Kode Evaluasi wajib diisi" },
				{ status: 400 },
			);
		}

		await update({
			table: "evaluasi_kinerja",
			data: {
				nama_evaluasi,
				indek,
			},
			where: { kode_evaluasi },
		});

		return NextResponse.json({
			status: "success",
			message: "Data evaluasi berhasil diperbarui",
		});
	} catch (error) {
		console.error("Error updating evaluasi kinerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat memperbarui data" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const kode_evaluasi = searchParams.get("kode_evaluasi");

		if (!kode_evaluasi) {
			return NextResponse.json(
				{ message: "Kode Evaluasi wajib diisi" },
				{ status: 400 },
			);
		}

		await deleteQuery({
			table: "evaluasi_kinerja",
			where: { kode_evaluasi },
		});

		return NextResponse.json({
			status: "success",
			message: "Data evaluasi berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting evaluasi kinerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus data" },
			{ status: 500 },
		);
	}
}
