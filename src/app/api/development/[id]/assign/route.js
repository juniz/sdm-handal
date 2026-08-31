import { NextResponse } from "next/server";
import {
	assignDevelopmentRequest,
	fetchDevelopmentRequestDetail,
	fetchDevelopmentMasterData,
	getAuthToken,
} from "@/lib/development-gql-client";
import { validateIdParam } from "@/lib/server-component-security";

export async function POST(request, props) {
	const params = await props.params;
	try {
		const id = validateIdParam(params.id);
		const token = await getAuthToken(request);
		if (!token) {
			return NextResponse.json(
				{ status: "error", error: "Token tidak ditemukan atau tidak valid" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const {
			assigned_to,
			assignedTo,
			assignment_notes,
			notes,
			estimated_completion_date,
			targetCompletionDate,
		} = body;

		const actualAssignedTo = assignedTo ?? assigned_to;
		if (!actualAssignedTo) {
			return NextResponse.json(
				{
					status: "error",
					error: "Developer yang akan di-assign harus dipilih",
				},
				{ status: 400 }
			);
		}

		const result = await assignDevelopmentRequest(
			id,
			{
				assignedTo: actualAssignedTo,
				targetCompletionDate:
					targetCompletionDate ?? estimated_completion_date,
				notes: notes ?? assignment_notes,
			},
			token
		);

		return NextResponse.json({
			status: "success",
			message: `Request berhasil di-assign ke ${
				result.assigned_developer_name || actualAssignedTo
			}`,
			data: {
				request_id: id,
				assigned_to: result.assigned_developer || actualAssignedTo,
				assigned_to_name: result.assigned_developer_name,
				assigned_by: result.approved_by,
				assignment_notes: notes ?? assignment_notes,
				estimated_completion_date:
					targetCompletionDate ?? estimated_completion_date,
			},
		});
	} catch (error) {
		console.error("[API/development/[id]/assign] Error in assignment:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Terjadi kesalahan saat memproses assignment",
			},
			{ status: 500 }
		);
	}
}

export async function GET(request, props) {
	const params = await props.params;
	try {
		const id = validateIdParam(params.id);
		const token = await getAuthToken(request);

		const [masterData, detail] = await Promise.all([
			fetchDevelopmentMasterData(token),
			fetchDevelopmentRequestDetail(id, token),
		]);

		const activeAssignment =
			detail?.assignments?.find((a) => a.is_active || a.isActive) ||
			detail?.assignments?.[0] ||
			null;

		return NextResponse.json({
			status: "success",
			data: {
				developers: masterData.developers || [],
				current_assignment: activeAssignment,
			},
		});
	} catch (error) {
		console.error("[API/development/[id]/assign] Error fetching developers:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Terjadi kesalahan saat mengambil data developer",
			},
			{ status: 500 }
		);
	}
}
