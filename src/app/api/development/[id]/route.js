import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import { getUser } from "@/lib/auth";
import { validateIdParam } from "@/lib/server-component-security";

export async function GET(request, { params }) {
	try {
		// SECURITY FIX CVE-2025-66478: Validasi ID parameter untuk mencegah RCE
		const id = validateIdParam(params.id);

		// Get user info from token for authorization
		const currentUser = await getUser();

		const connection = await createConnection();

		// Get main request details
		const [requestResult] = await connection.execute(
			`
			SELECT 
				dr.request_id,
				dr.no_request,
				dr.user_id,
				p.nama as user_name,
				d.nama as departemen_name,
				mt.type_name as module_type,
				mt.type_id as module_type_id,
				dp.priority_name,
				dp.priority_id,
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
				dr.approved_by,
				approved_by_user.nama as approved_by_name,
				dr.development_start_date,
				dr.deployment_date,
				dr.completed_date,
				dr.closed_date,
				da.assigned_to as assigned_developer,
				dev_user.nama as assigned_developer_name,
				COALESCE(progress.progress_percentage, 0) as progress_percentage
			FROM development_requests dr
			LEFT JOIN pegawai p ON dr.user_id = p.nik
			LEFT JOIN departemen d ON dr.departement_id = d.dep_id
			LEFT JOIN module_types mt ON dr.module_type_id = mt.type_id
			LEFT JOIN development_priorities dp ON dr.priority_id = dp.priority_id
			LEFT JOIN development_statuses ds ON dr.current_status_id = ds.status_id
			LEFT JOIN pegawai approved_by_user ON dr.approved_by = approved_by_user.nik
			LEFT JOIN (
				SELECT request_id, assigned_to
				FROM development_assignments
				WHERE is_active = true
				ORDER BY assignment_date DESC
				LIMIT 1
			) da ON dr.request_id = da.request_id
			LEFT JOIN pegawai dev_user ON da.assigned_to = dev_user.nik
			LEFT JOIN (
				SELECT request_id, progress_percentage
				FROM development_progress
				WHERE request_id = ?
				ORDER BY update_date DESC
				LIMIT 1
			) progress ON dr.request_id = progress.request_id
			WHERE dr.request_id = ?
		`,
			[id, id]
		);

		if (requestResult.length === 0) {
			await connection.end();
			return NextResponse.json(
				{ status: "error", error: "Pengajuan tidak ditemukan" },
				{ status: 404 }
			);
		}

		const request = requestResult[0];

		// Get notes/comments
		const [notesResult] = await connection.execute(
			`
			SELECT 
				dn.note_id,
				dn.note,
				dn.note_type,
				dn.created_by,
				p.nama as created_by_name,
				dn.created_date
			FROM development_notes dn
			LEFT JOIN pegawai p ON dn.created_by = p.nik
			WHERE dn.request_id = ?
			ORDER BY dn.created_date DESC
		`,
			[id]
		);

		// Get attachments
		const [attachmentsResult] = await connection.execute(
			`
			SELECT 
				da.attachment_id,
				da.file_name,
				da.file_path,
				da.file_type,
				da.file_size,
				da.attachment_type,
				da.uploaded_by,
				p.nama as uploaded_by_name,
				da.upload_date
			FROM development_attachments da
			LEFT JOIN pegawai p ON da.uploaded_by = p.nik
			WHERE da.request_id = ?
			ORDER BY da.upload_date DESC
		`,
			[id]
		);

		// Get status history
		const [statusHistoryResult] = await connection.execute(
			`
			SELECT 
				dsh.history_id,
				old_status.status_name as old_status,
				new_status.status_name as new_status,
				dsh.changed_by,
				p.nama as changed_by_name,
				dsh.change_date,
				dsh.change_reason
			FROM development_status_history dsh
			LEFT JOIN development_statuses old_status ON dsh.old_status = old_status.status_id
			LEFT JOIN development_statuses new_status ON dsh.new_status = new_status.status_id
			LEFT JOIN pegawai p ON dsh.changed_by = p.nik
			WHERE dsh.request_id = ?
			ORDER BY dsh.change_date DESC
		`,
			[id]
		);

		await connection.end();

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

		const formattedRequest = {
			...request,
			submission_date: formatDate(request.submission_date),
			approved_date: formatDate(request.approved_date),
			development_start_date: formatDate(request.development_start_date),
			deployment_date: formatDate(request.deployment_date),
			completed_date: formatDate(request.completed_date),
			closed_date: formatDate(request.closed_date),
		};

		const formattedNotes = notesResult.map((note) => ({
			...note,
			created_date: formatDate(note.created_date),
		}));

		const formattedAttachments = attachmentsResult.map((attachment) => ({
			...attachment,
			upload_date: formatDate(attachment.upload_date),
		}));

		const formattedStatusHistory = statusHistoryResult.map((history) => ({
			...history,
			change_date: formatDate(history.change_date),
		}));

		return NextResponse.json({
			status: "success",
			data: {
				...formattedRequest,
				notes: formattedNotes,
				attachments: formattedAttachments,
				statusHistory: formattedStatusHistory,
			},
		});
	} catch (error) {
		console.error("Error fetching request detail:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil detail pengajuan",
			},
			{ status: 500 }
		);
	}
}

