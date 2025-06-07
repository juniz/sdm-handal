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

		// Get daily statistics
		const statsQuery = `
			SELECT 
				DATE(created_at) as tanggal,
				COUNT(*) as total_aktivitas,
				COUNT(CASE WHEN action_type = 'CHECKIN' THEN 1 END) as total_checkin,
				COUNT(CASE WHEN action_type = 'CHECKOUT' THEN 1 END) as total_checkout,
				COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) as high_risk,
				COUNT(CASE WHEN risk_level = 'MEDIUM' THEN 1 END) as medium_risk,
				COUNT(CASE WHEN risk_level = 'LOW' THEN 1 END) as low_risk,
				AVG(confidence_level) as avg_confidence,
				MIN(confidence_level) as min_confidence,
				MAX(confidence_level) as max_confidence,
				AVG(gps_accuracy) as avg_gps_accuracy,
				COUNT(DISTINCT id_pegawai) as unique_employees
			FROM security_logs
			WHERE DATE(created_at) = ?
			GROUP BY DATE(created_at)
		`;

		const statsResult = await rawQuery(statsQuery, [date]);
		const dailyStats = statsResult[0] || {
			tanggal: date,
			total_aktivitas: 0,
			total_checkin: 0,
			total_checkout: 0,
			high_risk: 0,
			medium_risk: 0,
			low_risk: 0,
			avg_confidence: 0,
			min_confidence: 0,
			max_confidence: 0,
			avg_gps_accuracy: 0,
			unique_employees: 0,
		};

		// Get weekly trend (last 7 days)
		const weeklyTrendQuery = `
			SELECT 
				DATE(created_at) as tanggal,
				COUNT(*) as total_aktivitas,
				COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) as high_risk,
				AVG(confidence_level) as avg_confidence
			FROM security_logs
			WHERE DATE(created_at) >= DATE_SUB(?, INTERVAL 6 DAY)
			AND DATE(created_at) <= ?
			GROUP BY DATE(created_at)
			ORDER BY DATE(created_at) ASC
		`;

		const weeklyTrend = await rawQuery(weeklyTrendQuery, [date, date]);

		// Get top risk locations
		const topRiskLocationsQuery = `
			SELECT 
				ROUND(latitude, 4) as lat,
				ROUND(longitude, 4) as lng,
				COUNT(*) as frequency,
				COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) as high_risk_count,
				AVG(confidence_level) as avg_confidence
			FROM security_logs
			WHERE DATE(created_at) = ?
			AND risk_level IN ('HIGH', 'MEDIUM')
			GROUP BY ROUND(latitude, 4), ROUND(longitude, 4)
			HAVING high_risk_count > 0
			ORDER BY high_risk_count DESC, frequency DESC
			LIMIT 10
		`;

		const topRiskLocations = await rawQuery(topRiskLocationsQuery, [date]);

		// Get hourly distribution
		const hourlyDistributionQuery = `
			SELECT 
				HOUR(created_at) as hour,
				COUNT(*) as count,
				COUNT(CASE WHEN risk_level = 'HIGH' THEN 1 END) as high_risk_count
			FROM security_logs
			WHERE DATE(created_at) = ?
			GROUP BY HOUR(created_at)
			ORDER BY hour
		`;

		const hourlyDistribution = await rawQuery(hourlyDistributionQuery, [date]);

		return NextResponse.json({
			success: true,
			data: {
				...dailyStats,
				weekly_trend: weeklyTrend,
				top_risk_locations: topRiskLocations,
				hourly_distribution: hourlyDistribution,
			},
		});
	} catch (error) {
		console.error("Error fetching security stats:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil statistik keamanan" },
			{ status: 500 }
		);
	}
}
