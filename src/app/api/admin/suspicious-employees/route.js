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
		const days = parseInt(searchParams.get("days")) || 30;
		const minHighRisk = parseInt(searchParams.get("min_high_risk")) || 1;
		const maxConfidence = parseInt(searchParams.get("max_confidence")) || 60;

		// Query for suspicious employees
		const suspiciousQuery = `
			SELECT 
				sl.id_pegawai,
				p.nama_lengkap,
				p.departemen,
				COUNT(*) as total_aktivitas,
				COUNT(CASE WHEN sl.risk_level = 'HIGH' THEN 1 END) as high_risk_count,
				COUNT(CASE WHEN sl.risk_level = 'MEDIUM' THEN 1 END) as medium_risk_count,
				COUNT(CASE WHEN sl.risk_level = 'LOW' THEN 1 END) as low_risk_count,
				AVG(sl.confidence_level) as avg_confidence,
				MIN(sl.confidence_level) as min_confidence,
				MAX(sl.confidence_level) as max_confidence,
				AVG(sl.gps_accuracy) as avg_gps_accuracy,
				MAX(sl.created_at) as last_activity,
				MIN(sl.created_at) as first_activity,
				GROUP_CONCAT(
					DISTINCT sl.risk_level 
					ORDER BY sl.created_at DESC 
					SEPARATOR ','
				) as recent_risk_levels,
				GROUP_CONCAT(
					DISTINCT DATE(sl.created_at)
					ORDER BY sl.created_at DESC
					SEPARATOR ','
				) as activity_dates
			FROM security_logs sl
			LEFT JOIN pegawai p ON sl.id_pegawai = p.id
			WHERE sl.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
			GROUP BY sl.id_pegawai, p.nama_lengkap, p.departemen
			HAVING 
				high_risk_count >= ? 
				OR avg_confidence <= ?
				OR (high_risk_count > 0 AND medium_risk_count > 5)
			ORDER BY 
				high_risk_count DESC, 
				avg_confidence ASC, 
				total_aktivitas DESC
		`;

		const suspiciousEmployees = await rawQuery(suspiciousQuery, [
			days,
			minHighRisk,
			maxConfidence,
		]);

		// Get detailed warnings for top suspicious employees
		const topSuspiciousIds = suspiciousEmployees
			.slice(0, 10)
			.map((emp) => emp.id_pegawai);

		let detailedWarnings = [];
		if (topSuspiciousIds.length > 0) {
			const warningsQuery = `
				SELECT 
					id_pegawai,
					DATE(created_at) as date,
					risk_level,
					confidence_level,
					warnings,
					gps_accuracy,
					latitude,
					longitude
				FROM security_logs
				WHERE id_pegawai IN (${topSuspiciousIds.map(() => "?").join(",")})
				AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL ? DAY)
				AND (risk_level = 'HIGH' OR confidence_level < 50)
				ORDER BY id_pegawai, created_at DESC
			`;

			detailedWarnings = await rawQuery(warningsQuery, [
				...topSuspiciousIds,
				days,
			]);
		}

		// Process and enhance data
		const processedEmployees = suspiciousEmployees.map((emp) => {
			// Parse recent risk levels
			const recentRisks = emp.recent_risk_levels
				? emp.recent_risk_levels.split(",").slice(0, 5)
				: [];

			// Parse activity dates
			const activityDates = emp.activity_dates
				? emp.activity_dates.split(",").slice(0, 7)
				: [];

			// Get detailed warnings for this employee
			const employeeWarnings = detailedWarnings.filter(
				(w) => w.id_pegawai === emp.id_pegawai
			);

			// Calculate risk score (0-100)
			let riskScore = 0;
			riskScore += emp.high_risk_count * 20; // 20 points per high risk
			riskScore += emp.medium_risk_count * 5; // 5 points per medium risk
			riskScore += (100 - emp.avg_confidence) * 0.5; // Inverse confidence
			riskScore = Math.min(100, Math.max(0, riskScore));

			// Determine threat level
			let threatLevel = "LOW";
			if (riskScore >= 80 || emp.high_risk_count >= 5) {
				threatLevel = "CRITICAL";
			} else if (riskScore >= 60 || emp.high_risk_count >= 3) {
				threatLevel = "HIGH";
			} else if (riskScore >= 40 || emp.high_risk_count >= 1) {
				threatLevel = "MEDIUM";
			}

			return {
				...emp,
				recent_risk_levels: recentRisks,
				activity_dates: activityDates,
				detailed_warnings: employeeWarnings,
				risk_score: Math.round(riskScore),
				threat_level: threatLevel,
				// Calculate patterns
				patterns: {
					frequent_high_risk: emp.high_risk_count > 3,
					consistently_low_confidence: emp.avg_confidence < 40,
					high_activity_volume: emp.total_aktivitas > 20,
					recent_escalation: recentRisks.slice(0, 3).includes("HIGH"),
				},
			};
		});

		// Summary statistics
		const summary = {
			total_suspicious: suspiciousEmployees.length,
			critical_threat: processedEmployees.filter(
				(e) => e.threat_level === "CRITICAL"
			).length,
			high_threat: processedEmployees.filter((e) => e.threat_level === "HIGH")
				.length,
			medium_threat: processedEmployees.filter(
				(e) => e.threat_level === "MEDIUM"
			).length,
			departments_affected: [
				...new Set(processedEmployees.map((e) => e.departemen)),
			],
			avg_confidence_all:
				processedEmployees.reduce((sum, e) => sum + e.avg_confidence, 0) /
					processedEmployees.length || 0,
			total_high_risk_incidents: processedEmployees.reduce(
				(sum, e) => sum + e.high_risk_count,
				0
			),
		};

		return NextResponse.json({
			success: true,
			data: processedEmployees,
			summary,
			query_params: {
				days,
				min_high_risk: minHighRisk,
				max_confidence: maxConfidence,
			},
		});
	} catch (error) {
		console.error("Error fetching suspicious employees:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data pegawai mencurigakan" },
			{ status: 500 }
		);
	}
}
