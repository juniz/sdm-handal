import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(request, { params }) {
	try {
		const { id } = params;
		const body = await request.json();
		const { action, reason } = body; // action: 'approve' or 'reject', reason: string

		// Get user info from token
		const currentUser = await getUser();
		if (!currentUser) {
			return NextResponse.json(
				{ status: "error", error: "Token tidak ditemukan atau tidak valid" },
				{ status: 401 }
			);
		}

		// Validasi input
		if (!action || !["approve", "reject"].includes(action)) {
			return NextResponse.json(
				{
					status: "error",
					error: "Action harus berupa 'approve' atau 'reject'",
				},
				{ status: 400 }
			);
		}

		if (action === "reject" && !reason) {
			return NextResponse.json(
				{ status: "error", error: "Alasan penolakan harus diisi" },
				{ status: 400 }
			);
		}

		const connection = await createConnection();

		// Check if user is from IT department
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

		// Check if user is from IT department
		const [
			deptResult,
		] = await connection.execute(
			"SELECT nama FROM departemen WHERE dep_id = ?",
			[userResult[0].departemen]
		);

		// Check if user is from IT department (including SIM)
		const isITDepartment = (deptName) => {
			if (!deptName) return false;
			const name = deptName.toLowerCase();
			return (
				name.includes("it") ||
				name.includes("information technology") ||
				name.includes("teknologi informasi") ||
				name.includes("sim") ||
				name.includes("sistem informasi") ||
				name.includes("unit sim") ||
				name.includes("information system")
			);
		};

		if (deptResult.length === 0 || !isITDepartment(deptResult[0].nama)) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error: "Hanya user dari departemen IT yang dapat melakukan approval",
				},
				{ status: 403 }
			);
		}

		// Get current request details
		const [requestResult] = await connection.execute(
			`SELECT 
				dr.request_id, 
				dr.current_status_id, 
				ds.status_name as current_status
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

		const currentRequest = requestResult[0];

		// Check if request can be approved/rejected
		const allowedStatuses = ["Draft", "Submitted", "Under Review", "Need Info"];
		if (!allowedStatuses.includes(currentRequest.current_status)) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error: `Pengajuan dengan status "${currentRequest.current_status}" tidak dapat di-approve/reject`,
				},
				{ status: 400 }
			);
		}

		// Get target status ID
		const targetStatusName = action === "approve" ? "Approved" : "Rejected";
		const [
			statusResult,
		] = await connection.execute(
			"SELECT status_id FROM development_statuses WHERE status_name = ?",
			[targetStatusName]
		);

		if (statusResult.length === 0) {
			await connection.end();
			return NextResponse.json(
				{ status: "error", error: "Status target tidak ditemukan" },
				{ status: 500 }
			);
		}

		const targetStatusId = statusResult[0].status_id;

		// Update request status
		await connection.execute(
			`UPDATE development_requests 
			SET current_status_id = ?, 
				approved_date = ${action === "approve" ? "NOW()" : "NULL"},
				approved_by = ${action === "approve" ? "?" : "NULL"},
				updated_date = NOW()
			WHERE request_id = ?`,
			action === "approve"
				? [targetStatusId, currentUser.username, id]
				: [targetStatusId, id]
		);

		// Add status history
		await connection.execute(
			`INSERT INTO development_status_history 
			(request_id, old_status, new_status, changed_by, change_date, change_reason) 
			VALUES (?, ?, ?, ?, NOW(), ?)`,
			[
				id,
				currentRequest.current_status_id,
				targetStatusId,
				currentUser.username,
				reason || `Request ${action}d by IT Manager`,
			]
		);

		// Add approval/rejection note
		const noteType = action === "approve" ? "approval" : "rejection";
		const noteText =
			action === "approve"
				? `Pengajuan disetujui oleh IT Manager${
						reason ? `. Catatan: ${reason}` : ""
				  }`
				: `Pengajuan ditolak oleh IT Manager. Alasan: ${reason}`;

		await connection.execute(
			`INSERT INTO development_notes 
			(request_id, note, note_type, created_by, created_date) 
			VALUES (?, ?, ?, ?, NOW())`,
			[id, noteText, noteType, currentUser.username]
		);

		await connection.end();

		return NextResponse.json({
			status: "success",
			message: `Pengajuan berhasil ${
				action === "approve" ? "disetujui" : "ditolak"
			}`,
			data: {
				request_id: id,
				new_status: targetStatusName,
				action: action,
				approved_by: currentUser.username,
				reason: reason,
			},
		});
	} catch (error) {
		console.error("Error in approval process:", error);
		return NextResponse.json(
			{ status: "error", error: "Terjadi kesalahan saat memproses approval" },
			{ status: 500 }
		);
	}
}
