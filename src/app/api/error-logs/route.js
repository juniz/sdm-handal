import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { rawQuery, insert, update } from "@/lib/db-helper";
import moment from "moment";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Fungsi untuk mendapatkan informasi IP
function getClientIP(request) {
	const forwarded = request.headers.get("x-forwarded-for");
	const realIP = request.headers.get("x-real-ip");

	if (forwarded) {
		return forwarded.split(",")[0].trim();
	}
	if (realIP) {
		return realIP;
	}
	return "unknown";
}

// Fungsi untuk parsing user agent
function parseUserAgent(userAgent) {
	if (!userAgent) return null;

	return {
		userAgent,
		browser: userAgent.includes("Chrome")
			? "Chrome"
			: userAgent.includes("Firefox")
			? "Firefox"
			: userAgent.includes("Safari")
			? "Safari"
			: "Unknown",
		mobile: /Mobile|Android|iPhone|iPad/i.test(userAgent),
		os: userAgent.includes("Windows")
			? "Windows"
			: userAgent.includes("Mac")
			? "macOS"
			: userAgent.includes("Linux")
			? "Linux"
			: userAgent.includes("Android")
			? "Android"
			: userAgent.includes("iOS")
			? "iOS"
			: "Unknown",
	};
}

// POST - Log new error
export async function POST(request) {
	try {
		// Check if debug mode is enabled
		const isDebugEnabled = process.env.DEBUG === "true";

		// If debug is disabled, return early without logging
		if (!isDebugEnabled) {
			return NextResponse.json({
				success: true,
				message:
					"Error logging disabled. Set DEBUG=true to enable error logging.",
			});
		}

		const body = await request.json();
		const {
			error_type,
			error_message,
			error_stack,
			page_url,
			severity = "MEDIUM",
			component_name,
			action_attempted,
			additional_data = {},
		} = body;

		// Validasi required fields
		if (!error_type || !error_message) {
			return NextResponse.json(
				{ message: "error_type dan error_message harus diisi" },
				{ status: 400 }
			);
		}

		// SECURITY FIX CVE-005: Sanitasi dan validasi panjang untuk mencegah DoS
		const MAX_LENGTH = 10000; // 10KB max per field
		const MAX_URL_LENGTH = 2048;
		const MAX_SHORT_LENGTH = 255;
		const MAX_ACTION_LENGTH = 500;

		const ALLOWED_SEVERITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

		const sanitizedData = {
			MAX_LENGTH, // Include untuk digunakan di bawah
			error_type:
				(error_type?.substring(0, MAX_SHORT_LENGTH) || "Unknown").replace(
					/[<>]/g,
					""
				),
			error_message:
				(error_message?.substring(0, MAX_LENGTH) || "").replace(/[<>]/g, ""),
			error_stack:
				error_stack?.substring(0, MAX_LENGTH)?.replace(/[<>]/g, "") || null,
			page_url:
				page_url?.substring(0, MAX_URL_LENGTH)?.replace(/[<>]/g, "") || null,
			severity: ALLOWED_SEVERITIES.includes(severity)
				? severity
				: "MEDIUM",
			component_name:
				component_name?.substring(0, MAX_SHORT_LENGTH)?.replace(/[<>]/g, "") ||
				null,
			action_attempted:
				action_attempted?.substring(0, MAX_ACTION_LENGTH)?.replace(/[<>]/g, "") ||
				null,
			additional_data:
				typeof additional_data === "object"
					? JSON.stringify(additional_data).substring(0, MAX_LENGTH)
					: "{}",
		};

		// Get user info from token (optional)
		let userInfo = { user_id: null, user_name: null };
		try {
			const cookieStore = cookies();
			const token = await cookieStore.get("auth_token")?.value;

			if (token) {
				const verified = await jwtVerify(
					token,
					new TextEncoder().encode(JWT_SECRET)
				);

				// Get user details
				const userQuery = `SELECT id, nama FROM pegawai WHERE id = ? LIMIT 1`;
				const userResult = await rawQuery(userQuery, [verified.payload.id]);

				if (userResult.length > 0) {
					userInfo = {
						user_id: userResult[0].id,
						user_name: userResult[0].nama,
					};
				}
			}
		} catch (error) {
			// Continue without user info if token invalid
			console.log("No valid token for error logging");
		}

		// Get request info
		const userAgent = request.headers.get("user-agent");
		const browserInfo = parseUserAgent(userAgent);
		const ipAddress = getClientIP(request);

		// Insert error log dengan data yang sudah disanitasi
		const errorLogData = {
			user_id: userInfo.user_id,
			user_name: userInfo.user_name,
			error_type: sanitizedData.error_type,
			error_message: sanitizedData.error_message,
			error_stack: sanitizedData.error_stack,
			page_url: sanitizedData.page_url,
			user_agent: userAgent?.substring(0, 500) || null,
			browser_info: browserInfo
				? JSON.stringify(browserInfo).substring(0, MAX_LENGTH)
				: null,
			device_info: JSON.stringify(additional_data.deviceInfo || {}).substring(
				0,
				MAX_LENGTH
			),
			severity: sanitizedData.severity,
			component_name: sanitizedData.component_name,
			action_attempted: sanitizedData.action_attempted,
			additional_data: sanitizedData.additional_data,
			ip_address: ipAddress?.substring(0, 45) || null, // IPv6 max length
			session_id:
				additional_data.sessionId?.substring(0, 100) || null,
			timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
		};

		const result = await insert({
			table: "error_logs",
			data: errorLogData,
		});

		return NextResponse.json({
			success: true,
			message: "Error log berhasil disimpan",
			log_id: result.insertId,
		});
	} catch (error) {
		console.error("Error saving error log:", error);
		return NextResponse.json(
			{ message: "Gagal menyimpan error log" },
			{ status: 500 }
		);
	}
}

