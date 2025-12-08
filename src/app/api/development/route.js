import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const page = parseInt(searchParams.get("page")) || 1;
		const limit = parseInt(searchParams.get("limit")) || 10;
		const offset = parseInt(searchParams.get("offset")) || 0;
		const user_id = searchParams.get("user_id");
		const status = searchParams.get("status");
		const priority = searchParams.get("priority");
		const module_type = searchParams.get("module_type");
		const department = searchParams.get("department");
		const search = searchParams.get("search");
		const my_requests = searchParams.get("my_requests") === "true";
		const date_from = searchParams.get("date_from");
		const date_to = searchParams.get("date_to");
		// SECURITY FIX CVE-001: Validasi sort_by dan sort_order dengan whitelist
		const ALLOWED_SORT_COLUMNS = [
			"request_id",
			"submission_date",
			"title",
			"current_status_id",
			"priority_id",
			"no_request",
			"approved_date",
			"development_start_date",
			"deployment_date",
			"completed_date",
			"closed_date",
		];
		const ALLOWED_SORT_ORDERS = ["ASC", "DESC"];

		const sort_by_raw = searchParams.get("sort_by") || "submission_date";
		const sort_order_raw = searchParams.get("sort_order") || "desc";

		// Validasi dengan whitelist
		const sort_by = ALLOWED_SORT_COLUMNS.includes(sort_by_raw)
			? sort_by_raw
			: "submission_date";
		const sort_order = ALLOWED_SORT_ORDERS.includes(
			sort_order_raw.toUpperCase()
		)
			? sort_order_raw.toUpperCase()
			: "DESC";

		// Get user info from token for authorization
		const currentUser = await getUser();

		const connection = await createConnection();

		// Build WHERE clause
		let whereConditions = [];
		let params = [];

		if (my_requests && currentUser) {
			whereConditions.push("dr.user_id = ?");
			params.push(currentUser.username);
		} else if (user_id) {
			whereConditions.push("dr.user_id = ?");
			params.push(user_id);
		}

		if (status && status !== "ALL") {
			whereConditions.push("dr.current_status_id = ?");
			params.push(status);
		}

		if (priority && priority !== "ALL") {
			whereConditions.push("dr.priority_id = ?");
			params.push(priority);
		}

		if (module_type && module_type !== "ALL") {
			whereConditions.push("dr.module_type_id = ?");
			params.push(module_type);
		}

		if (department && department !== "ALL") {
			whereConditions.push("dr.departement_id = ?");
			params.push(department);
		}

		if (search) {
			whereConditions.push(
				"(dr.title LIKE ? OR dr.description LIKE ? OR dr.no_request LIKE ?)"
			);
			const searchPattern = `%${search}%`;
			params.push(searchPattern, searchPattern, searchPattern);
		}

		if (date_from) {
			whereConditions.push("DATE(dr.submission_date) >= ?");
			params.push(date_from);
		}

		if (date_to) {
			whereConditions.push("DATE(dr.submission_date) <= ?");
			params.push(date_to);
		}

		const whereClause =
			whereConditions.length > 0
				? "WHERE " + whereConditions.join(" AND ")
				: "";

		// Main query for requests
		const requestsQuery = `
			SELECT 
				dr.request_id,
				dr.no_request,
				dr.user_id,
				p.nama as user_name,
				d.nama as departemen_name,
				mt.type_name as module_type,
				dp.priority_name,
				dp.priority_level,
				dp.priority_color,
				dr.title,
				dr.description,
				dr.current_system_issues,
				dr.proposed_solution,
				dr.expected_completion_date,
				ds.status_name as current_status,
				ds.status_color,
				dr.submission_date,
				dr.approved_date,
				dr.development_start_date,
				dr.deployment_date,
				dr.completed_date,
				dr.closed_date,
				da.assigned_to as assigned_developer,
				dev_user.nama as assigned_developer_name,
				COALESCE(notes_count.total_notes, 0) as notes_count,
				COALESCE(attachments_count.total_attachments, 0) as attachments_count
			FROM development_requests dr
			LEFT JOIN pegawai p ON dr.user_id = p.nik
			LEFT JOIN departemen d ON dr.departement_id = d.dep_id
			LEFT JOIN module_types mt ON dr.module_type_id = mt.type_id
			LEFT JOIN development_priorities dp ON dr.priority_id = dp.priority_id
			LEFT JOIN development_statuses ds ON dr.current_status_id = ds.status_id
			LEFT JOIN (
				SELECT request_id, assigned_to
				FROM development_assignments
				WHERE is_active = true
				ORDER BY assignment_date DESC
				LIMIT 1
			) da ON dr.request_id = da.request_id
			LEFT JOIN pegawai dev_user ON da.assigned_to = dev_user.nik
			LEFT JOIN (
				SELECT request_id, COUNT(*) as total_notes
				FROM development_notes
				GROUP BY request_id
			) notes_count ON dr.request_id = notes_count.request_id
			LEFT JOIN (
				SELECT request_id, COUNT(*) as total_attachments
				FROM development_attachments
				GROUP BY request_id
			) attachments_count ON dr.request_id = attachments_count.request_id
			${whereClause}
			ORDER BY dr.${sort_by} ${sort_order.toUpperCase()}
			LIMIT ? OFFSET ?
		`;

		const countQuery = `
			SELECT COUNT(*) as total
			FROM development_requests dr
			LEFT JOIN pegawai p ON dr.user_id = p.nik
			LEFT JOIN departemen d ON dr.departement_id = d.dep_id
			LEFT JOIN module_types mt ON dr.module_type_id = mt.type_id
			LEFT JOIN development_priorities dp ON dr.priority_id = dp.priority_id
			LEFT JOIN development_statuses ds ON dr.current_status_id = ds.status_id
			${whereClause}
		`;

		// Execute queries
		const [requests] = await connection.execute(requestsQuery, [
			...params,
			limit,
			offset,
		]);
		const [countResult] = await connection.execute(countQuery, params);

		// Get progress data for all requests
		if (requests.length > 0) {
			const requestIds = requests.map((req) => req.request_id);
			const [progressResult] = await connection.execute(
				`SELECT 
					request_id, 
					progress_percentage 
				FROM development_progress dp1
				WHERE request_id IN (${requestIds.map(() => "?").join(",")})
				AND update_date = (
					SELECT MAX(update_date) 
					FROM development_progress dp2 
					WHERE dp2.request_id = dp1.request_id
				)`,
				requestIds
			);

			// Create progress lookup map
			const progressMap = {};
			progressResult.forEach((progress) => {
				progressMap[progress.request_id] = progress.progress_percentage;
			});

			// Add progress data to requests
			requests.forEach((request) => {
				request.progress_percentage = progressMap[request.request_id] || 0;
			});
		}

		// Get statistics
		const [statsResult] = await connection.execute(`
			SELECT 
				COUNT(*) as total_requests,
				COUNT(CASE WHEN ds.status_name IN ('Submitted', 'Under Review', 'Need Info') THEN 1 END) as pending_review,
				COUNT(CASE WHEN ds.status_name IN ('Assigned', 'In Development', 'Development Complete', 'In Testing', 'Testing Complete', 'In Deployment', 'UAT') THEN 1 END) as in_progress,
				COUNT(CASE WHEN ds.status_name = 'Completed' THEN 1 END) as completed,
				COUNT(CASE WHEN ds.status_name = 'Rejected' THEN 1 END) as rejected,
				ROUND(AVG(CASE WHEN dr.completed_date IS NOT NULL THEN 
					DATEDIFF(dr.completed_date, dr.submission_date) END), 1) as avg_completion_days
			FROM development_requests dr
			LEFT JOIN development_statuses ds ON dr.current_status_id = ds.status_id
			WHERE dr.submission_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
		`);

		// Get master data
		const [moduleTypes] = await connection.execute(
			"SELECT * FROM module_types WHERE is_active = true ORDER BY type_name"
		);
		const [priorities] = await connection.execute(
			"SELECT * FROM development_priorities WHERE is_active = true ORDER BY priority_level"
		);
		const [statuses] = await connection.execute(
			"SELECT * FROM development_statuses WHERE is_active = true ORDER BY status_name"
		);
		const [departments] = await connection.execute(
			"SELECT * FROM departemen ORDER BY nama"
		);

		await connection.end();

		const total = countResult[0].total;
		const totalPages = Math.ceil(total / limit);
		const hasMore = offset + limit < total;

		// Helper function to format date safely
		const formatDate = (dateValue) => {
			if (!dateValue) return null;
			try {
				const date = new Date(dateValue);
				if (isNaN(date.getTime())) return null;
				return date.toLocaleString("id-ID", {
					year: "numeric",
					month: "long",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					timeZone: "Asia/Jakarta",
				});
			} catch (error) {
				console.error("Error formatting date:", error);
				return null;
			}
		};

		return NextResponse.json({
			status: "success",
			data: {
				requests: requests.map((req) => ({
					...req,
					submission_date: formatDate(req.submission_date),
					approved_date: formatDate(req.approved_date),
					development_start_date: formatDate(req.development_start_date),
					deployment_date: formatDate(req.deployment_date),
					completed_date: formatDate(req.completed_date),
					closed_date: formatDate(req.closed_date),
					expected_completion_date: formatDate(req.expected_completion_date),
				})),
				statistics: statsResult[0],
				masterData: {
					moduleTypes,
					priorities,
					statuses,
					departments,
				},
				pagination: {
					page,
					limit,
					offset,
					total,
					totalPages,
					hasMore,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching development requests:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil data pengajuan pengembangan",
			},
			{ status: 500 }
		);
	}
}

