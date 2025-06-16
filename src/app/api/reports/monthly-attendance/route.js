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
		const limit = parseInt(searchParams.get("limit")) || 50;
		const offset = parseInt(searchParams.get("offset")) || 0;

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
				
				-- Persentase
				ROUND(
					(COUNT(CASE WHEN combined.status = 'Tepat Waktu' THEN 1 END) * 100.0) / 
					NULLIF(COUNT(CASE WHEN combined.source_table IS NOT NULL THEN 1 END), 0), 2
				) as persentase_tepat_waktu,
				
				ROUND(
					(COUNT(CASE WHEN combined.status LIKE '%Terlambat%' THEN 1 END) * 100.0) / 
					NULLIF(COUNT(CASE WHEN combined.source_table IS NOT NULL THEN 1 END), 0), 2
				) as persentase_terlambat,
				
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
			
			WHERE p.stts_aktif IN ('AKTIF', 'CUTI', 'KELUAR')
			${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
			
			GROUP BY p.id, p.nik, p.nama, p.jnj_jabatan, d.dep_id, d.nama
			HAVING total_presensi > 0
			ORDER BY skor_kinerja DESC, tepat_waktu DESC, terlambat ASC
			LIMIT ? OFFSET ?
		`;

		// Prepare parameters for main query
		let mainQueryParams = [month, month];
		if (departmentFilter !== "ALL") {
			mainQueryParams.push(departmentFilter);
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
				COUNT(CASE WHEN combined.status LIKE '%Terlambat%' THEN 1 END) as total_terlambat
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
			
			WHERE p.stts_aktif IN ('AKTIF', 'CUTI', 'KELUAR')
			${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
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
					SELECT id, status FROM temporary_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
					UNION ALL
					SELECT id, status FROM rekap_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
				) as combined ON p.id = combined.id
				WHERE p.stts_aktif IN ('AKTIF', 'CUTI', 'KELUAR')
				${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
				AND combined.id IS NOT NULL
				GROUP BY p.id
			) as scores
		`;

		let summaryParams = [month, month];
		if (departmentFilter !== "ALL") {
			summaryParams.push(departmentFilter);
		}

		const summary = await rawQuery(summaryQuery, summaryParams);

		// Get average score
		let avgScoreParams = [month, month];
		if (departmentFilter !== "ALL") {
			avgScoreParams.push(departmentFilter);
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
				GREATEST(0, 100 - 
					(COUNT(CASE WHEN combined.status = 'Terlambat Toleransi' THEN 1 END) * 5) -
					(COUNT(CASE WHEN combined.status = 'Terlambat I' THEN 1 END) * 10) -
					(COUNT(CASE WHEN combined.status = 'Terlambat II' THEN 1 END) * 15)
				) as skor_kinerja
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN (
				SELECT id, status FROM temporary_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
				UNION ALL
				SELECT id, status FROM rekap_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
			) as combined ON p.id = combined.id
			WHERE p.stts_aktif IN ('AKTIF', 'CUTI', 'KELUAR')
			${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
			GROUP BY p.id
			HAVING COUNT(combined.status) > 0
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
				GREATEST(0, 100 - 
					(COUNT(CASE WHEN combined.status = 'Terlambat Toleransi' THEN 1 END) * 5) -
					(COUNT(CASE WHEN combined.status = 'Terlambat I' THEN 1 END) * 10) -
					(COUNT(CASE WHEN combined.status = 'Terlambat II' THEN 1 END) * 15)
				) as skor_kinerja
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN (
				SELECT id, status FROM temporary_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
				UNION ALL
				SELECT id, status FROM rekap_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
			) as combined ON p.id = combined.id
			WHERE p.stts_aktif IN ('AKTIF', 'CUTI', 'KELUAR')
			${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
			GROUP BY p.id
			HAVING COUNT(combined.status) > 0
			ORDER BY total_terlambat DESC, skor_kinerja ASC
			LIMIT 10
		`;

		const worstPerformers = await rawQuery(worstPerformersQuery, summaryParams);

		// Get departments for filter
		const departmentsQuery = `
			SELECT DISTINCT d.dep_id, d.nama
			FROM departemen d
			JOIN pegawai p ON d.dep_id = p.departemen
			WHERE p.stts_aktif IN ('AKTIF', 'CUTI', 'KELUAR')
			ORDER BY d.nama ASC
		`;

		const departments = await rawQuery(departmentsQuery);

		// Count total records for pagination
		const countQuery = `
			SELECT COUNT(DISTINCT p.id) as total
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN (
				SELECT id FROM temporary_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
				UNION ALL
				SELECT id FROM rekap_presensi WHERE DATE_FORMAT(jam_datang, '%Y-%m') = ?
			) as combined ON p.id = combined.id
			WHERE p.stts_aktif IN ('AKTIF', 'CUTI', 'KELUAR')
			AND combined.id IS NOT NULL
			${departmentFilter !== "ALL" ? "AND d.dep_id = ?" : ""}
		`;

		let countParams = [month, month];
		if (departmentFilter !== "ALL") {
			countParams.push(departmentFilter);
		}

		const totalResult = await rawQuery(countQuery, countParams);
		const total = totalResult[0].total;

		return NextResponse.json({
			status: "success",
			data: {
				attendance: rankedData,
				summary: summaryWithAvg,
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
