import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request) {
	try {
		// Verifikasi user yang sedang login
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized", status: 401 },
				{ status: 401 }
			);
		}

		// Ambil riwayat pendidikan berdasarkan id user (karena id di tabel riwayat_pendidikan merujuk pegawai.id)
		const sql = `
			SELECT 
				id,
				pendidikan,
				sekolah,
				jurusan,
				thn_lulus,
				kepala,
				pendanaan,
				keterangan,
				status,
				berkas
			FROM riwayat_pendidikan 
			WHERE id = ? 
			ORDER BY 
				CASE 
					WHEN pendidikan = 'S3' THEN 1
					WHEN pendidikan = 'S2 Profesi' THEN 2
					WHEN pendidikan = 'S2' THEN 3
					WHEN pendidikan = 'S1 Profesi' THEN 4
					WHEN pendidikan = 'S1' THEN 5
					WHEN pendidikan = 'D IV' THEN 6
					WHEN pendidikan = 'D III' THEN 7
					WHEN pendidikan = 'D II' THEN 8
					WHEN pendidikan = 'D I' THEN 9
					WHEN pendidikan = 'SMK' THEN 10
					WHEN pendidikan = 'SMA' THEN 11
					WHEN pendidikan = 'SMP' THEN 12
					WHEN pendidikan = 'SD' THEN 13
					ELSE 14
				END ASC,
				thn_lulus DESC
		`;

		const result = await query(sql, [user.id]);

		// Format data untuk response
		const educationHistory = result.map((item) => ({
			id: item.id,
			pendidikan: item.pendidikan,
			sekolah: item.sekolah,
			jurusan: item.jurusan,
			thn_lulus: item.thn_lulus,
			kepala: item.kepala,
			pendanaan: item.pendanaan,
			keterangan: item.keterangan,
			status: item.status,
			berkas: item.berkas,
		}));

		return NextResponse.json({
			status: 200,
			message: "Riwayat pendidikan berhasil diambil",
			data: educationHistory,
		});
	} catch (error) {
		console.error("Error in education GET API:", error);
		return NextResponse.json(
			{ error: "Internal server error", status: 500 },
			{ status: 500 }
		);
	}
}

export async function POST(request) {
	try {
		// Verifikasi user yang sedang login
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized", status: 401 },
				{ status: 401 }
			);
		}

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
					error: "Tingkat pendidikan, nama sekolah, dan tahun lulus wajib diisi",
					status: 400,
				},
				{ status: 400 }
			);
		}

		// Insert riwayat pendidikan baru (id, pendidikan, sekolah sbg PK)
		const sql = `
			INSERT INTO riwayat_pendidikan (
				id, pendidikan, sekolah, jurusan, thn_lulus, 
				kepala, pendanaan, keterangan, status, berkas
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		// Berkas diisi '-' jika tidak terisi, sesuai instruksi.
		await query(sql, [
			user.id,
			pendidikan,
			sekolah,
			jurusan || "",
			thn_lulus,
			kepala || "",
			pendanaan || "",
			keterangan || "",
			status || "",
			berkas || "-",
		]);

		const newEducation = {
			id: user.id,
			pendidikan,
			sekolah,
			jurusan: jurusan || "",
			thn_lulus,
			kepala: kepala || "",
			pendanaan: pendanaan || "",
			keterangan: keterangan || "",
			status: status || "",
			berkas: berkas || "-",
		};

		return NextResponse.json({
			status: 201,
			message: "Riwayat pendidikan berhasil ditambahkan",
			data: newEducation,
		});
	} catch (error) {
		console.error("Error in education POST API:", error);
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
			old_pendidikan,
			old_sekolah,
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

		if (!old_pendidikan || !old_sekolah || !pendidikan || !sekolah || !thn_lulus) {
			return NextResponse.json({
				error: "Tingkat pendidikan lama, sekolah lama, tingkat pendidikan baru, nama sekolah baru, dan tahun lulus wajib diisi",
				status: 400,
			}, { status: 400 });
		}

		const sql = `
			UPDATE riwayat_pendidikan 
			SET pendidikan = ?, sekolah = ?, jurusan = ?, thn_lulus = ?, 
				kepala = ?, pendanaan = ?, keterangan = ?, status = ?, berkas = ?
			WHERE id = ? AND pendidikan = ? AND sekolah = ?
		`;

		const result = await query(sql, [
			pendidikan,
			sekolah,
			jurusan || "",
			thn_lulus,
			kepala || "",
			pendanaan || "",
			keterangan || "",
			status || "",
			berkas || "-",
			user.id,
			old_pendidikan,
			old_sekolah,
		]);

		if (result.affectedRows === 0) {
			return NextResponse.json({
				error: "Riwayat pendidikan tidak ditemukan atau tidak dapat diakses",
				status: 404,
			}, { status: 404 });
		}

		const updatedEducation = {
			id: user.id,
			pendidikan,
			sekolah,
			jurusan: jurusan || "",
			thn_lulus,
			kepala: kepala || "",
			pendanaan: pendanaan || "",
			keterangan: keterangan || "",
			status: status || "",
			berkas: berkas || "-",
		};

		return NextResponse.json({
			status: 200,
			message: "Riwayat pendidikan berhasil diupdate",
			data: updatedEducation,
		});
	} catch (error) {
		console.error("Error in education PUT API:", error);
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

		// Karena fetch DELETE by default stringify data dengan body tidak didukung di semua standar,
		// kita bisa ambil pendidikan/sekolah dari search params, atau dari URLSearchParams.
		const { searchParams } = new URL(request.url);
		const pendidikan = searchParams.get('pendidikan');
		const sekolah = searchParams.get('sekolah');

		if (!pendidikan || !sekolah) {
			return NextResponse.json(
				{ error: "Kunci pendidikan dan sekolah harus diberikan.", status: 400 },
				{ status: 400 }
			);
		}

		const sql = `DELETE FROM riwayat_pendidikan WHERE id = ? AND pendidikan = ? AND sekolah = ?`;

		const result = await query(sql, [user.id, pendidikan, sekolah]);

		if (result.affectedRows === 0) {
			return NextResponse.json({
				error: "Riwayat pendidikan tidak ditemukan atau tidak dapat diakses",
				status: 404,
			}, { status: 404 });
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
