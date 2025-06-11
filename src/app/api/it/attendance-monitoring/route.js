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

		// Main query for attendance data
		const attendanceQuery = `
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
				END as status_color
			FROM temporary_presensi tp
			JOIN pegawai p ON tp.id = p.id
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN jam_masuk jm ON tp.shift = jm.shift
			WHERE ${whereClause}
			ORDER BY tp.jam_datang DESC
			LIMIT ? OFFSET ?
		`;

		queryParams.push(limit, offset);
		const attendanceData = await rawQuery(attendanceQuery, queryParams);

		// Count total records for pagination
		const countQuery = `
			SELECT COUNT(*) as total
			FROM temporary_presensi tp
			JOIN pegawai p ON tp.id = p.id
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE ${whereClause}
		`;

		const countParams = queryParams.slice(0, -2); // Remove limit and offset
		const totalResult = await rawQuery(countQuery, countParams);
		const total = totalResult[0].total;

		// Get summary statistics
		const statsQuery = `
			SELECT 
				COUNT(*) as total_attendance,
				COUNT(CASE WHEN tp.status = 'Tepat Waktu' THEN 1 END) as tepat_waktu,
				COUNT(CASE WHEN tp.status LIKE '%Terlambat%' THEN 1 END) as terlambat,
				COUNT(CASE WHEN tp.jam_pulang IS NULL THEN 1 END) as belum_checkout,
				COUNT(CASE WHEN tp.jam_pulang IS NOT NULL THEN 1 END) as sudah_checkout,
				COUNT(DISTINCT d.dep_id) as total_departments
			FROM temporary_presensi tp
			JOIN pegawai p ON tp.id = p.id
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE DATE(tp.jam_datang) = ?
		`;

		const stats = await rawQuery(statsQuery, [date]);

		// Get departments for filter dropdown
		const departmentsQuery = `
			SELECT DISTINCT d.dep_id, d.nama
			FROM departemen d
			JOIN pegawai p ON d.dep_id = p.departemen
			JOIN temporary_presensi tp ON p.id = tp.id
			WHERE DATE(tp.jam_datang) = ?
			ORDER BY d.nama ASC
		`;

		const departments = await rawQuery(departmentsQuery, [date]);

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
