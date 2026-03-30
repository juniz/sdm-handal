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
				COALESCE(tkj.threshold_persen, 100) as threshold_persen,
				(
					(
						COALESCE(jnj.indek, 0) + 
						COALESCE(kel.indek, 0) + 
						COALESCE(res.indek, 0) + 
						COALESCE(em.indek, 0)
					) * (COALESCE(tkj.bobot_jabatan, 35.00) / 100)
					+
					(
						COALESCE(pend.indek, 0) +
						COALESCE(eval_latest.indek, 0) +
						COALESCE(capai_latest.indek, 0)
					) * (COALESCE(tkj.bobot_personal, 65.00) / 100)
				) AS total_index_remunerasi,
				ROUND(
					? * 
					(pk.presentase_dari_total / 100) * 
					(pu.presentase_dari_kategori / 100) * 
					(pp.presentase_dari_unit / 100), 
					2
				) as nominal_pegawai_full
			FROM presentase_kategori pk
			JOIN presentase_unit pu ON pk.id_kategori = pu.id_kategori
			JOIN presentase_pegawai pp ON pu.id_unit = pp.id_unit
			JOIN pegawai p ON pp.id_pegawai = p.id
			LEFT JOIN jnj_jabatan jnj ON p.jnj_jabatan = jnj.kode
			LEFT JOIN kelompok_jabatan kel ON p.kode_kelompok = kel.kode_kelompok
			LEFT JOIN threshold_kelompok_jabatan tkj ON p.kode_kelompok = tkj.kode_kelompok
			LEFT JOIN resiko_kerja res ON p.kode_resiko = res.kode_resiko
			LEFT JOIN emergency_index em ON p.kode_emergency = em.kode_emergency
			LEFT JOIN pendidikan pend ON p.pendidikan = pend.tingkat
			LEFT JOIN (
				SELECT ekp.id, ek.indek
				FROM evaluasi_kinerja_pegawai ekp
				JOIN evaluasi_kinerja ek ON ekp.kode_evaluasi = ek.kode_evaluasi
				WHERE (ekp.id, ekp.tahun, ekp.bulan) IN (
					SELECT id, MAX(tahun), MAX(bulan)
					FROM evaluasi_kinerja_pegawai
					GROUP BY id
				)
			) eval_latest ON p.id = eval_latest.id
			LEFT JOIN (
				SELECT pkp.id, pk.indek
				FROM pencapaian_kinerja_pegawai pkp
				JOIN pencapaian_kinerja pk ON pkp.kode_pencapaian = pk.kode_pencapaian
				WHERE (pkp.id, pkp.tahun, pkp.bulan) IN (
					SELECT id, MAX(tahun), MAX(bulan)
					FROM pencapaian_kinerja_pegawai
					GROUP BY id
				)
			) capai_latest ON p.id = capai_latest.id
		`, [total_jasa]);

		// Hitung nominal aktual berdasarkan threshold
		const validDistribusi = distribusi.map(row => {
			const total_index_remunerasi = parseFloat(row.total_index_remunerasi || 0);
			const threshold_persen = parseFloat(row.threshold_persen || 100);
			
			let persentase_pencapaian = (total_index_remunerasi / threshold_persen);
			if (persentase_pencapaian > 1) persentase_pencapaian = 1; // Cap at 100%
			if (isNaN(persentase_pencapaian) || !isFinite(persentase_pencapaian)) persentase_pencapaian = 0;

			const nominal_full = parseFloat(row.nominal_pegawai_full || 0);
			const nominal_aktual = nominal_full * persentase_pencapaian;

			return {
				nik: row.nik,
				nominal_pegawai: nominal_aktual.toFixed(2)
			};
		}).filter(row => parseFloat(row.nominal_pegawai) > 0);

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