// GET - Fetch error logs (Admin only)
export async function GET(request) {
	try {
		// Verify admin token
		const cookieStore = cookies();
		const token = await cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const verified = await jwtVerify(
			token,
			new TextEncoder().encode(JWT_SECRET)
		);

		// Check if user is admin (you may need to adjust this based on your admin system)
		const adminQuery = `SELECT id, nama, jbtn as jabatan FROM pegawai WHERE id = ? LIMIT 1`;
		const adminResult = await rawQuery(adminQuery, [verified.payload.id]);

		if (!adminResult.length || !adminResult[0].jabatan?.includes("IT")) {
			return NextResponse.json(
				{ error: "Forbidden - Admin access required" },
				{ status: 403 }
			);
		}

		// Parse query parameters
		const url = new URL(request.url);
		const page = parseInt(url.searchParams.get("page")) || 1;
		const limit = parseInt(url.searchParams.get("limit")) || 20;
		const severity = url.searchParams.get("severity");
		const status = url.searchParams.get("status");
		const error_type = url.searchParams.get("error_type");
		const date_from = url.searchParams.get("date_from");
		const date_to = url.searchParams.get("date_to");
		const offset = (page - 1) * limit;

		// Build query conditions
		let whereConditions = [];
		let queryParams = [];

		if (severity) {
			whereConditions.push("severity = ?");
			queryParams.push(severity);
		}

		if (status) {
			whereConditions.push("status = ?");
			queryParams.push(status);
		}

		if (error_type) {
			whereConditions.push("error_type LIKE ?");
			queryParams.push(`%${error_type}%`);
		}

		if (date_from) {
			whereConditions.push("DATE(timestamp) >= ?");
			queryParams.push(date_from);
		}

		if (date_to) {
			whereConditions.push("DATE(timestamp) <= ?");
			queryParams.push(date_to);
		}

		const whereClause =
			whereConditions.length > 0
				? "WHERE " + whereConditions.join(" AND ")
				: "";

		// Get total count
		const countQuery = `SELECT COUNT(*) as total FROM error_logs ${whereClause}`;
		const countResult = await rawQuery(countQuery, queryParams);
		const totalRecords = countResult[0].total;

		// Get error logs with pagination
		const dataQuery = `
			SELECT 
				id, user_id, user_name, error_type, error_message, 
				page_url, severity, status, component_name, 
				action_attempted, timestamp, ip_address,
				browser_info, device_info
			FROM error_logs 
			${whereClause}
			ORDER BY timestamp DESC 
			LIMIT ? OFFSET ?
		`;

		const dataResult = await rawQuery(dataQuery, [
			...queryParams,
			limit,
			offset,
		]);

		// Get statistics
		const statsQuery = `
			SELECT 
				severity,
				COUNT(*) as count
			FROM error_logs
			${whereClause}
			GROUP BY severity
		`;
		const statsResult = await rawQuery(statsQuery, queryParams);

		return NextResponse.json({
			success: true,
			data: dataResult,
			pagination: {
				current_page: page,
				per_page: limit,
				total_records: totalRecords,
				total_pages: Math.ceil(totalRecords / limit),
			},
			statistics: statsResult.reduce((acc, stat) => {
				acc[stat.severity.toLowerCase()] = stat.count;
				return acc;
			}, {}),
		});
	} catch (error) {
		console.error("Error fetching error logs:", error);
		return NextResponse.json(
			{ message: "Gagal mengambil error logs" },
			{ status: 500 }
		);
	}
}

// PUT - Update error log status
export async function PUT(request) {
	try {
		// Verify admin token
		const cookieStore = cookies();
		const token = await cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const verified = await jwtVerify(
			token,
			new TextEncoder().encode(JWT_SECRET)
		);

		const {
			log_id,
			status,
			resolution_notes,
			resolution_type,
		} = await request.json();

		if (!log_id || !status) {
			return NextResponse.json(
				{ message: "log_id dan status harus diisi" },
				{ status: 400 }
			);
		}

		// Update error log status
		await update({
			table: "error_logs",
			data: { status },
			where: { id: log_id },
		});

		// If resolution provided, insert resolution record
		if (resolution_notes && resolution_type) {
			const adminQuery = `SELECT id, nama FROM pegawai WHERE id = ? LIMIT 1`;
			const adminResult = await rawQuery(adminQuery, [verified.payload.id]);

			if (adminResult.length > 0) {
				await insert({
					table: "error_resolutions",
					data: {
						error_log_id: log_id,
						admin_id: adminResult[0].id,
						admin_name: adminResult[0].nama,
						resolution_notes,
						resolution_type,
						created_at: moment().format("YYYY-MM-DD HH:mm:ss"),
					},
				});
			}
		}

		return NextResponse.json({
			success: true,
			message: "Status error log berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating error log:", error);
		return NextResponse.json(
			{ message: "Gagal mengupdate error log" },
			{ status: 500 }
		);
	}
}
