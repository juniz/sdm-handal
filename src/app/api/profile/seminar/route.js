import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized", status: 401 }, { status: 401 });
		}

		const sql = `
			SELECT 
				id,
				tingkat,
				jenis,
				nama_seminar,
				peranan,
				mulai,
				selesai,
				penyelengara,
				tempat,
				berkas
			FROM riwayat_seminar 
			WHERE id = ? 
			ORDER BY mulai DESC
		`;

		const result = await query(sql, [user.id]);

		const seminarHistory = result.map((item) => ({
			id: item.id,
			tingkat: item.tingkat,
			jenis: item.jenis,
			nama_seminar: item.nama_seminar,
			peranan: item.peranan,
			mulai: item.mulai,
			selesai: item.selesai,
			penyelengara: item.penyelengara,
			tempat: item.tempat,
			berkas: item.berkas,
		}));

		return NextResponse.json({
			status: 200,
			message: "Riwayat pelatihan berhasil diambil",
			data: seminarHistory,
		});
	} catch (error) {
		console.error("Error in seminar GET API:", error);
		return NextResponse.json(
			{ error: "Internal server error", status: 500 },
			{ status: 500 }
		);
	}
}

export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized", status: 401 }, { status: 401 });
		}

		const body = await request.json();
		const {
			tingkat,
			jenis,
			nama_seminar,
			peranan,
			mulai,
			selesai,
			penyelengara,
			tempat,
			berkas
		} = body;

		if (!tingkat || !jenis || !nama_seminar || !mulai || !selesai) {
			return NextResponse.json({
				error: "Tingkat, jenis, nama acara, tanggal mulai, dan tanggal selesai wajib diisi",
				status: 400,
			}, { status: 400 });
		}

		const sql = `
			INSERT INTO riwayat_seminar 
			(id, tingkat, jenis, nama_seminar, peranan, mulai, selesai, penyelengara, tempat, berkas)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		await query(sql, [
			user.id,
			tingkat,
			jenis,
			nama_seminar,
			peranan || "",
			mulai,
			selesai,
			penyelengara || "",
			tempat || "",
			berkas || "-"
		]);

		const newSeminar = {
			id: user.id,
			tingkat,
			jenis,
			nama_seminar,
			peranan: peranan || "",
			mulai,
			selesai,
			penyelengara: penyelengara || "",
			tempat: tempat || "",
			berkas: berkas || "-"
		};

		return NextResponse.json({
			status: 201,
			message: "Riwayat pelatihan berhasil ditambahkan",
			data: newSeminar,
		});
	} catch (error) {
		console.error("Error in seminar POST API:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error", status: 500 },
			{ status: 500 }
		);
	}
}

export async function PUT(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized", status: 401 }, { status: 401 });
		}

		const body = await request.json();
		const {
			old_nama_seminar,
			old_mulai,
			tingkat,
			jenis,
			nama_seminar,
			peranan,
			mulai,
			selesai,
			penyelengara,
			tempat,
			berkas
		} = body;

		if (!old_nama_seminar || !old_mulai || !tingkat || !jenis || !nama_seminar || !mulai || !selesai) {
			return NextResponse.json({
				error: "Kunci lama dan isian wajib (tingkat, jenis, nama, mulai, selesai) tidak boleh kosong",
				status: 400,
			}, { status: 400 });
		}

		const sql = `
			UPDATE riwayat_seminar 
			SET tingkat = ?, jenis = ?, nama_seminar = ?, peranan = ?, 
				mulai = ?, selesai = ?, penyelengara = ?, tempat = ?, berkas = ?
			WHERE id = ? AND nama_seminar = ? AND mulai = ?
		`;

		const result = await query(sql, [
			tingkat,
			jenis,
			nama_seminar,
			peranan || "",
			mulai,
			selesai,
			penyelengara || "",
			tempat || "",
			berkas || "-",
			user.id,
			old_nama_seminar,
			old_mulai.split('T')[0] // Format Date (YYYY-MM-DD string handled by MySQL gracefully)
		]);

		if (result.affectedRows === 0) {
			return NextResponse.json({
				error: "Riwayat pelatihan tidak ditemukan atau tidak dapat diakses",
				status: 404,
			}, { status: 404 });
		}

		const updatedSeminar = {
			id: user.id,
			tingkat,
			jenis,
			nama_seminar,
			peranan: peranan || "",
			mulai,
			selesai,
			penyelengara: penyelengara || "",
			tempat: tempat || "",
			berkas: berkas || "-"
		};

		return NextResponse.json({
			status: 200,
			message: "Riwayat pelatihan berhasil diupdate",
			data: updatedSeminar,
		});
	} catch (error) {
		console.error("Error in seminar PUT API:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error", status: 500 },
			{ status: 500 }
		);
	}
}

export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized", status: 401 }, { status: 401 });
		}

		const body = await request.json();
		const { nama_seminar, mulai } = body;

		if (!nama_seminar || !mulai) {
			return NextResponse.json({
				error: "Nama seminar dan tanggal mulai wajib diisi untuk menghapus",
				status: 400,
			}, { status: 400 });
		}

		const sql = "DELETE FROM riwayat_seminar WHERE id = ? AND nama_seminar = ? AND mulai = ?";
		const result = await query(sql, [user.id, nama_seminar, mulai.split('T')[0]]);

		if (result.affectedRows === 0) {
			return NextResponse.json({
				error: "Riwayat pelatihan tidak ditemukan atau tidak dapat diakses",
				status: 404,
			}, { status: 404 });
		}

		return NextResponse.json({
			status: 200,
			message: "Riwayat pelatihan berhasil dihapus",
		});
	} catch (error) {
		console.error("Error in seminar DELETE API:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error", status: 500 },
			{ status: 500 }
		);
	}
}
