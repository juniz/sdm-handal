import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// POST - Kalkulasi distribusi gaji
export async function POST(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { total_jasa, tanggal, abaikan_threshold } = await request.json();

		if (!total_jasa || total_jasa <= 0) {
			return NextResponse.json(
				{ message: "Total jasa harus diisi dan lebih dari 0" },
				{ status: 400 }
			);
		}

		const tanggalKalkulasi = tanggal || new Date().toISOString().split('T')[0];

		// Ambil struktur presentase dan kalkulasi nominal
		const distribusi = await rawQuery(`
			SELECT 
				pk.id_kategori,
				pk.nama_kategori,
				pk.presentase_dari_total,
				pu.id_unit,
				d.dep_id,
				d.nama as nama_departemen,
				pu.presentase_dari_kategori,
				pp.id_alokasi,
				p.id as id_pegawai,
				p.nik,
				p.nama as nama_pegawai,
				pp.presentase_dari_unit,
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
				-- Kalkulasi nominal
				ROUND(? * (pk.presentase_dari_total / 100), 2) as nominal_kategori,
				ROUND(
					? * 
					(pk.presentase_dari_total / 100) * 
					(pu.presentase_dari_kategori / 100), 
					2
				) as nominal_unit
			FROM presentase_kategori pk
			LEFT JOIN presentase_unit pu ON pk.id_kategori = pu.id_kategori
			LEFT JOIN departemen d ON pu.dep_id = d.dep_id
			LEFT JOIN presentase_pegawai pp ON pu.id_unit = pp.id_unit
			LEFT JOIN pegawai p ON pp.id_pegawai = p.id
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
			ORDER BY pk.nama_kategori, d.nama, p.nama
		`, [total_jasa, total_jasa]);

		// Kelompokkan data per kategori
		const groupedData = {};
		let totalDistribusi = 0;

		distribusi.forEach(row => {
			if (!groupedData[row.id_kategori]) {
				groupedData[row.id_kategori] = {
					id_kategori: row.id_kategori,
					nama_kategori: row.nama_kategori,
					presentase: row.presentase_dari_total,
					nominal: parseFloat(row.nominal_kategori || 0),
					units: {}
				};
			}

			if (row.id_unit && !groupedData[row.id_kategori].units[row.id_unit]) {
				groupedData[row.id_kategori].units[row.id_unit] = {
					id_unit: row.id_unit,
					dep_id: row.dep_id,
					nama_departemen: row.nama_departemen,
					presentase: row.presentase_dari_kategori,
					nominal: parseFloat(row.nominal_unit || 0),
					pegawai: []
				};
			}

			if (row.id_alokasi && row.id_pegawai) {
				const total_index_remunerasi = parseFloat(row.total_index_remunerasi || 0);
				const threshold_persen = parseFloat(row.threshold_persen || 100);
				
				let persentase_pencapaian = (total_index_remunerasi / threshold_persen);
				if (abaikan_threshold) {
					persentase_pencapaian = 1;
				} else {
					if (persentase_pencapaian > 1) persentase_pencapaian = 1; // Cap at 100%
					if (isNaN(persentase_pencapaian) || !isFinite(persentase_pencapaian)) persentase_pencapaian = 0;
				}

				const nominal_unit = parseFloat(row.nominal_unit || 0);
				const presentase_dari_unit = parseFloat(row.presentase_dari_unit || 0);
				
				// Nominal full jika mencapai threshold
				const nominal_full = Math.round(nominal_unit * (presentase_dari_unit / 100));
				// Nominal aktual sesuai pencapaian remunerasi
				const nominal_aktual = Math.round(nominal_full * persentase_pencapaian);

				groupedData[row.id_kategori].units[row.id_unit].pegawai.push({
					id_alokasi: row.id_alokasi,
					id_pegawai: row.id_pegawai,
					nik: row.nik,
					nama: row.nama_pegawai,
					presentase: row.presentase_dari_unit,
					presentase_remunerasi_aktual: (persentase_pencapaian * 100).toFixed(2),
					nominal_full: nominal_full,
					nominal: nominal_aktual
				});
				totalDistribusi += nominal_aktual;
			}
		});

		// Convert units object to array
		Object.keys(groupedData).forEach(katId => {
			groupedData[katId].units = Object.values(groupedData[katId].units);
		});

		// Summary data
		const summary = {
			total_jasa: parseFloat(total_jasa),
			tanggal_kalkulasi: tanggalKalkulasi,
			total_distribusi: totalDistribusi,
			sisa_belum_terdistribusi: parseFloat(total_jasa) - totalDistribusi,
			jumlah_kategori: Object.keys(groupedData).length,
			jumlah_pegawai: distribusi.filter(r => r.id_pegawai).length
		};

		return NextResponse.json({
			status: "success",
			data: Object.values(groupedData),
			summary
		});
	} catch (error) {
		console.error("Error calculating distribusi:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat kalkulasi distribusi" },
			{ status: 500 }
		);
	}
}

// GET - Ambil ringkasan struktur presentase
export async function GET(request) {
	try {
		const user = await getUser();

		if (!user) {
			return NextResponse.json(
				{ message: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Ringkasan struktur
		const summary = await rawQuery(`
			SELECT 
				(SELECT COALESCE(SUM(presentase_dari_total), 0) FROM presentase_kategori) as total_kategori_pct,
				(SELECT COUNT(*) FROM presentase_kategori) as jumlah_kategori,
				(SELECT COUNT(*) FROM presentase_unit) as jumlah_unit,
				(SELECT COUNT(DISTINCT id_pegawai) FROM presentase_pegawai) as jumlah_pegawai_aktif
		`);

		// Detail per kategori
		const kategoriDetail = await rawQuery(`
			SELECT 
				pk.id_kategori,
				pk.nama_kategori,
				pk.presentase_dari_total,
				COALESCE(SUM(pu.presentase_dari_kategori), 0) as total_unit_pct,
				COUNT(DISTINCT pu.id_unit) as jumlah_unit,
				COUNT(DISTINCT pp.id_pegawai) as jumlah_pegawai
			FROM presentase_kategori pk
			LEFT JOIN presentase_unit pu ON pk.id_kategori = pu.id_kategori
			LEFT JOIN presentase_pegawai pp ON pu.id_unit = pp.id_unit
			GROUP BY pk.id_kategori
			ORDER BY pk.nama_kategori
		`);

		return NextResponse.json({
			status: "success",
			data: {
				summary: summary[0],
				kategori: kategoriDetail
			}
		});
	} catch (error) {
		console.error("Error fetching summary:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil ringkasan" },
			{ status: 500 }
		);
	}
}