export async function POST(request) {
	try {
		const body = await request.json();
		const {
			module_type_id,
			priority_id,
			title,
			description,
			current_system_issues,
			proposed_solution,
			expected_completion_date,
		} = body;

		// Get user info from token
		const currentUser = await getUser();
		if (!currentUser) {
			return NextResponse.json(
				{ status: "error", error: "Token tidak ditemukan atau tidak valid" },
				{ status: 401 }
			);
		}

		// Validation
		if (!module_type_id || !priority_id || !title || !description) {
			return NextResponse.json(
				{
					status: "error",
					error:
						"Field yang wajib diisi: module_type_id, priority_id, title, description",
				},
				{ status: 400 }
			);
		}

		if (title.length < 10 || title.length > 255) {
			return NextResponse.json(
				{
					status: "error",
					error: "Judul harus antara 10-255 karakter",
				},
				{ status: 400 }
			);
		}

		if (description.length < 50 || description.length > 5000) {
			return NextResponse.json(
				{
					status: "error",
					error: "Deskripsi harus antara 50-5000 karakter",
				},
				{ status: 400 }
			);
		}

		const connection = await createConnection();

		// Get user department
		const [
			userResult,
		] = await connection.execute(
			"SELECT departemen FROM pegawai WHERE nik = ?",
			[currentUser.username]
		);

		if (userResult.length === 0) {
			await connection.end();
			return NextResponse.json(
				{ status: "error", error: "User tidak ditemukan" },
				{ status: 404 }
			);
		}

		const departement_id = userResult[0].departemen;

		// Get default status (Draft or Submitted)
		const [statusResult] = await connection.execute(
			"SELECT status_id FROM development_statuses WHERE status_name = 'Draft' AND is_active = true"
		);

		if (statusResult.length === 0) {
			await connection.end();
			return NextResponse.json(
				{ status: "error", error: "Status default tidak ditemukan" },
				{ status: 500 }
			);
		}

		const default_status_id = statusResult[0].status_id;

		// Generate nomor request
		const currentDate = new Date();
		const dateString = currentDate.toISOString().slice(0, 10).replace(/-/g, "");
		const timeString = currentDate.toTimeString().slice(0, 8).replace(/:/g, "");
		const no_request = `REQ-${dateString}-${timeString}-${Math.random()
			.toString(36)
			.substr(2, 4)
			.toUpperCase()}`;

		// Insert new request
		const insertQuery = `
			INSERT INTO development_requests (
				no_request,
				user_id,
				departement_id,
				module_type_id,
				priority_id,
				title,
				description,
				current_system_issues,
				proposed_solution,
				expected_completion_date,
				current_status_id
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`;

		const [result] = await connection.execute(insertQuery, [
			no_request,
			currentUser.username,
			departement_id,
			module_type_id,
			priority_id,
			title,
			description,
			current_system_issues || null,
			proposed_solution || null,
			expected_completion_date || null,
			default_status_id,
		]);

		await connection.end();

		return NextResponse.json({
			status: "success",
			message: "Pengajuan pengembangan berhasil dibuat",
			data: {
				request_id: result.insertId,
				no_request: no_request,
			},
		});
	} catch (error) {
		console.error("Error creating development request:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal membuat pengajuan pengembangan",
			},
			{ status: 500 }
		);
	}
}
