import { NextResponse } from "next/server";
import {
	updateDevelopmentProgress,
	fetchDevelopmentRequestDetail,
	getAuthToken,
} from "@/lib/development-gql-client";
import { validateIdParam } from "@/lib/server-component-security";

export async function GET(request, props) {
	const params = await props.params;
	try {
		const id = validateIdParam(params.id);
		const token = await getAuthToken(request);

		const detail = await fetchDevelopmentRequestDetail(id, token);
		if (!detail || !detail.request) {
			return NextResponse.json(
				{ error: "Development request not found" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			success: true,
			data: {
				current_progress: detail.request.progress_percentage || 0,
				history: detail.progressUpdates || [],
			},
		});
	} catch (error) {
		console.error("[API/development/[id]/progress] Error fetching progress:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function POST(request, props) {
	const params = await props.params;
	try {
		const id = validateIdParam(params.id);
		const token = await getAuthToken(request);
		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const {
			progress_percentage,
			progressPercentage,
			progress_description,
			progressDescription,
			notes,
			milestone,
			status_id,
			statusId,
		} = body;

		const actualPercentage = parseInt(
			progressPercentage ?? progress_percentage,
			10
		);
		if (isNaN(actualPercentage) || actualPercentage < 0 || actualPercentage > 100) {
			return NextResponse.json(
				{ error: "Progress percentage must be between 0 and 100" },
				{ status: 400 }
			);
		}

		const desc =
			progressDescription ?? progress_description ?? notes ?? milestone ?? "";

		const updated = await updateDevelopmentProgress(
			id,
			{
				progressPercentage: actualPercentage,
				statusId: statusId ?? status_id,
				notes: desc.trim() || undefined,
			},
			token
		);

		const statusAutoUpdated = actualPercentage === 100;

		return NextResponse.json({
			success: true,
			message: statusAutoUpdated
				? "Progress updated successfully. Status automatically changed to Completed."
				: "Progress updated successfully",
			auto_status_update: statusAutoUpdated,
			data: updated,
		});
	} catch (error) {
		console.error("[API/development/[id]/progress] Error updating progress:", error);
		return NextResponse.json(
			{ error: error.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
