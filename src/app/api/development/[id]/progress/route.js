import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request, { params }) {
	try {
		const { id } = params;
		const currentUser = await getUser();

		if (!currentUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const connection = await createConnection();

		// Get current progress
		const [currentProgressResult] = await connection.execute(
			`SELECT 
				progress_percentage,
				progress_description,
				milestone,
				update_date,
				updated_by
			FROM development_progress 
			WHERE request_id = ? 
			ORDER BY update_date DESC 
			LIMIT 1`,
			[id]
		);

		// Get progress history with employee names
		const [historyResult] = await connection.execute(
			`SELECT 
				dp.progress_percentage,
				dp.progress_description,
				dp.milestone,
				dp.update_date,
				dp.updated_by,
				p.nama as updated_by_name
			FROM development_progress dp
			LEFT JOIN pegawai p ON dp.updated_by = p.nik
			WHERE dp.request_id = ? 
			ORDER BY dp.update_date DESC`,
			[id]
		);

		await connection.end();

		return NextResponse.json({
			success: true,
			data: {
				current_progress: currentProgressResult[0]?.progress_percentage || 0,
				history: historyResult,
			},
		});
	} catch (error) {
		console.error("Error fetching progress:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}

export async function POST(request, { params }) {
	try {
		const { id } = params;
		const currentUser = await getUser();

		if (!currentUser) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { progress_percentage, progress_description, milestone } = body;

		// Validation
		if (
			!progress_percentage ||
			progress_percentage < 0 ||
			progress_percentage > 100
		) {
			return NextResponse.json(
				{ error: "Progress percentage must be between 0 and 100" },
				{ status: 400 }
			);
		}

		if (!progress_description || progress_description.trim().length === 0) {
			return NextResponse.json(
				{ error: "Progress description is required" },
				{ status: 400 }
			);
		}

		const connection = await createConnection();

		// Check if user can update progress
		const [requestResult] = await connection.execute(
			`SELECT 
				dr.current_status_id, 
				ds.status_name as current_status,
				da.assigned_to
			FROM development_requests dr
			LEFT JOIN development_statuses ds ON dr.current_status_id = ds.status_id
			LEFT JOIN development_assignments da ON dr.request_id = da.request_id AND da.is_active = true
			WHERE dr.request_id = ?`,
			[id]
		);

		if (requestResult.length === 0) {
			await connection.end();
			return NextResponse.json(
				{ error: "Development request not found" },
				{ status: 404 }
			);
		}

		const requestData = requestResult[0];
		const isUserFromIT = currentUser.departement_id === "IT";
		const isAssignedDeveloper =
			requestData.assigned_to === currentUser.username;
		const canUpdateProgress = isUserFromIT || isAssignedDeveloper;

		if (!canUpdateProgress) {
			await connection.end();
			return NextResponse.json(
				{ error: "You are not authorized to update progress for this request" },
				{ status: 403 }
			);
		}

		// Check if status allows progress updates
		const allowedStatuses = [
			"Assigned",
			"In Development",
			"Development Complete",
			"In Testing",
			"Testing Complete",
			"In Deployment",
			"UAT",
		];

		if (!allowedStatuses.includes(requestData.current_status)) {
			await connection.end();
			return NextResponse.json(
				{
					error: `Progress cannot be updated for status: ${requestData.current_status}`,
				},
				{ status: 400 }
			);
		}

		// Insert progress update
		await connection.execute(
			`INSERT INTO development_progress 
			(request_id, progress_percentage, progress_description, milestone, updated_by, update_date) 
			VALUES (?, ?, ?, ?, ?, NOW())`,
			[
				id,
				progress_percentage,
				progress_description.trim(),
				milestone?.trim() || null,
				currentUser.username,
			]
		);

		// Track if status was actually auto-updated
		let statusAutoUpdated = false;

		// Auto-update status to "Completed" if progress reaches 100%
		if (progress_percentage === 100) {
			// Get Completed status ID
			const [completedStatusResult] = await connection.execute(
				"SELECT status_id FROM development_statuses WHERE status_name = 'Completed'"
			);

			if (completedStatusResult.length > 0) {
				const completedStatusId = completedStatusResult[0].status_id;

				// Only update if current status is not already Completed or Closed
				if (
					requestData.current_status !== "Completed" &&
					requestData.current_status !== "Closed"
				) {
					// Update request status to Completed
					await connection.execute(
						`UPDATE development_requests 
						SET current_status_id = ?, 
							completed_date = NOW(),
							updated_date = NOW()
						WHERE request_id = ?`,
						[completedStatusId, id]
					);

					// Add status history
					await connection.execute(
						`INSERT INTO development_status_history 
						(request_id, old_status, new_status, changed_by, change_date, change_reason) 
						VALUES (?, ?, ?, ?, NOW(), ?)`,
						[
							id,
							requestData.current_status_id,
							completedStatusId,
							currentUser.username,
							"Progress mencapai 100% - Status otomatis diupdate menjadi Completed",
						]
					);

					// Add note about auto-completion
					await connection.execute(
						`INSERT INTO development_notes 
						(request_id, note, note_type, created_by, created_date) 
						VALUES (?, ?, ?, ?, NOW())`,
						[
							id,
							`Progress mencapai 100%. Status otomatis diupdate menjadi Completed oleh sistem.`,
							"update",
							currentUser.username,
						]
					);

					// Mark that status was successfully updated
					statusAutoUpdated = true;
				}
			}
		}

		await connection.end();

		return NextResponse.json({
			success: true,
			message: statusAutoUpdated
				? "Progress updated successfully. Status automatically changed to Completed."
				: "Progress updated successfully",
			auto_status_update: statusAutoUpdated,
		});
	} catch (error) {
		console.error("Error updating progress:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
