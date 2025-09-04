import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function PUT(request, { params }) {
	try {
		// Verifikasi user yang sedang login
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized", status: 401 },
				{ status: 401 }
			);
		}

		const { id } = params;
		const body = await request.json();
		const {
			pendidikan,
			sekolah,
			jurusan,
			thn_lulus,
			kepala,
			pendanaan,
			keterangan,
			status,
			berkas,
		} = body;

		// Validasi field yang required
		if (!pendidikan || !sekolah || !thn_lulus) {
			return NextResponse.json(
				{
					error:
						"Tingkat pendidikan, nama sekolah, dan tahun lulus wajib diisi",
					status: 400,
				},
				{ status: 400 }
			);
		}

		// Update riwayat pendidikan
		const sql = `
			UPDATE riwayat_pendidikan 
			SET pendidikan = ?, sekolah = ?, jurusan = ?, thn_lulus = ?, 
				kepala = ?, pendanaan = ?, keterangan = ?, status = ?, berkas = ?
			WHERE id = ? AND nip = ?
		`;

		const result = await query(sql, [
			pendidikan,
			sekolah,
			jurusan || null,
			thn_lulus,
			kepala || null,
			pendanaan || null,
			keterangan || null,
			status || null,
			berkas || null,
			id,
			user.nip,
		]);

		if (result.affectedRows === 0) {
			return NextResponse.json(
				{
					error: "Riwayat pendidikan tidak ditemukan atau tidak dapat diakses",
					status: 404,
				},
				{ status: 404 }
			);
		}

		// Ambil data yang sudah diupdate
		const updatedEducation = {
			id: parseInt(id),
			pendidikan,
			sekolah,
			jurusan,
			thn_lulus,
			kepala,
			pendanaan,
			keterangan,
			status,
			berkas,
		};

		return NextResponse.json({
			status: 200,
			message: "Riwayat pendidikan berhasil diupdate",
			data: updatedEducation,
		});
	} catch (error) {
		console.error("Error in education PUT API:", error);
		return NextResponse.json(
			{ error: "Internal server error", status: 500 },
			{ status: 500 }
		);
	}
}

export async function DELETE(request, { params }) {
	try {
		// Verifikasi user yang sedang login
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized", status: 401 },
				{ status: 401 }
			);
		}

		const { id } = params;

		// Delete riwayat pendidikan
		const sql = `DELETE FROM riwayat_pendidikan WHERE id = ? AND nip = ?`;

		const result = await query(sql, [id, user.nip]);

		if (result.affectedRows === 0) {
			return NextResponse.json(
				{
					error: "Riwayat pendidikan tidak ditemukan atau tidak dapat diakses",
					status: 404,
				},
				{ status: 404 }
			);
		}

		return NextResponse.json({
			status: 200,
			message: "Riwayat pendidikan berhasil dihapus",
		});
	} catch (error) {
		console.error("Error in education DELETE API:", error);
		return NextResponse.json(
			{ error: "Internal server error", status: 500 },
			{ status: 500 }
		);
	}
}
