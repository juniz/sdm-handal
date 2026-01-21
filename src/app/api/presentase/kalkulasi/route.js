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

		const { total_jasa, tanggal } = await request.json();

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
				pp.berlaku_mulai,
				pp.berlaku_selesai,
				-- Kalkulasi nominal
				ROUND(? * (pk.presentase_dari_total / 100), 2) as nominal_kategori,
				ROUND(
					? * 
					(pk.presentase_dari_total / 100) * 
					(pu.presentase_dari_kategori / 100), 
					2
				) as nominal_unit,
				ROUND(
					? * 
					(pk.presentase_dari_total / 100) * 
					(pu.presentase_dari_kategori / 100) * 
					(pp.presentase_dari_unit / 100), 
					2
				) as nominal_pegawai
			FROM presentase_kategori pk
			LEFT JOIN presentase_unit pu ON pk.id_kategori = pu.id_kategori
			LEFT JOIN departemen d ON pu.dep_id = d.dep_id
			LEFT JOIN presentase_pegawai pp ON pu.id_unit = pp.id_unit
				AND pp.berlaku_mulai <= ?
				AND (pp.berlaku_selesai IS NULL OR pp.berlaku_selesai >= ?)
			LEFT JOIN pegawai p ON pp.id_pegawai = p.id
			ORDER BY pk.nama_kategori, d.nama, p.nama
		`, [total_jasa, total_jasa, total_jasa, tanggalKalkulasi, tanggalKalkulasi]);

		// Kelompokkan data per kategori
		const groupedData = {};
		let totalDistribusi = 0;

		distribusi.forEach(row => {
			if (!groupedData[row.id_kategori]) {
				groupedData[row.id_kategori] = {
					id_kategori: row.id_kategori,
					nama_kategori: row.nama_kategori,
					presentase: row.presentase_dari_total,
					nominal: row.nominal_kategori,
					units: {}
				};
			}

			if (row.id_unit && !groupedData[row.id_kategori].units[row.id_unit]) {
				groupedData[row.id_kategori].units[row.id_unit] = {
					id_unit: row.id_unit,
					dep_id: row.dep_id,
					nama_departemen: row.nama_departemen,
					presentase: row.presentase_dari_kategori,
					nominal: row.nominal_unit,
					pegawai: []
				};
			}

			if (row.id_alokasi && row.id_pegawai) {
				groupedData[row.id_kategori].units[row.id_unit].pegawai.push({
					id_alokasi: row.id_alokasi,
					id_pegawai: row.id_pegawai,
					nik: row.nik,
					nama: row.nama_pegawai,
					presentase: row.presentase_dari_unit,
					nominal: row.nominal_pegawai,
					berlaku_mulai: row.berlaku_mulai,
					berlaku_selesai: row.berlaku_selesai
				});
				totalDistribusi += parseFloat(row.nominal_pegawai || 0);
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
				(SELECT COUNT(DISTINCT id_pegawai) FROM presentase_pegawai 
					WHERE berlaku_selesai IS NULL OR berlaku_selesai >= CURDATE()) as jumlah_pegawai_aktif
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
				AND (pp.berlaku_selesai IS NULL OR pp.berlaku_selesai >= CURDATE())
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

