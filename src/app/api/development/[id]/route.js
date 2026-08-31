import { NextResponse } from "next/server";
import {
	fetchDevelopmentRequestDetail,
	updateDevelopmentRequest,
	deleteDevelopmentRequest,
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
				{ status: "error", error: "Pengajuan tidak ditemukan" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			status: "success",
			data: {
				...detail.request,
				notes: detail.notes || [],
				attachments: detail.attachments || [],
				statusHistory: detail.statusHistory || [],
				assignments: detail.assignments || [],
				progressUpdates: detail.progressUpdates || [],
			},
		});
	} catch (error) {
		console.error("[API/development/[id]] Error fetching detail:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal mengambil detail pengajuan",
			},
			{ status: error.message?.includes("tidak ditemukan") ? 404 : 500 }
		);
	}
}

export async function PUT(request, props) {
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

		const updated = await updateDevelopmentRequest(
			id,
			{
				title: title.trim(),
				description: description.trim(),
				moduleTypeId: actualModuleTypeId,
				priorityId: actualPriorityId,
				departmentId: departmentId ?? department_id,
				currentSystemIssues: current_system_issues?.trim() || null,
				proposedSolution: proposed_solution?.trim() || null,
				expectedCompletionDate: expected_completion_date || null,
			},
			token
		);

		return NextResponse.json({
			status: "success",
			message: "Pengajuan berhasil diperbarui",
			data: updated,
		});
	} catch (error) {
		console.error("[API/development/[id]] Error updating request:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal memperbarui pengajuan",
			},
			{ status: error.message?.includes("tidak diizinkan") || error.message?.includes("tidak dapat") ? 400 : 500 }
		);
	}
}

export async function DELETE(request, props) {
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

		await deleteDevelopmentRequest(id, token);

		return NextResponse.json({
			status: "success",
			message: "Pengajuan berhasil dihapus",
		});
	} catch (error) {
		console.error("[API/development/[id]] Error deleting request:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal menghapus pengajuan",
			},
			{ status: 500 }
		);
	}
}
