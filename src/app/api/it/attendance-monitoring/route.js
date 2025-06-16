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

		// Check if user is from IT department
		const userId = verified.payload.id;
		const userCheck = await rawQuery(
			`SELECT p.departemen, d.nama as departemen_nama 
			 FROM pegawai p 
			 LEFT JOIN departemen d ON p.departemen = d.dep_id 
			 WHERE p.id = ?`,
			[userId]
		);

		if (!userCheck[0] || userCheck[0].departemen !== "IT") {
			return NextResponse.json(
				{ error: "Akses ditolak. Hanya untuk departemen IT." },
				{ status: 403 }
			);
		}

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const date = searchParams.get("date") || moment().format("YYYY-MM-DD");
		const departmentFilter = searchParams.get("department") || "ALL";
		const statusFilter = searchParams.get("status") || "ALL";
		const searchTerm = searchParams.get("search") || "";
		const limit = parseInt(searchParams.get("limit")) || 100;
		const offset = parseInt(searchParams.get("offset")) || 0;

		// Build dynamic query with filters
		let whereConditions = ["DATE(tp.jam_datang) = ?"];
		let queryParams = [date];

		// Department filter
		if (departmentFilter !== "ALL") {
			whereConditions.push("d.dep_id = ?");
			queryParams.push(departmentFilter);
		}

		// Status filter
		if (statusFilter !== "ALL") {
			whereConditions.push("tp.status = ?");
			queryParams.push(statusFilter);
		}

		// Search filter
		if (searchTerm) {
			whereConditions.push("(p.nama LIKE ? OR p.nik LIKE ? OR d.nama LIKE ?)");
			queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
		}

		const whereClause = whereConditions.join(" AND ");

		// Main query for attendance data with UNION to include rekap_presensi
		const attendanceQuery = `
			(
				SELECT 
					tp.id as attendance_id,
					tp.shift,
					tp.jam_datang,
					tp.jam_pulang,
					tp.status,
					tp.keterlambatan,
					tp.durasi,
					tp.photo,
					p.id as pegawai_id,
					p.nik,
					p.nama,
					p.jnj_jabatan,
					d.dep_id as departemen_id,
					d.nama as departemen_nama,
					jm.jam_masuk,
					jm.jam_pulang as jam_pulang_standar,
					CASE 
						WHEN tp.jam_pulang IS NULL THEN 'Belum Checkout'
						WHEN tp.jam_pulang IS NOT NULL THEN 'Sudah Checkout'
					END as checkout_status,
					CASE 
						WHEN tp.status = 'Tepat Waktu' THEN 'success'
						WHEN tp.status LIKE '%Terlambat%' THEN 'danger'
						ELSE 'warning'
					END as status_color,
					'temporary' as source_table
				FROM temporary_presensi tp
				JOIN pegawai p ON tp.id = p.id
				LEFT JOIN departemen d ON p.departemen = d.dep_id
				LEFT JOIN jam_masuk jm ON tp.shift = jm.shift
				WHERE ${whereClause}
			)
			UNION ALL
			(
				SELECT 
					rp.id as attendance_id,
					rp.shift,
					rp.jam_datang,
					rp.jam_pulang,
					rp.status,
					rp.keterlambatan,
					rp.durasi,
					rp.photo,
					p.id as pegawai_id,
					p.nik,
					p.nama,
					p.jnj_jabatan,
					d.dep_id as departemen_id,
					d.nama as departemen_nama,
					jm.jam_masuk,
					jm.jam_pulang as jam_pulang_standar,
					CASE 
						WHEN rp.jam_pulang IS NULL THEN 'Belum Checkout'
						WHEN rp.jam_pulang IS NOT NULL THEN 'Sudah Checkout'
					END as checkout_status,
					CASE 
						WHEN rp.status = 'Tepat Waktu' THEN 'success'
						WHEN rp.status LIKE '%Terlambat%' THEN 'danger'
						ELSE 'warning'
					END as status_color,
					'rekap' as source_table
				FROM rekap_presensi rp
				JOIN pegawai p ON rp.id = p.id
				LEFT JOIN departemen d ON p.departemen = d.dep_id
				LEFT JOIN jam_masuk jm ON rp.shift = jm.shift
				WHERE ${whereClause.replace(/tp\./g, "rp.")}
			)
			ORDER BY jam_datang DESC
			LIMIT ? OFFSET ?
		`;

		queryParams.push(limit, offset);
		// Duplicate the where parameters for both UNION queries, then add limit and offset
		const mainQueryParams = [
			...queryParams.slice(0, -2),
			...queryParams.slice(0, -2),
			limit,
			offset,
		];
		const attendanceData = await rawQuery(attendanceQuery, mainQueryParams);

		// Count total records for pagination with UNION
		const countQuery = `
			SELECT COUNT(*) as total FROM (
				(
					SELECT tp.id
					FROM temporary_presensi tp
					JOIN pegawai p ON tp.id = p.id
					LEFT JOIN departemen d ON p.departemen = d.dep_id
					WHERE ${whereClause}
				)
				UNION ALL
				(
					SELECT rp.id
					FROM rekap_presensi rp
					JOIN pegawai p ON rp.id = p.id
					LEFT JOIN departemen d ON p.departemen = d.dep_id
					WHERE ${whereClause.replace(/tp\./g, "rp.")}
				)
			) as combined_data
		`;

		const countParams = queryParams.slice(0, -2); // Remove limit and offset
		// Duplicate parameters for both UNION queries
		const countParamsWithUnion = [...countParams, ...countParams];
		const totalResult = await rawQuery(countQuery, countParamsWithUnion);
		const total = totalResult[0].total;

		// Get summary statistics with UNION
		const statsQuery = `
			SELECT 
				COUNT(*) as total_attendance,
				COUNT(CASE WHEN status = 'Tepat Waktu' THEN 1 END) as tepat_waktu,
				COUNT(CASE WHEN status LIKE '%Terlambat%' THEN 1 END) as terlambat,
				COUNT(CASE WHEN jam_pulang IS NULL THEN 1 END) as belum_checkout,
				COUNT(CASE WHEN jam_pulang IS NOT NULL THEN 1 END) as sudah_checkout,
				COUNT(DISTINCT departemen_id) as total_departments
			FROM (
				(
					SELECT 
						tp.status,
						tp.jam_pulang,
						d.dep_id as departemen_id
					FROM temporary_presensi tp
					JOIN pegawai p ON tp.id = p.id
					LEFT JOIN departemen d ON p.departemen = d.dep_id
					WHERE DATE(tp.jam_datang) = ?
				)
				UNION ALL
				(
					SELECT 
						rp.status,
						rp.jam_pulang,
						d.dep_id as departemen_id
					FROM rekap_presensi rp
					JOIN pegawai p ON rp.id = p.id
					LEFT JOIN departemen d ON p.departemen = d.dep_id
					WHERE DATE(rp.jam_datang) = ?
				)
			) as combined_stats
		`;

		const stats = await rawQuery(statsQuery, [date, date]);

		// Get departments for filter dropdown with UNION
		const departmentsQuery = `
			SELECT DISTINCT d.dep_id, d.nama
			FROM departemen d
			WHERE d.dep_id IN (
				(
					SELECT DISTINCT p.departemen
					FROM pegawai p
					JOIN temporary_presensi tp ON p.id = tp.id
					WHERE DATE(tp.jam_datang) = ?
				)
				UNION
				(
					SELECT DISTINCT p.departemen
					FROM pegawai p
					JOIN rekap_presensi rp ON p.id = rp.id
					WHERE DATE(rp.jam_datang) = ?
				)
			)
			ORDER BY d.nama ASC
		`;

		const departments = await rawQuery(departmentsQuery, [date, date]);

		return NextResponse.json({
			status: "success",
			data: {
				attendance: attendanceData,
				statistics: stats[0],
				departments: departments,
				pagination: {
					total: total,
					limit: limit,
					offset: offset,
					hasMore: offset + limit < total,
				},
				filters: {
					date: date,
					department: departmentFilter,
					status: statusFilter,
					search: searchTerm,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching attendance monitoring data:", error);
		return NextResponse.json(
			{ error: "Gagal mengambil data monitoring presensi" },
			{ status: 500 }
		);
	}
}
