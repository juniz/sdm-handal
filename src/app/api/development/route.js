import { NextResponse } from "next/server";
import {
	fetchDevelopmentRequests,
	createDevelopmentRequest,
	getAuthToken,
} from "@/lib/development-gql-client";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit"), 10) || 20;
		const offset = parseInt(searchParams.get("offset"), 10) || 0;
		const page = parseInt(searchParams.get("page"), 10) || Math.floor(offset / limit) + 1;
		const user_id = searchParams.get("user_id");
		const status = searchParams.get("status");
		const priority = searchParams.get("priority");
		const module_type = searchParams.get("module_type");
		const department = searchParams.get("department");
		const search = searchParams.get("search");
		const my_requests = searchParams.get("my_requests") === "true";
		const date_from = searchParams.get("date_from");
		const date_to = searchParams.get("date_to");

		// Security: sort column & order whitelist
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
		const sort_order_raw = searchParams.get("sort_order") || "DESC";

		const sort_by = ALLOWED_SORT_COLUMNS.includes(sort_by_raw)
			? sort_by_raw
			: "submission_date";
		const sort_order = ALLOWED_SORT_ORDERS.includes(
			sort_order_raw.toUpperCase()
		)
			? sort_order_raw.toUpperCase()
			: "DESC";

		const token = await getAuthToken(request);

		const filter = {};
		if (status && status !== "ALL") filter.status = status;
		if (priority && priority !== "ALL") filter.priority = priority;
		if (module_type && module_type !== "ALL") filter.moduleType = module_type;
		if (department && department !== "ALL") filter.department = department;
		if (search && search.trim()) filter.search = search.trim();
		if (my_requests || Boolean(user_id)) filter.myRequests = true;
		if (date_from) filter.dateFrom = date_from;
		if (date_to) filter.dateTo = date_to;

		const result = await fetchDevelopmentRequests(
			filter,
			limit,
			offset,
			sort_by,
			sort_order,
			token
		);

		const total = result.total || 0;
		const totalPages = Math.ceil(total / limit) || 1;
		const hasMore = offset + limit < total;

		return NextResponse.json({
			status: "success",
			data: {
				requests: result.items,
				statistics: result.statistics,
				masterData: result.masterData,
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
		console.error("[API/development] Error fetching requests:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal mengambil data pengajuan pengembangan",
			},
			{ status: error.message?.includes("Unauthorized") ? 401 : 500 }
		);
	}
}

export async function POST(request) {
	try {
		const token = await getAuthToken(request);
		if (!token) {
			return NextResponse.json(
				{ status: "error", error: "Token tidak ditemukan atau tidak valid" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const {
			module_type_id,
			moduleTypeId,
			priority_id,
			priorityId,
			title,
			description,
			current_system_issues,
			proposed_solution,
			expected_completion_date,
			department_id,
			departmentId,
		} = body;

		const actualModuleTypeId = moduleTypeId ?? module_type_id;
		const actualPriorityId = priorityId ?? priority_id;

		// Validation
		if (!actualModuleTypeId || !actualPriorityId || !title || !description) {
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

		const created = await createDevelopmentRequest(
			{
				title: title.trim(),
				description: description.trim(),
				moduleTypeId: actualModuleTypeId,
				priorityId: actualPriorityId,
				departmentId: departmentId ?? department_id ?? "IT",
				currentSystemIssues: current_system_issues?.trim() || null,
				proposedSolution: proposed_solution?.trim() || null,
				expectedCompletionDate: expected_completion_date || null,
			},
			token
		);

		return NextResponse.json({
			status: "success",
			message: "Pengajuan pengembangan berhasil dibuat",
			data: {
				request_id: created.request_id,
				no_request: created.no_request,
				...created,
			},
		});
	} catch (error) {
		console.error("[API/development] Error creating request:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal membuat pengajuan pengembangan",
			},
			{ status: 500 }
		);
	}
}
