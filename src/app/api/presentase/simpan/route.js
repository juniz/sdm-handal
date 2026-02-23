import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// POST - Simpan hasil kalkulasi distribusi ke gaji_pegawai
export async function POST(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { total_jasa, tanggal } = await request.json();

		if (!total_jasa || total_jasa <= 0) {
			return NextResponse.json(
				{ message: "Total jasa harus diisi dan lebih dari 0" },
				{ status: 400 }
			);
		}

		if (!tanggal) {
			return NextResponse.json(
				{ message: "Tanggal harus diisi" },
				{ status: 400 }
			);
		}

		// Parse tanggal untuk mendapatkan tahun dan bulan periode
		const dateObj = new Date(tanggal);
		const periodeTahun = dateObj.getFullYear();
		const periodeBulan = dateObj.getMonth() + 1; // getMonth() returns 0-11

		// Ambil struktur presentase dan kalkulasi nominal
		const distribusi = await rawQuery(`
			SELECT 
				p.nik,
				ROUND(
					? * 
					(pk.presentase_dari_total / 100) * 
					(pu.presentase_dari_kategori / 100) * 
					(pp.presentase_dari_unit / 100), 
					2
				) as nominal_pegawai
			FROM presentase_kategori pk
			JOIN presentase_unit pu ON pk.id_kategori = pu.id_kategori
			JOIN presentase_pegawai pp ON pu.id_unit = pp.id_unit
			JOIN pegawai p ON pp.id_pegawai = p.id
		`, [total_jasa]);

		// Filter hanya yang nominalnya > 0
		const validDistribusi = distribusi.filter(row => parseFloat(row.nominal_pegawai) > 0);

		if (validDistribusi.length === 0) {
			return NextResponse.json(
				{ message: "Tidak ada data distribusi yang valid untuk disimpan" },
				{ status: 400 }
			);
		}

		// Simpan ke database gaji_pegawai
		// Gunakan transaction atau batch insert jika memungkinkan, tapi rawQuery kita simple
		// Kita loop insert/update satu per satu atau construct bulk insert
		
		// Untuk efisiensi, kita gunakan bulk insert dengan ON DUPLICATE KEY UPDATE
		// Mari kita bangun querynya
		const values = [];
		const placeholders = [];
		
		validDistribusi.forEach(row => {
			placeholders.push("(?, ?, ?, ?, ?, ?, NOW())");
			values.push(
				row.nik || null, 
				periodeTahun || null, 
				periodeBulan || null, 
				'Jasa', 
				row.nominal_pegawai || 0, 
				user.username || user.id || null // uploaded_by
			);
		});

		const query = `
			INSERT INTO gaji_pegawai (nik, periode_tahun, periode_bulan, jenis, gaji, uploaded_by, uploaded_at)
			VALUES ${placeholders.join(', ')}
			ON DUPLICATE KEY UPDATE
				gaji = VALUES(gaji),
				uploaded_by = VALUES(uploaded_by),
				uploaded_at = VALUES(uploaded_at)
		`;

		await rawQuery(query, values);

		return NextResponse.json({
			status: "success",
			message: `Berhasil menyimpan data jasa untuk ${validDistribusi.length} pegawai pada periode ${periodeBulan}/${periodeTahun}`,
			summary: {
				periode_tahun: periodeTahun,
				periode_bulan: periodeBulan,
				jumlah_disimpan: validDistribusi.length,
				total_nilai: validDistribusi.reduce((acc, curr) => acc + parseFloat(curr.nominal_pegawai), 0)
			}
		});

	} catch (error) {
		console.error("Error saving salary distribution:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menyimpan data gaji" },
			{ status: 500 }
		);
	}
}
