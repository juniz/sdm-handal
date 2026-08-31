import { NextResponse } from "next/server";
import {
	approveDevelopmentRequest,
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
		const { action, reason, estimated_days, estimatedDays, assigned_to, assignedTo } = body;

		if (!action || !["approve", "reject"].includes(action.toLowerCase())) {
			return NextResponse.json(
				{
					status: "error",
					error: "Action harus berupa 'approve' atau 'reject'",
				},
				{ status: 400 }
			);
		}

		if (action.toLowerCase() === "reject" && !reason?.trim()) {
			return NextResponse.json(
				{ status: "error", error: "Alasan penolakan harus diisi" },
				{ status: 400 }
			);
		}

		const result = await approveDevelopmentRequest(
			id,
			{
				action: action.toUpperCase(),
				reason: reason?.trim() || null,
				estimatedDays: estimatedDays ?? estimated_days,
				assignedTo: assignedTo ?? assigned_to,
			},
			token
		);

		return NextResponse.json({
			status: "success",
			message: `Pengajuan berhasil ${
				action.toLowerCase() === "approve" ? "disetujui" : "ditolak"
			}`,
			data: {
				request_id: id,
				new_status: result.current_status || (action.toLowerCase() === "approve" ? "Approved" : "Rejected"),
				action: action.toLowerCase(),
				approved_by: result.approved_by,
				reason: reason,
			},
		});
	} catch (error) {
		console.error("[API/development/[id]/approval] Error in approval:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Terjadi kesalahan saat memproses approval",
			},
			{ status: error.message?.includes("Forbidden") || error.message?.includes("IT") ? 403 : 500 }
		);
	}
}
