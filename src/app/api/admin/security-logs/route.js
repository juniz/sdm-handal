import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { rawQuery } from "@/lib/db-helper";

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

		// Check if user is admin or IT department
		const userId = verified.payload.id;
		const userCheck = await rawQuery(
			"SELECT departemen FROM pegawai WHERE id = ?",
			[userId]
		);

		if (!userCheck[0] || userCheck[0].departemen !== "IT") {
			return NextResponse.json(
				{ error: "Access denied. IT department only." },
				{ status: 403 }
			);
		}

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const date =
			searchParams.get("date") || new Date().toISOString().split("T")[0];
		const riskFilter = searchParams.get("risk") || "ALL";
		const searchEmployee = searchParams.get("search") || "";
		const limit = parseInt(searchParams.get("limit")) || 50;
		const offset = parseInt(searchParams.get("offset")) || 0;

		// Build dynamic query
		let whereConditions = ["DATE(sl.created_at) = ?"];
		let queryParams = [date];

		// Risk level filter
		if (riskFilter !== "ALL") {
			whereConditions.push("sl.risk_level = ?");
			queryParams.push(riskFilter);
		}

		// Employee search
		if (searchEmployee) {
			whereConditions.push("(sl.id_pegawai LIKE ? OR p.nama LIKE ?)");
			queryParams.push(`%${searchEmployee}%`, `%${searchEmployee}%`);
		}

		const whereClause = whereConditions.join(" AND ");

		// Main query to get security logs
		const query = `
			SELECT 
				sl.*,
				p.nama,
				p.departemen
			FROM security_logs sl
			LEFT JOIN pegawai p ON sl.id_pegawai = p.id
			WHERE ${whereClause}
			ORDER BY sl.created_at DESC
			LIMIT ? OFFSET ?
		`;

		queryParams.push(limit, offset);

		const securityLogs = await rawQuery(query, queryParams);

		// Count total records for pagination
		const countQuery = `
			SELECT COUNT(*) as total
			FROM security_logs sl
			LEFT JOIN pegawai p ON sl.id_pegawai = p.id
			WHERE ${whereClause}
		`;

		const countResult = await rawQuery(countQuery, queryParams.slice(0, -2)); // Remove limit and offset
		const total = countResult[0]?.total || 0;

		return NextResponse.json({
			success: true,
			data: securityLogs,
			pagination: {
				total,
				limit,
				offset,
				hasMore: offset + limit < total,
			},
		});
	} catch (error) {
		console.error("Error fetching security logs:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data security logs" },
			{ status: 500 }
		);
	}
}
