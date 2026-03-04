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
			table: "pencapaian_kinerja",
			orderBy: "kode_pencapaian",
			order: "ASC",
		});

		return NextResponse.json({
			status: "success",
			data,
		});
	} catch (error) {
		console.error("Error fetching pencapaian kinerja:", error);
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
		const { kode_pencapaian, nama_pencapaian, indek } = body;

		if (!kode_pencapaian || !nama_pencapaian) {
			return NextResponse.json(
				{ message: "Kode dan Nama Pencapaian wajib diisi" },
				{ status: 400 },
			);
		}

		await insert({
			table: "pencapaian_kinerja",
			data: {
				kode_pencapaian,
				nama_pencapaian,
				indek: indek || 0,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Data pencapaian berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating pencapaian kinerja:", error);
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
		const { kode_pencapaian, nama_pencapaian, indek } = body;

		if (!kode_pencapaian) {
			return NextResponse.json(
				{ message: "Kode Pencapaian wajib diisi" },
				{ status: 400 },
			);
		}

		await update({
			table: "pencapaian_kinerja",
			data: {
				nama_pencapaian,
				indek,
			},
			where: { kode_pencapaian },
		});

		return NextResponse.json({
			status: "success",
			message: "Data pencapaian berhasil diperbarui",
		});
	} catch (error) {
		console.error("Error updating pencapaian kinerja:", error);
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
		const kode_pencapaian = searchParams.get("kode_pencapaian");

		if (!kode_pencapaian) {
			return NextResponse.json(
				{ message: "Kode Pencapaian wajib diisi" },
				{ status: 400 },
			);
		}

		await deleteQuery({
			table: "pencapaian_kinerja",
			where: { kode_pencapaian },
		});

		return NextResponse.json({
			status: "success",
			message: "Data pencapaian berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting pencapaian kinerja:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus data" },
			{ status: 500 },
		);
	}
}
