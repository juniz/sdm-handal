import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { rawQuery } from "@/lib/db-helper";
import moment from "moment";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request) {
	try {
		const cookieStore = cookies();
		const token = await cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const verified = await jwtVerify(
			token,
			new TextEncoder().encode(JWT_SECRET)
		);

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const month = searchParams.get("month") || moment().format("YYYY-MM");
		const departmentFilter = searchParams.get("department") || "ALL";
		const search = searchParams.get("search") || "";
		const limit = parseInt(searchParams.get("limit")) || 50;
		const offset = parseInt(searchParams.get("offset")) || 0;

		// Parse month to get year and month number
		const [year, monthNum] = month.split("-");

		// Build dynamic query with filters
		let whereConditions = [
			"(DATE_FORMAT(tp.jam_datang, '%Y-%m') = ? OR DATE_FORMAT(rp.jam_datang, '%Y-%m') = ?)",
		];
		let queryParams = [month, month];

		// Department filter
		if (departmentFilter !== "ALL") {
			whereConditions.push("d.dep_id = ?");
			queryParams.push(departmentFilter);
		}

		// Search filter
		if (search.trim()) {
			whereConditions.push("(p.nama LIKE ? OR p.nik LIKE ?)");
			const searchTerm = `%${search.trim()}%`;
			queryParams.push(searchTerm, searchTerm);
		}

		const whereClause = whereConditions.join(" AND ");

		// Main query for monthly attendance summary with ranking
		const attendanceQuery = `
			SELECT 
				p.id as pegawai_id,
				p.nik,
				p.nama,
				p.jnj_jabatan,
				d.dep_id as departemen_id,
				d.nama as departemen_nama,
				
				-- Statistik Presensi
				COUNT(CASE WHEN combined.source_table IS NOT NULL THEN 1 END) as total_presensi,
				COUNT(CASE WHEN combined.status = 'Tepat Waktu' THEN 1 END) as tepat_waktu,
				COUNT(CASE WHEN combined.status LIKE '%Terlambat%' THEN 1 END) as terlambat,
				COUNT(CASE WHEN combined.status = 'Terlambat Toleransi' THEN 1 END) as terlambat_toleransi,
				COUNT(CASE WHEN combined.status = 'Terlambat I' THEN 1 END) as terlambat_1,
				COUNT(CASE WHEN combined.status = 'Terlambat II' THEN 1 END) as terlambat_2,
				
				-- Jumlah Jadwal Masuk
				COALESCE(jp.jumlah_jadwal, 0) as jumlah_jadwal_masuk,
				
				-- Pegawai Tidak Presensi
				CASE 
					WHEN COALESCE(jp.jumlah_jadwal, 0) > 0 AND COUNT(CASE WHEN combined.source_table IS NOT NULL THEN 1 END) = 0 
					THEN COALESCE(jp.jumlah_jadwal, 0)
					ELSE 0 
				END as tidak_presensi,
				
				-- Persentase
				ROUND(
					(COUNT(CASE WHEN combined.status = 'Tepat Waktu' THEN 1 END) * 100.0) / 
					NULLIF(COUNT(CASE WHEN combined.source_table IS NOT NULL THEN 1 END), 0), 2
				) as persentase_tepat_waktu,
				
				ROUND(
					(COUNT(CASE WHEN combined.status LIKE '%Terlambat%' THEN 1 END) * 100.0) / 
					NULLIF(COUNT(CASE WHEN combined.source_table IS NOT NULL THEN 1 END), 0), 2
				) as persentase_terlambat,
				
				-- Persentase Kehadiran (berdasarkan jadwal)
				ROUND(
					(COUNT(CASE WHEN combined.source_table IS NOT NULL THEN 1 END) * 100.0) / 
					NULLIF(COALESCE(jp.jumlah_jadwal, 0), 0), 2
				) as persentase_kehadiran,
				
				-- Skor Kinerja (100 - (terlambat * 5) - (terlambat_1 * 10) - (terlambat_2 * 15))
				GREATEST(0, 100 - 
					(COUNT(CASE WHEN combined.status = 'Terlambat Toleransi' THEN 1 END) * 5) -
					(COUNT(CASE WHEN combined.status = 'Terlambat I' THEN 1 END) * 10) -
					(COUNT(CASE WHEN combined.status = 'Terlambat II' THEN 1 END) * 15)
				) as skor_kinerja
				
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN (
				-- Data dari temporary_presensi
				SELECT 
					tp.id,
					tp.status,
					tp.jam_datang,
					'temporary' as source_table
				FROM temporary_presensi tp
				WHERE DATE_FORMAT(tp.jam_datang, '%Y-%m') = ?
				
				UNION ALL
				
				-- Data dari rekap_presensi
				SELECT 
					rp.id,
					rp.status,
					rp.jam_datang,
					'rekap' as source_table
				FROM rekap_presensi rp
				WHERE DATE_FORMAT(rp.jam_datang, '%Y-%m') = ?
			) as combined ON p.id = combined.id
			LEFT JOIN (
				-- Jumlah jadwal masuk dari jadwal_pegawai
				SELECT 
					jp.id,
					(
						(CASE WHEN jp.h1 IS NOT NULL AND jp.h1 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h2 IS NOT NULL AND jp.h2 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h3 IS NOT NULL AND jp.h3 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h4 IS NOT NULL AND jp.h4 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h5 IS NOT NULL AND jp.h5 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h6 IS NOT NULL AND jp.h6 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h7 IS NOT NULL AND jp.h7 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h8 IS NOT NULL AND jp.h8 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h9 IS NOT NULL AND jp.h9 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h10 IS NOT NULL AND jp.h10 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h11 IS NOT NULL AND jp.h11 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h12 IS NOT NULL AND jp.h12 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h13 IS NOT NULL AND jp.h13 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h14 IS NOT NULL AND jp.h14 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h15 IS NOT NULL AND jp.h15 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h16 IS NOT NULL AND jp.h16 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h17 IS NOT NULL AND jp.h17 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h18 IS NOT NULL AND jp.h18 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h19 IS NOT NULL AND jp.h19 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h20 IS NOT NULL AND jp.h20 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h21 IS NOT NULL AND jp.h21 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h22 IS NOT NULL AND jp.h22 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h23 IS NOT NULL AND jp.h23 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h24 IS NOT NULL AND jp.h24 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h25 IS NOT NULL AND jp.h25 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h26 IS NOT NULL AND jp.h26 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h27 IS NOT NULL AND jp.h27 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h28 IS NOT NULL AND jp.h28 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h29 IS NOT NULL AND jp.h29 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h30 IS NOT NULL AND jp.h30 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h31 IS NOT NULL AND jp.h31 != '' THEN 1 ELSE 0 END)
					) as jumlah_jadwal
				FROM jadwal_pegawai jp
				WHERE jp.tahun = ? AND jp.bulan = ?
			) as jp ON p.id = jp.id
			
					WHERE p.stts_aktif = 'AKTIF'
		${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
		${search.trim() ? "AND (p.nama LIKE ? OR p.nik LIKE ?)" : ""}
		
		GROUP BY p.id, p.nik, p.nama, p.jnj_jabatan, d.dep_id, d.nama, jp.jumlah_jadwal
			HAVING total_presensi > 0 OR COALESCE(jp.jumlah_jadwal, 0) > 0
			ORDER BY skor_kinerja DESC, tepat_waktu DESC, terlambat ASC
			LIMIT ? OFFSET ?
		`;

		// Prepare parameters for main query
		let mainQueryParams = [month, month, year, monthNum];
		if (departmentFilter !== "ALL") {
			mainQueryParams.push(departmentFilter);
		}
		if (search.trim()) {
			const searchTerm = `%${search.trim()}%`;
			mainQueryParams.push(searchTerm, searchTerm);
		}
		mainQueryParams.push(limit, offset);

		const attendanceData = await rawQuery(attendanceQuery, mainQueryParams);

		// Add ranking to the results
		const rankedData = attendanceData.map((item, index) => ({
			...item,
			ranking: offset + index + 1,
		}));

		// Get summary statistics
		const summaryQuery = `
			SELECT 
				COUNT(DISTINCT CASE WHEN combined.source_table IS NOT NULL THEN p.id END) as total_pegawai,
				COUNT(CASE WHEN combined.source_table IS NOT NULL THEN 1 END) as total_presensi_bulan,
				COUNT(CASE WHEN combined.status = 'Tepat Waktu' THEN 1 END) as total_tepat_waktu,
				COUNT(CASE WHEN combined.status LIKE '%Terlambat%' THEN 1 END) as total_terlambat,
				SUM(COALESCE(jp.jumlah_jadwal, 0)) as total_jadwal_masuk,
				COUNT(DISTINCT CASE WHEN COALESCE(jp.jumlah_jadwal, 0) > 0 THEN p.id END) as total_pegawai_berjadwal,
				COUNT(DISTINCT CASE WHEN COALESCE(jp.jumlah_jadwal, 0) > 0 AND combined.source_table IS NULL THEN p.id END) as total_pegawai_tidak_presensi
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN (
				SELECT id, status, 'temporary' as source_table
				FROM temporary_presensi
				WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
				
				UNION ALL
				
				SELECT id, status, 'rekap' as source_table
				FROM rekap_presensi
				WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
			) as combined ON p.id = combined.id
			LEFT JOIN (
				-- Jumlah jadwal masuk dari jadwal_pegawai
				SELECT 
					jp.id,
					(
						(CASE WHEN jp.h1 IS NOT NULL AND jp.h1 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h2 IS NOT NULL AND jp.h2 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h3 IS NOT NULL AND jp.h3 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h4 IS NOT NULL AND jp.h4 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h5 IS NOT NULL AND jp.h5 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h6 IS NOT NULL AND jp.h6 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h7 IS NOT NULL AND jp.h7 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h8 IS NOT NULL AND jp.h8 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h9 IS NOT NULL AND jp.h9 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h10 IS NOT NULL AND jp.h10 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h11 IS NOT NULL AND jp.h11 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h12 IS NOT NULL AND jp.h12 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h13 IS NOT NULL AND jp.h13 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h14 IS NOT NULL AND jp.h14 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h15 IS NOT NULL AND jp.h15 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h16 IS NOT NULL AND jp.h16 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h17 IS NOT NULL AND jp.h17 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h18 IS NOT NULL AND jp.h18 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h19 IS NOT NULL AND jp.h19 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h20 IS NOT NULL AND jp.h20 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h21 IS NOT NULL AND jp.h21 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h22 IS NOT NULL AND jp.h22 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h23 IS NOT NULL AND jp.h23 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h24 IS NOT NULL AND jp.h24 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h25 IS NOT NULL AND jp.h25 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h26 IS NOT NULL AND jp.h26 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h27 IS NOT NULL AND jp.h27 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h28 IS NOT NULL AND jp.h28 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h29 IS NOT NULL AND jp.h29 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h30 IS NOT NULL AND jp.h30 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h31 IS NOT NULL AND jp.h31 != '' THEN 1 ELSE 0 END)
					) as jumlah_jadwal
				FROM jadwal_pegawai jp
				WHERE jp.tahun = ? AND jp.bulan = ?
			) as jp ON p.id = jp.id
			
			WHERE p.stts_aktif = 'AKTIF'
			${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
			${search.trim() ? "AND (p.nama LIKE ? OR p.nik LIKE ?)" : ""}
		`;

		// Get average score separately
		const avgScoreQuery = `
			SELECT 
				ROUND(AVG(skor_kinerja), 2) as rata_rata_skor
			FROM (
				SELECT 
					p.id,
					GREATEST(0, 100 - 
						(COUNT(CASE WHEN combined.status = 'Terlambat Toleransi' THEN 1 END) * 5) -
						(COUNT(CASE WHEN combined.status = 'Terlambat I' THEN 1 END) * 10) -
						(COUNT(CASE WHEN combined.status = 'Terlambat II' THEN 1 END) * 15)
					) as skor_kinerja
				FROM pegawai p
				LEFT JOIN departemen d ON p.departemen = d.dep_id
				LEFT JOIN (
					SELECT id, status, 'temporary' as source_table FROM temporary_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
					UNION ALL
					SELECT id, status, 'rekap' as source_table FROM rekap_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
				) as combined ON p.id = combined.id
				LEFT JOIN (
					-- Jumlah jadwal masuk dari jadwal_pegawai
					SELECT 
						jp.id,
						(
							(CASE WHEN jp.h1 IS NOT NULL AND jp.h1 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h2 IS NOT NULL AND jp.h2 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h3 IS NOT NULL AND jp.h3 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h4 IS NOT NULL AND jp.h4 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h5 IS NOT NULL AND jp.h5 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h6 IS NOT NULL AND jp.h6 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h7 IS NOT NULL AND jp.h7 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h8 IS NOT NULL AND jp.h8 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h9 IS NOT NULL AND jp.h9 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h10 IS NOT NULL AND jp.h10 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h11 IS NOT NULL AND jp.h11 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h12 IS NOT NULL AND jp.h12 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h13 IS NOT NULL AND jp.h13 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h14 IS NOT NULL AND jp.h14 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h15 IS NOT NULL AND jp.h15 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h16 IS NOT NULL AND jp.h16 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h17 IS NOT NULL AND jp.h17 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h18 IS NOT NULL AND jp.h18 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h19 IS NOT NULL AND jp.h19 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h20 IS NOT NULL AND jp.h20 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h21 IS NOT NULL AND jp.h21 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h22 IS NOT NULL AND jp.h22 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h23 IS NOT NULL AND jp.h23 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h24 IS NOT NULL AND jp.h24 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h25 IS NOT NULL AND jp.h25 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h26 IS NOT NULL AND jp.h26 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h27 IS NOT NULL AND jp.h27 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h28 IS NOT NULL AND jp.h28 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h29 IS NOT NULL AND jp.h29 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h30 IS NOT NULL AND jp.h30 != '' THEN 1 ELSE 0 END) +
							(CASE WHEN jp.h31 IS NOT NULL AND jp.h31 != '' THEN 1 ELSE 0 END)
						) as jumlah_jadwal
					FROM jadwal_pegawai jp
					WHERE jp.tahun = ? AND jp.bulan = ?
				) as jp ON p.id = jp.id
				WHERE p.stts_aktif = 'AKTIF'
				${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
				${search.trim() ? "AND (p.nama LIKE ? OR p.nik LIKE ?)" : ""}
				AND (combined.id IS NOT NULL OR COALESCE(jp.jumlah_jadwal, 0) > 0)
				GROUP BY p.id, jp.jumlah_jadwal
			) as scores
		`;

		let summaryParams = [month, month, year, monthNum];
		if (departmentFilter !== "ALL") {
			summaryParams.push(departmentFilter);
		}
		if (search.trim()) {
			const searchTerm = `%${search.trim()}%`;
			summaryParams.push(searchTerm, searchTerm);
		}

		const summary = await rawQuery(summaryQuery, summaryParams);

		// Get average score
		let avgScoreParams = [month, month, year, monthNum];
		if (departmentFilter !== "ALL") {
			avgScoreParams.push(departmentFilter);
		}
		if (search.trim()) {
			const searchTerm = `%${search.trim()}%`;
			avgScoreParams.push(searchTerm, searchTerm);
		}
		const avgScoreResult = await rawQuery(avgScoreQuery, avgScoreParams);

		// Combine summary with average score
		const summaryWithAvg = {
			...summary[0],
			rata_rata_skor: avgScoreResult[0]?.rata_rata_skor || 0,
		};

		// Get top performers
		const topPerformersQuery = `
			SELECT 
				p.nama,
				p.nik,
				d.nama as departemen_nama,
				COUNT(CASE WHEN combined.status = 'Tepat Waktu' THEN 1 END) as tepat_waktu,
				COALESCE(jp.jumlah_jadwal, 0) as jumlah_jadwal_masuk,
				GREATEST(0, 100 - 
					(COUNT(CASE WHEN combined.status = 'Terlambat Toleransi' THEN 1 END) * 5) -
					(COUNT(CASE WHEN combined.status = 'Terlambat I' THEN 1 END) * 10) -
					(COUNT(CASE WHEN combined.status = 'Terlambat II' THEN 1 END) * 15)
				) as skor_kinerja
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN (
				SELECT id, status, 'temporary' as source_table FROM temporary_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
				UNION ALL
				SELECT id, status, 'rekap' as source_table FROM rekap_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
			) as combined ON p.id = combined.id
			LEFT JOIN (
				-- Jumlah jadwal masuk dari jadwal_pegawai
				SELECT 
					jp.id,
					(
						(CASE WHEN jp.h1 IS NOT NULL AND jp.h1 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h2 IS NOT NULL AND jp.h2 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h3 IS NOT NULL AND jp.h3 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h4 IS NOT NULL AND jp.h4 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h5 IS NOT NULL AND jp.h5 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h6 IS NOT NULL AND jp.h6 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h7 IS NOT NULL AND jp.h7 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h8 IS NOT NULL AND jp.h8 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h9 IS NOT NULL AND jp.h9 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h10 IS NOT NULL AND jp.h10 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h11 IS NOT NULL AND jp.h11 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h12 IS NOT NULL AND jp.h12 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h13 IS NOT NULL AND jp.h13 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h14 IS NOT NULL AND jp.h14 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h15 IS NOT NULL AND jp.h15 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h16 IS NOT NULL AND jp.h16 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h17 IS NOT NULL AND jp.h17 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h18 IS NOT NULL AND jp.h18 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h19 IS NOT NULL AND jp.h19 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h20 IS NOT NULL AND jp.h20 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h21 IS NOT NULL AND jp.h21 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h22 IS NOT NULL AND jp.h22 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h23 IS NOT NULL AND jp.h23 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h24 IS NOT NULL AND jp.h24 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h25 IS NOT NULL AND jp.h25 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h26 IS NOT NULL AND jp.h26 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h27 IS NOT NULL AND jp.h27 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h28 IS NOT NULL AND jp.h28 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h29 IS NOT NULL AND jp.h29 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h30 IS NOT NULL AND jp.h30 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h31 IS NOT NULL AND jp.h31 != '' THEN 1 ELSE 0 END)
					) as jumlah_jadwal
				FROM jadwal_pegawai jp
				WHERE jp.tahun = ? AND jp.bulan = ?
			) as jp ON p.id = jp.id
			WHERE p.stts_aktif = 'AKTIF'
			${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
			${search.trim() ? "AND (p.nama LIKE ? OR p.nik LIKE ?)" : ""}
			GROUP BY p.id, jp.jumlah_jadwal
			HAVING COUNT(combined.status) > 0 OR COALESCE(jp.jumlah_jadwal, 0) > 0
			ORDER BY skor_kinerja DESC, tepat_waktu DESC
			LIMIT 10
		`;

		const topPerformers = await rawQuery(topPerformersQuery, summaryParams);

		// Get worst performers (most late)
		const worstPerformersQuery = `
			SELECT 
				p.nama,
				p.nik,
				d.nama as departemen_nama,
				COUNT(CASE WHEN combined.status LIKE '%Terlambat%' THEN 1 END) as total_terlambat,
				COALESCE(jp.jumlah_jadwal, 0) as jumlah_jadwal_masuk,
				CASE 
					WHEN COALESCE(jp.jumlah_jadwal, 0) > 0 AND COUNT(CASE WHEN combined.source_table IS NOT NULL THEN 1 END) = 0 
					THEN COALESCE(jp.jumlah_jadwal, 0)
					ELSE 0 
				END as tidak_presensi,
				GREATEST(0, 100 - 
					(COUNT(CASE WHEN combined.status = 'Terlambat Toleransi' THEN 1 END) * 5) -
					(COUNT(CASE WHEN combined.status = 'Terlambat I' THEN 1 END) * 10) -
					(COUNT(CASE WHEN combined.status = 'Terlambat II' THEN 1 END) * 15)
				) as skor_kinerja
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN (
				SELECT id, status, 'temporary' as source_table FROM temporary_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
				UNION ALL
				SELECT id, status, 'rekap' as source_table FROM rekap_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
			) as combined ON p.id = combined.id
			LEFT JOIN (
				-- Jumlah jadwal masuk dari jadwal_pegawai
				SELECT 
					jp.id,
					(
						(CASE WHEN jp.h1 IS NOT NULL AND jp.h1 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h2 IS NOT NULL AND jp.h2 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h3 IS NOT NULL AND jp.h3 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h4 IS NOT NULL AND jp.h4 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h5 IS NOT NULL AND jp.h5 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h6 IS NOT NULL AND jp.h6 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h7 IS NOT NULL AND jp.h7 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h8 IS NOT NULL AND jp.h8 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h9 IS NOT NULL AND jp.h9 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h10 IS NOT NULL AND jp.h10 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h11 IS NOT NULL AND jp.h11 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h12 IS NOT NULL AND jp.h12 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h13 IS NOT NULL AND jp.h13 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h14 IS NOT NULL AND jp.h14 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h15 IS NOT NULL AND jp.h15 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h16 IS NOT NULL AND jp.h16 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h17 IS NOT NULL AND jp.h17 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h18 IS NOT NULL AND jp.h18 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h19 IS NOT NULL AND jp.h19 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h20 IS NOT NULL AND jp.h20 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h21 IS NOT NULL AND jp.h21 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h22 IS NOT NULL AND jp.h22 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h23 IS NOT NULL AND jp.h23 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h24 IS NOT NULL AND jp.h24 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h25 IS NOT NULL AND jp.h25 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h26 IS NOT NULL AND jp.h26 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h27 IS NOT NULL AND jp.h27 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h28 IS NOT NULL AND jp.h28 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h29 IS NOT NULL AND jp.h29 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h30 IS NOT NULL AND jp.h30 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h31 IS NOT NULL AND jp.h31 != '' THEN 1 ELSE 0 END)
					) as jumlah_jadwal
				FROM jadwal_pegawai jp
				WHERE jp.tahun = ? AND jp.bulan = ?
			) as jp ON p.id = jp.id
			WHERE p.stts_aktif = 'AKTIF'
			${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
			${search.trim() ? "AND (p.nama LIKE ? OR p.nik LIKE ?)" : ""}
			GROUP BY p.id, jp.jumlah_jadwal
			HAVING COUNT(combined.status) > 0 OR COALESCE(jp.jumlah_jadwal, 0) > 0
			ORDER BY total_terlambat DESC, skor_kinerja ASC
			LIMIT 10
		`;

		const worstPerformers = await rawQuery(worstPerformersQuery, summaryParams);

		// Get departments for filter
		const departmentsQuery = `
			SELECT DISTINCT d.dep_id, d.nama
			FROM departemen d
			JOIN pegawai p ON d.dep_id = p.departemen
			WHERE p.stts_aktif = 'AKTIF'
			ORDER BY d.nama ASC
		`;

		const departments = await rawQuery(departmentsQuery);

		// Count total records for pagination
		const countQuery = `
			SELECT COUNT(DISTINCT p.id) as total
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN (
				SELECT id, 'temporary' as source_table FROM temporary_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
				UNION ALL
				SELECT id, 'rekap' as source_table FROM rekap_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
			) as combined ON p.id = combined.id
			LEFT JOIN (
				-- Jumlah jadwal masuk dari jadwal_pegawai
				SELECT 
					jp.id,
					(
						(CASE WHEN jp.h1 IS NOT NULL AND jp.h1 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h2 IS NOT NULL AND jp.h2 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h3 IS NOT NULL AND jp.h3 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h4 IS NOT NULL AND jp.h4 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h5 IS NOT NULL AND jp.h5 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h6 IS NOT NULL AND jp.h6 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h7 IS NOT NULL AND jp.h7 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h8 IS NOT NULL AND jp.h8 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h9 IS NOT NULL AND jp.h9 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h10 IS NOT NULL AND jp.h10 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h11 IS NOT NULL AND jp.h11 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h12 IS NOT NULL AND jp.h12 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h13 IS NOT NULL AND jp.h13 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h14 IS NOT NULL AND jp.h14 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h15 IS NOT NULL AND jp.h15 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h16 IS NOT NULL AND jp.h16 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h17 IS NOT NULL AND jp.h17 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h18 IS NOT NULL AND jp.h18 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h19 IS NOT NULL AND jp.h19 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h20 IS NOT NULL AND jp.h20 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h21 IS NOT NULL AND jp.h21 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h22 IS NOT NULL AND jp.h22 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h23 IS NOT NULL AND jp.h23 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h24 IS NOT NULL AND jp.h24 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h25 IS NOT NULL AND jp.h25 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h26 IS NOT NULL AND jp.h26 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h27 IS NOT NULL AND jp.h27 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h28 IS NOT NULL AND jp.h28 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h29 IS NOT NULL AND jp.h29 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h30 IS NOT NULL AND jp.h30 != '' THEN 1 ELSE 0 END) +
						(CASE WHEN jp.h31 IS NOT NULL AND jp.h31 != '' THEN 1 ELSE 0 END)
					) as jumlah_jadwal
				FROM jadwal_pegawai jp
				WHERE jp.tahun = ? AND jp.bulan = ?
			) as jp ON p.id = jp.id
			WHERE p.stts_aktif = 'AKTIF'
			AND (combined.id IS NOT NULL OR COALESCE(jp.jumlah_jadwal, 0) > 0)
			${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
			${search.trim() ? "AND (p.nama LIKE ? OR p.nik LIKE ?)" : ""}
		`;

		let countParams = [month, month, year, monthNum];
		if (departmentFilter !== "ALL") {
			countParams.push(departmentFilter);
		}
		if (search.trim()) {
			const searchTerm = `%${search.trim()}%`;
			countParams.push(searchTerm, searchTerm);
		}

		const totalResult = await rawQuery(countQuery, countParams);
		const total = totalResult[0].total;

		return NextResponse.json({
			status: "success",
			data: {
				attendance: rankedData,
				summary: {
					...summaryWithAvg,
					total_jadwal_masuk: summary[0]?.total_jadwal_masuk || 0,
					total_pegawai_berjadwal: summary[0]?.total_pegawai_berjadwal || 0,
					total_pegawai_tidak_presensi:
						summary[0]?.total_pegawai_tidak_presensi || 0,
				},
				topPerformers: topPerformers,
				worstPerformers: worstPerformers,
				departments: departments,
				pagination: {
					total: total,
					limit: limit,
					offset: offset,
					hasMore: offset + limit < total,
				},
				filters: {
					month: month,
					department: departmentFilter,
					search: search,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching monthly attendance report:", error);
		return NextResponse.json(
			{ error: "Gagal mengambil data laporan presensi bulanan" },
			{ status: 500 }
		);
	}
}
