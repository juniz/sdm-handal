import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function POST(request, { params }) {
	try {
		const { id } = params;
		const body = await request.json();
		const {
			progress_percentage,
			progress_description,
			milestone,
			new_status,
		} = body;

		// Get user info from token
		const currentUser = await getUser();
		if (!currentUser) {
			return NextResponse.json(
				{ status: "error", error: "Token tidak ditemukan atau tidak valid" },
				{ status: 401 }
			);
		}

		// Validasi input
		if (
			progress_percentage === undefined ||
			progress_percentage < 0 ||
			progress_percentage > 100
		) {
			return NextResponse.json(
				{ status: "error", error: "Progress percentage harus antara 0-100" },
				{ status: 400 }
			);
		}

		const connection = await createConnection();

		// Get current request details
		const [requestResult] = await connection.execute(
			`SELECT 
				dr.request_id, 
				dr.current_status_id, 
				ds.status_name as current_status,
				da.assigned_to
			FROM development_requests dr
			LEFT JOIN development_statuses ds ON dr.current_status_id = ds.status_id
			LEFT JOIN development_assignments da ON dr.request_id = da.request_id AND da.is_active = TRUE
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

		// Check authorization - either assigned developer or IT manager
		const isAssignedDeveloper =
			currentRequest.assigned_to === currentUser.username;

		let isITManager = false;
		if (!isAssignedDeveloper) {
			// Check if user is from IT department
			const [
				userResult,
			] = await connection.execute(
				"SELECT departemen FROM pegawai WHERE nik = ?",
				[currentUser.username]
			);

			if (userResult.length > 0) {
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

				isITManager =
					deptResult.length > 0 && isITDepartment(deptResult[0].nama);
			}
		}

		if (!isAssignedDeveloper && !isITManager) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error:
						"Hanya developer yang di-assign atau IT Manager yang dapat update progress",
				},
				{ status: 403 }
			);
		}

		// Check if request can have progress updated
		const allowedStatuses = [
			"Assigned",
			"In Development",
			"Development Complete",
			"In Testing",
			"Bug Found",
		];
		if (!allowedStatuses.includes(currentRequest.current_status)) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error: `Request dengan status "${currentRequest.current_status}" tidak dapat diupdate progressnya`,
				},
				{ status: 400 }
			);
		}

		// Add progress record
		await connection.execute(
			`INSERT INTO development_progress 
			(request_id, progress_percentage, progress_description, milestone, updated_by, update_date) 
			VALUES (?, ?, ?, ?, ?, NOW())`,
			[
				id,
				progress_percentage,
				progress_description || null,
				milestone || null,
				currentUser.username,
			]
		);

		// Update status if provided and different from current
		let statusUpdateMessage = "";
		if (new_status && new_status !== currentRequest.current_status) {
			// Validate status transition
			const [
				newStatusResult,
			] = await connection.execute(
				"SELECT status_id FROM development_statuses WHERE status_name = ?",
				[new_status]
			);

			if (newStatusResult.length > 0) {
				await connection.execute(
					"UPDATE development_requests SET current_status_id = ?, updated_date = NOW() WHERE request_id = ?",
					[newStatusResult[0].status_id, id]
				);

				// Add status history
				await connection.execute(
					`INSERT INTO development_status_history 
					(request_id, old_status, new_status, changed_by, change_date, change_reason) 
					VALUES (?, ?, ?, ?, NOW(), ?)`,
					[
						id,
						currentRequest.current_status_id,
						newStatusResult[0].status_id,
						currentUser.username,
						`Progress update: ${progress_percentage}%`,
					]
				);

				statusUpdateMessage = ` dan status diubah ke "${new_status}"`;
			}
		}

		// Auto-update status based on progress percentage
		let autoStatusUpdate = "";
		if (!new_status) {
			if (
				progress_percentage === 100 &&
				currentRequest.current_status === "In Development"
			) {
				const [completeStatusResult] = await connection.execute(
					"SELECT status_id FROM development_statuses WHERE status_name = 'Development Complete'"
				);

				if (completeStatusResult.length > 0) {
					await connection.execute(
						"UPDATE development_requests SET current_status_id = ?, updated_date = NOW() WHERE request_id = ?",
						[completeStatusResult[0].status_id, id]
					);

					await connection.execute(
						`INSERT INTO development_status_history 
						(request_id, old_status, new_status, changed_by, change_date, change_reason) 
						VALUES (?, ?, ?, ?, NOW(), ?)`,
						[
							id,
							currentRequest.current_status_id,
							completeStatusResult[0].status_id,
							currentUser.username,
							"Auto-updated: Development Complete (100% progress)",
						]
					);

					autoStatusUpdate =
						' dan status otomatis diubah ke "Development Complete"';
				}
			} else if (
				progress_percentage > 0 &&
				currentRequest.current_status === "Assigned"
			) {
				const [inDevStatusResult] = await connection.execute(
					"SELECT status_id FROM development_statuses WHERE status_name = 'In Development'"
				);

				if (inDevStatusResult.length > 0) {
					await connection.execute(
						"UPDATE development_requests SET current_status_id = ?, updated_date = NOW() WHERE request_id = ?",
						[inDevStatusResult[0].status_id, id]
					);

					await connection.execute(
						`INSERT INTO development_status_history 
						(request_id, old_status, new_status, changed_by, change_date, change_reason) 
						VALUES (?, ?, ?, ?, NOW(), ?)`,
						[
							id,
							currentRequest.current_status_id,
							inDevStatusResult[0].status_id,
							currentUser.username,
							"Auto-updated: In Development (progress started)",
						]
					);

					autoStatusUpdate = ' dan status otomatis diubah ke "In Development"';
				}
			}
		}

		// Add progress note
		const noteText = `Progress update: ${progress_percentage}%${
			milestone ? `. Milestone: ${milestone}` : ""
		}${progress_description ? `. ${progress_description}` : ""}`;

		await connection.execute(
			`INSERT INTO development_notes 
			(request_id, note, note_type, created_by, created_date) 
			VALUES (?, ?, ?, ?, NOW())`,
			[id, noteText, "update", currentUser.username]
		);

		await connection.end();

		return NextResponse.json({
			status: "success",
			message: `Progress berhasil diupdate ke ${progress_percentage}%${statusUpdateMessage}${autoStatusUpdate}`,
			data: {
				request_id: id,
				progress_percentage: progress_percentage,
				progress_description: progress_description,
				milestone: milestone,
				updated_by: currentUser.username,
			},
		});
	} catch (error) {
		console.error("Error in progress update:", error);
		return NextResponse.json(
			{ status: "error", error: "Terjadi kesalahan saat update progress" },
			{ status: 500 }
		);
	}
}

// GET endpoint untuk mengambil riwayat progress
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

		// Get progress history
		const [progressResult] = await connection.execute(
			`SELECT 
				dp.progress_id,
				dp.progress_percentage,
				dp.progress_description,
				dp.milestone,
				dp.updated_by,
				p.nama as updated_by_name,
				dp.update_date
			FROM development_progress dp
			LEFT JOIN pegawai p ON dp.updated_by = p.nik
			WHERE dp.request_id = ?
			ORDER BY dp.update_date DESC`,
			[id]
		);

		// Get current progress
		const [currentProgressResult] = await connection.execute(
			`SELECT 
				progress_percentage,
				progress_description,
				milestone,
				updated_by,
				p.nama as updated_by_name,
				update_date
			FROM development_progress dp
			LEFT JOIN pegawai p ON dp.updated_by = p.nik
			WHERE dp.request_id = ?
			ORDER BY dp.update_date DESC
			LIMIT 1`,
			[id]
		);

		await connection.end();

		return NextResponse.json({
			status: "success",
			data: {
				progress_history: progressResult,
				current_progress: currentProgressResult[0] || null,
			},
		});
	} catch (error) {
		console.error("Error fetching progress:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Terjadi kesalahan saat mengambil data progress",
			},
			{ status: 500 }
		);
	}
}
