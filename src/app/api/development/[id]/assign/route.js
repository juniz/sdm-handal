import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import { getUser } from "@/lib/auth";

// Function to calculate working hours between two dates (excluding weekends)
const calculateWorkingHours = (startDate, endDate) => {
	const start = new Date(startDate);
	const end = new Date(endDate);

	// Reset time to start of day for accurate calculation
	start.setHours(0, 0, 0, 0);
	end.setHours(0, 0, 0, 0);

	let workingDays = 0;
	let current = new Date(start);

	while (current <= end) {
		// Check if current day is weekday (Monday = 1, Sunday = 0)
		const dayOfWeek = current.getDay();
		if (dayOfWeek !== 0 && dayOfWeek !== 6) {
			// Not Sunday (0) or Saturday (6)
			workingDays++;
		}
		current.setDate(current.getDate() + 1);
	}

	// Assume 8 working hours per day
	return workingDays * 8;
};

export async function POST(request, { params }) {
	try {
		const { id } = params;
		const body = await request.json();
		const { assigned_to, assignment_notes, estimated_completion_date } = body;

		// Get user info from token
		const currentUser = await getUser();
		if (!currentUser) {
			return NextResponse.json(
				{ status: "error", error: "Token tidak ditemukan atau tidak valid" },
				{ status: 401 }
			);
		}

		// Validasi input
		if (!assigned_to) {
			return NextResponse.json(
				{
					status: "error",
					error: "Developer yang akan di-assign harus dipilih",
				},
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

		// Check if user is from IT department (including SIM)
		const [
			deptResult,
		] = await connection.execute(
			"SELECT nama FROM departemen WHERE dep_id = ?",
			[userResult[0].departemen]
		);

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
					error:
						"Hanya user dari departemen IT yang dapat melakukan assignment",
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
				{ status: "error", error: "Request tidak ditemukan" },
				{ status: 404 }
			);
		}

		const currentRequest = requestResult[0];

		// Check if request can be assigned (Approved or any development status for re-assignment)
		const assignableStatuses = [
			"Approved",
			"Assigned",
			"In Development",
			"Development Complete",
			"In Testing",
			"Bug Found",
		];

		if (!assignableStatuses.includes(currentRequest.current_status)) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error: `Request dengan status "${currentRequest.current_status}" tidak dapat di-assign. Status harus "Approved" atau dalam tahap development untuk re-assignment`,
				},
				{ status: 400 }
			);
		}

		// Check if assigned developer exists
		const [
			devResult,
		] = await connection.execute(
			"SELECT nik, nama FROM pegawai WHERE nik = ?",
			[assigned_to]
		);

		if (devResult.length === 0) {
			await connection.end();
			return NextResponse.json(
				{ status: "error", error: "Developer yang dipilih tidak ditemukan" },
				{ status: 400 }
			);
		}

		// Calculate estimated hours if completion date is provided
		let estimated_hours = null;
		if (estimated_completion_date) {
			const today = new Date();
			const completionDate = new Date(estimated_completion_date);
			estimated_hours = calculateWorkingHours(today, completionDate);
		}

		// Deactivate previous assignments for this request
		await connection.execute(
			"UPDATE development_assignments SET is_active = FALSE WHERE request_id = ?",
			[id]
		);

		// Create new assignment
		await connection.execute(
			`INSERT INTO development_assignments 
			(request_id, assigned_to, assigned_by, assignment_date, assignment_notes, estimated_hours, estimated_completion_date, is_active) 
			VALUES (?, ?, ?, NOW(), ?, ?, ?, TRUE)`,
			[
				id,
				assigned_to,
				currentUser.username,
				assignment_notes || null,
				estimated_hours || null,
				estimated_completion_date || null,
			]
		);

		// Update request status to "Assigned" only if current status is "Approved"
		// For re-assignment, we don't change the status
		if (currentRequest.current_status === "Approved") {
			const [assignedStatusResult] = await connection.execute(
				"SELECT status_id FROM development_statuses WHERE status_name = 'Assigned'"
			);

			if (assignedStatusResult.length > 0) {
				await connection.execute(
					"UPDATE development_requests SET current_status_id = ?, updated_date = NOW() WHERE request_id = ?",
					[assignedStatusResult[0].status_id, id]
				);

				// Add status history
				await connection.execute(
					`INSERT INTO development_status_history 
					(request_id, old_status, new_status, changed_by, change_date, change_reason) 
					VALUES (?, ?, ?, ?, NOW(), ?)`,
					[
						id,
						currentRequest.current_status_id,
						assignedStatusResult[0].status_id,
						currentUser.username,
						`Assigned to ${devResult[0].nama}`,
					]
				);
			}
		}

		// Add assignment note
		const isReassignment = currentRequest.current_status !== "Approved";
		const actionText = isReassignment ? "di-assign ulang" : "di-assign";

		const noteText = `Request ${actionText} ke ${
			devResult[0].nama
		} oleh IT Manager${
			assignment_notes ? `. Catatan: ${assignment_notes}` : ""
		}${
			estimated_completion_date
				? `. Target selesai: ${new Date(
						estimated_completion_date
				  ).toLocaleDateString("id-ID")}`
				: ""
		}${estimated_hours ? ` (${estimated_hours} jam kerja)` : ""}`;

		await connection.execute(
			`INSERT INTO development_notes 
			(request_id, note, note_type, created_by, created_date) 
			VALUES (?, ?, ?, ?, NOW())`,
			[id, noteText, "assignment", currentUser.username]
		);

		await connection.end();

		return NextResponse.json({
			status: "success",
			message: `Request berhasil ${actionText} ke ${devResult[0].nama}`,
			data: {
				request_id: id,
				assigned_to: assigned_to,
				assigned_to_name: devResult[0].nama,
				assigned_by: currentUser.username,
				assignment_notes: assignment_notes,
				estimated_hours: estimated_hours,
				estimated_completion_date: estimated_completion_date,
			},
		});
	} catch (error) {
		console.error("Error in assignment process:", error);
		return NextResponse.json(
			{ status: "error", error: "Terjadi kesalahan saat memproses assignment" },
			{ status: 500 }
		);
	}
}

// GET endpoint untuk mengambil daftar developer yang bisa di-assign
export async function GET(request, { params }) {
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

		// Get developers from IT department
		const [developersResult] = await connection.execute(
			`SELECT 
				p.nik, 
				p.nama, 
				p.jbtn as jabatan,
				d.nama as departemen_name
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.departemen = 'IT'
            AND p.stts_aktif = 'Aktif'
			ORDER BY p.nama`
		);

		// Get current assignment for this request
		const [currentAssignmentResult] = await connection.execute(
			`SELECT 
				da.assigned_to,
				p.nama as assigned_to_name,
				da.assignment_notes,
				da.estimated_hours,
				da.estimated_completion_date,
				da.assignment_date
			FROM development_assignments da
			LEFT JOIN pegawai p ON da.assigned_to = p.nik
			WHERE da.request_id = ? AND da.is_active = TRUE
			ORDER BY da.assignment_date DESC
			LIMIT 1`,
			[id]
		);

		await connection.end();

		return NextResponse.json({
			status: "success",
			data: {
				developers: developersResult,
				current_assignment: currentAssignmentResult[0] || null,
			},
		});
	} catch (error) {
		console.error("Error fetching developers:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Terjadi kesalahan saat mengambil data developer",
			},
			{ status: 500 }
		);
	}
}
