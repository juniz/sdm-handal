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

		await connection.end();

		return NextResponse.json({
			success: true,
			message: "Progress updated successfully",
		});
	} catch (error) {
		console.error("Error updating progress:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