export async function PUT(request, { params }) {
	try {
		const { id } = params;
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

		const connection = await createConnection();

		// Check if request exists and user has permission to edit
		const [
			requestResult,
		] = await connection.execute(
			"SELECT user_id, current_status_id FROM development_requests WHERE request_id = ?",
			[id]
		);

		if (requestResult.length === 0) {
			await connection.end();
			return NextResponse.json(
				{ status: "error", error: "Pengajuan tidak ditemukan" },
				{ status: 404 }
			);
		}

		const request = requestResult[0];

		// Check if user owns this request
		if (request.user_id !== currentUser.nik) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error: "Tidak memiliki izin untuk mengedit pengajuan ini",
				},
				{ status: 403 }
			);
		}

		// Check if request is in editable status
		const [
			statusResult,
		] = await connection.execute(
			"SELECT status_name FROM development_statuses WHERE status_id = ?",
			[request.current_status_id]
		);

		const currentStatus = statusResult[0]?.status_name;
		const editableStatuses = ["Draft", "Submitted", "Need Info"];

		if (!editableStatuses.includes(currentStatus)) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error: "Pengajuan tidak dapat diedit pada status ini",
				},
				{ status: 400 }
			);
		}

		// Validation (same as POST)
		if (!module_type_id || !priority_id || !title || !description) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error:
						"Field yang wajib diisi: module_type_id, priority_id, title, description",
				},
				{ status: 400 }
			);
		}

		// Update request
		const updateQuery = `
			UPDATE development_requests SET
				module_type_id = ?,
				priority_id = ?,
				title = ?,
				description = ?,
				current_system_issues = ?,
				proposed_solution = ?,
				expected_completion_date = ?,
				updated_date = CURRENT_TIMESTAMP
			WHERE request_id = ?
		`;

		await connection.execute(updateQuery, [
			module_type_id,
			priority_id,
			title,
			description,
			current_system_issues || null,
			proposed_solution || null,
			expected_completion_date || null,
			id,
		]);

		await connection.end();

		return NextResponse.json({
			status: "success",
			message: "Pengajuan berhasil diperbarui",
		});
	} catch (error) {
		console.error("Error updating request:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal memperbarui pengajuan",
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(request, { params }) {
	try {
		const { id } = params;

		// Get user info from token
		const currentUser = await getUser();
		if (!currentUser) {
			return NextResponse.json(
				{ status: "error", error: "Token tidak ditemukan atau tidak valid" },
				{ status: 401 }
			);
		}

		const connection = await createConnection();

		// Check if request exists and user has permission to delete
		const [requestResult] = await connection.execute(
			`SELECT dr.user_id, ds.status_name as current_status
			FROM development_requests dr
			LEFT JOIN development_statuses ds ON dr.current_status_id = ds.status_id
			WHERE dr.request_id = ?`,
			[id]
		);

		if (requestResult.length === 0) {
			await connection.end();
			return NextResponse.json(
				{ status: "error", error: "Pengajuan tidak ditemukan" },
				{ status: 404 }
			);
		}

		const request = requestResult[0];

		// Check if user owns this request
		if (request.user_id !== currentUser.nik) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error: "Tidak memiliki izin untuk menghapus pengajuan ini",
				},
				{ status: 403 }
			);
		}

		// Check if request is in deletable status (only Draft)
		if (request.current_status !== "Draft") {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error: "Hanya pengajuan dengan status Draft yang dapat dihapus",
				},
				{ status: 400 }
			);
		}

		// Delete request (cascade will handle related tables)
		await connection.execute(
			"DELETE FROM development_requests WHERE request_id = ?",
			[id]
		);

		await connection.end();

		return NextResponse.json({
			status: "success",
			message: "Pengajuan berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting request:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal menghapus pengajuan",
			},
			{ status: 500 }
		);
	}
}
