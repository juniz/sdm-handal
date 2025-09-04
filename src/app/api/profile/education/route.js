import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
	try {
		// Verifikasi user yang sedang login
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{ error: "Unauthorized", status: 401 },
				{ status: 401 }
			);
		}

		// Ambil riwayat pendidikan berdasarkan NIP user
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
					WHEN pendidikan = 'S2' THEN 2
					WHEN pendidikan = 'S1' THEN 3
					WHEN pendidikan = 'D IV' THEN 4
					WHEN pendidikan = 'D III' THEN 5
					WHEN pendidikan = 'D II' THEN 6
					WHEN pendidikan = 'D I' THEN 7
					WHEN pendidikan = 'SMK' THEN 8
					WHEN pendidikan = 'SMA' THEN 9
					WHEN pendidikan = 'SMP' THEN 10
					WHEN pendidikan = 'SD' THEN 11
					ELSE 12
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
		console.error("Error in education API:", error);
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
					error:
						"Tingkat pendidikan, nama sekolah, dan tahun lulus wajib diisi",
					status: 400,
				},
				{ status: 400 }
			);
		}

		// Insert riwayat pendidikan baru
		const sql = `
			INSERT INTO riwayat_pendidikan (
				nip, pendidikan, sekolah, jurusan, thn_lulus, 
				kepala, pendanaan, keterangan, status, berkas
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		const result = await query(sql, [
			user.nip,
			pendidikan,
			sekolah,
			jurusan || null,
			thn_lulus,
			kepala || null,
			pendanaan || null,
			keterangan || null,
			status || null,
			berkas || null,
		]);

		// Ambil data yang baru diinsert
		const newEducation = {
			id: result.insertId,
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
			status: 201,
			message: "Riwayat pendidikan berhasil ditambahkan",
			data: newEducation,
		});
	} catch (error) {
		console.error("Error in education POST API:", error);
		return NextResponse.json(
			{ error: "Internal server error", status: 500 },
			{ status: 500 }
		);
	}
}
