
import { NextResponse } from "next/server";
import { rawQuery, update, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// PUT - Update threshold
export async function PUT(request, { params }) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		const body = await request.json();

		if (!id) {
			return NextResponse.json(
				{ message: "ID threshold harus diisi" },
				{ status: 400 }
			);
		}

		// Check if exists
		const existing = await rawQuery(
			"SELECT id_threshold FROM threshold_kelompok_jabatan WHERE id_threshold = ?",
			[id]
		);
		if (existing.length === 0) {
			return NextResponse.json(
				{ message: "Threshold tidak ditemukan" },
				{ status: 404 }
			);
		}

		// If changing kode_kelompok, ensure unique
		if (body.kode_kelompok) {
			const duplicate = await rawQuery(
				"SELECT id_threshold FROM threshold_kelompok_jabatan WHERE kode_kelompok = ? AND id_threshold != ?",
				[body.kode_kelompok, id]
			);
			if (duplicate.length > 0) {
				return NextResponse.json(
					{ message: "Threshold untuk kelompok jabatan ini sudah ada" },
					{ status: 400 }
				);
			}
		}

		const data = {
			kode_kelompok: body.kode_kelompok,
			threshold_persen: parseFloat(body.threshold_persen),
			bobot_jabatan: parseFloat(body.bobot_jabatan),
			bobot_personal: parseFloat(body.bobot_personal),
			keterangan: body.keterangan || null,
			status: body.status !== undefined ? parseInt(body.status) : undefined,
		};

		// Remove undefined
		Object.keys(data).forEach((key) => {
			if (data[key] === undefined || (isNaN(data[key]) && key !== 'keterangan' && key !== 'kode_kelompok')) delete data[key];
		});

		await update({
			table: "threshold_kelompok_jabatan",
			data: data,
			where: { id_threshold: parseInt(id) },
		});

		return NextResponse.json({
			status: "success",
			message: "Threshold berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating threshold:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate threshold" },
			{ status: 500 }
		);
	}
}

// DELETE - Delete threshold
export async function DELETE(request, { params }) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;
		if (!id) {
			return NextResponse.json(
				{ message: "ID threshold harus diisi" },
				{ status: 400 }
			);
		}

		await delete_({
			table: "threshold_kelompok_jabatan",
			where: { id_threshold: parseInt(id) },
		});

		return NextResponse.json({
			status: "success",
			message: "Threshold berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting threshold:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus threshold" },
			{ status: 500 }
		);
	}
}
