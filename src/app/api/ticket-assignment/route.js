import { NextResponse } from "next/server";
import { select, insert, update, selectFirst, rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

// Fungsi untuk mencatat status history
const recordStatusHistory = async (
	ticketId,
	oldStatusId,
	newStatusId,
	changedBy
) => {
	try {
		// Jangan record jika status sama
		if (oldStatusId === newStatusId) {
			return;
		}

		await insert({
			table: "status_history_ticket",
			data: {
				ticket_id: ticketId,
				old_status: oldStatusId,
				new_status: newStatusId,
				changed_by: changedBy,
				change_date: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
		});

		console.log(
			`Status history recorded: Ticket ${ticketId}, ${oldStatusId} -> ${newStatusId} by ${changedBy}`
		);
	} catch (error) {
		console.error("Error recording status history:", error);
		// Tidak throw error karena ini bukan proses critical
	}
};

export async function GET(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Token tidak valid",
				},
				{ status: 401 }
			);
		}

		// Validasi user adalah bagian dari departemen IT
		if (user.departemen !== "IT") {
			return NextResponse.json(
				{
					status: "error",
					error: "Akses ditolak - Hanya untuk departemen IT",
				},
				{ status: 403 }
			);
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");
		const priority = searchParams.get("priority");
		const category = searchParams.get("category");
		const assigned_to = searchParams.get("assigned_to");
		const search = searchParams.get("search");
		const page = parseInt(searchParams.get("page")) || 1;
		const limit = parseInt(searchParams.get("limit")) || 10;
		const offset = (page - 1) * limit;

		let whereConditions = [];
		let queryParams = [];

		// Filter berdasarkan status jika ada
		if (status) {
			whereConditions.push("s.status_name = ?");
			queryParams.push(status);
		}

		// Filter berdasarkan priority jika ada
		if (priority) {
			whereConditions.push("pr.priority_name = ?");
			queryParams.push(priority);
		}

		// Filter berdasarkan category jika ada
		if (category) {
			whereConditions.push("c.category_name = ?");
			queryParams.push(category);
		}

		// Filter berdasarkan assigned_to jika ada
		if (assigned_to) {
			whereConditions.push("at.assigned_to = ?");
			queryParams.push(assigned_to);
		}

		// Filter pencarian berdasarkan nomor ticket, judul, atau deskripsi
		if (search) {
			whereConditions.push(
				"(t.no_ticket LIKE ? OR t.title LIKE ? OR t.description LIKE ?)"
			);
			const searchTerm = `%${search}%`;
			queryParams.push(searchTerm, searchTerm, searchTerm);
		}

		const whereClause =
			whereConditions.length > 0
				? `WHERE ${whereConditions.join(" AND ")}`
				: "";

		// Query untuk mengambil data ticket yang sudah di-assign (termasuk yang sudah selesai)
		const ticketsQuery = `
			SELECT DISTINCT
				t.ticket_id,
				t.no_ticket,
				t.user_id,
				t.category_id,
				t.priority_id,
				p.nama as user_name,
				d.nama as departemen_name,
				c.category_name,
				pr.priority_name,
				pr.priority_level,
				t.title,
				t.description,
				t.submission_date,
				t.resolved_date,
				t.closed_date,
				s.status_name as current_status,
				at.assigned_to,
				at.assigned_date,
				at.released_date,
				assigned_p.nama as assigned_to_name,
				COALESCE(notes_count.total_notes, 0) as notes_count
			FROM tickets t
			LEFT JOIN pegawai p ON t.user_id = p.nik
			LEFT JOIN departemen d ON t.departement_id = d.dep_id
			LEFT JOIN categories_ticket c ON t.category_id = c.category_id
			LEFT JOIN priorities_ticket pr ON t.priority_id = pr.priority_id
			LEFT JOIN statuses_ticket s ON t.current_status_id = s.status_id
			LEFT JOIN (
				SELECT at1.*
				FROM assignments_ticket at1
				WHERE at1.assignment_id = (
					SELECT at2.assignment_id
					FROM assignments_ticket at2
					WHERE at2.ticket_id = at1.ticket_id
					ORDER BY 
						CASE WHEN at2.released_date IS NULL THEN 0 ELSE 1 END,
						at2.assignment_id DESC
					LIMIT 1
				)
			) at ON t.ticket_id = at.ticket_id
			LEFT JOIN pegawai assigned_p ON at.assigned_to = assigned_p.nik
			LEFT JOIN (
				SELECT ticket_id, COUNT(*) as total_notes
				FROM ticket_notes
				GROUP BY ticket_id
			) notes_count ON t.ticket_id = notes_count.ticket_id
			WHERE (at.released_date IS NULL OR s.status_name IN ('Closed', 'Resolved'))
			${whereClause ? `AND ${whereClause.replace("WHERE ", "")}` : ""}
			ORDER BY t.submission_date DESC
			LIMIT ? OFFSET ?
		`;

		queryParams.push(limit, offset);

		const tickets = await rawQuery(ticketsQuery, queryParams);

		// Query untuk menghitung total data
		const countQuery = `
			SELECT COUNT(DISTINCT t.ticket_id) as total
			FROM tickets t
			LEFT JOIN statuses_ticket s ON t.current_status_id = s.status_id
			LEFT JOIN priorities_ticket pr ON t.priority_id = pr.priority_id
			LEFT JOIN categories_ticket c ON t.category_id = c.category_id
			LEFT JOIN (
				SELECT at1.*
				FROM assignments_ticket at1
				WHERE at1.assignment_id = (
					SELECT at2.assignment_id
					FROM assignments_ticket at2
					WHERE at2.ticket_id = at1.ticket_id
					ORDER BY 
						CASE WHEN at2.released_date IS NULL THEN 0 ELSE 1 END,
						at2.assignment_id DESC
					LIMIT 1
				)
			) at ON t.ticket_id = at.ticket_id
			WHERE (at.released_date IS NULL OR s.status_name IN ('Closed', 'Resolved'))
			${whereClause ? `AND ${whereClause.replace("WHERE ", "")}` : ""}
		`;

		const countParams = queryParams.slice(0, -2); // Remove limit and offset
		const [{ total }] = await rawQuery(countQuery, countParams);

		// Format tanggal
		const formattedTickets = tickets.map((ticket) => ({
			...ticket,
			submission_date: moment(ticket.submission_date).format(
				"DD MMMM YYYY HH:mm"
			),
			assigned_date: ticket.assigned_date
				? moment(ticket.assigned_date).format("DD MMMM YYYY HH:mm")
				: null,
			resolved_date: ticket.resolved_date
				? moment(ticket.resolved_date).format("DD MMMM YYYY HH:mm")
				: null,
			closed_date: ticket.closed_date
				? moment(ticket.closed_date).format("DD MMMM YYYY HH:mm")
				: null,
			notes_count: parseInt(ticket.notes_count) || 0,
		}));

		return NextResponse.json({
			status: "success",
			data: formattedTickets,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching assigned tickets:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil data ticket",
			},
			{ status: 500 }
		);
	}
}

export async function POST(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Token tidak valid",
				},
				{ status: 401 }
			);
		}

		// Validasi user adalah bagian dari departemen IT
		if (user.departemen !== "IT") {
			return NextResponse.json(
				{
					status: "error",
					error: "Akses ditolak - Hanya untuk departemen IT",
				},
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { ticket_id, assigned_to } = body;

		// Validasi input
		if (!ticket_id || !assigned_to) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket ID dan Assigned To harus diisi",
				},
				{ status: 400 }
			);
		}

		// Cek apakah ticket ada
		const existingTicket = await selectFirst({
			table: "tickets",
			where: { ticket_id },
		});

		if (!existingTicket) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket tidak ditemukan",
				},
				{ status: 404 }
			);
		}

		// Cek apakah ticket sudah di-assign
		const existingAssignment = await selectFirst({
			table: "assignments_ticket",
			where: { ticket_id, released_date: null },
		});

		if (existingAssignment) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket sudah ditugaskan",
				},
				{ status: 400 }
			);
		}

		// Cek apakah assigned_to adalah pegawai IT
		const assignedEmployee = await selectFirst({
			table: "pegawai",
			where: { nik: assigned_to, departemen: "IT" },
		});

		if (!assignedEmployee) {
			return NextResponse.json(
				{
					status: "error",
					error: "Pegawai tidak ditemukan atau bukan dari departemen IT",
				},
				{ status: 400 }
			);
		}

		// Get status "In Progress"
		const inProgressStatus = await selectFirst({
			table: "statuses_ticket",
			where: { status_name: "In Progress" },
		});

		if (!inProgressStatus) {
			return NextResponse.json(
				{
					status: "error",
					error: "Status 'In Progress' tidak ditemukan",
				},
				{ status: 500 }
			);
		}

		// Simpan old status untuk history
		const oldStatusId = existingTicket.current_status_id;

		// Insert assignment
		await insert({
			table: "assignments_ticket",
			data: {
				ticket_id: parseInt(ticket_id),
				assigned_to: assigned_to,
				assigned_by: user.username,
				assigned_date: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
		});

		// Update ticket status ke In Progress
		await update({
			table: "tickets",
			data: {
				current_status_id: inProgressStatus.status_id,
			},
			where: { ticket_id },
		});

		// Record status history (Open -> In Progress)
		await recordStatusHistory(
			ticket_id,
			oldStatusId,
			inProgressStatus.status_id,
			user.username
		);

		return NextResponse.json({
			status: "success",
			message: "Ticket berhasil ditugaskan",
		});
	} catch (error) {
		console.error("Error assigning ticket:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal menugaskan ticket: " + error.message,
			},
			{ status: 500 }
		);
	}
}

// PUT - Handle both release assignment and update status
export async function PUT(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Token tidak valid",
				},
				{ status: 401 }
			);
		}

		// Validasi user adalah bagian dari departemen IT
		if (user.departemen !== "IT") {
			return NextResponse.json(
				{
					status: "error",
					error: "Akses ditolak - Hanya untuk departemen IT",
				},
				{ status: 403 }
			);
		}

		const body = await request.json();
		const { ticket_id, status, notes, action } = body;

		// Jika action adalah 'release', gunakan logic release assignment
		if (action === "release") {
			if (!ticket_id) {
				return NextResponse.json(
					{
						status: "error",
						error: "Ticket ID harus diisi",
					},
					{ status: 400 }
				);
			}

			// Cek apakah assignment ada
			const existingAssignment = await selectFirst({
				table: "assignments_ticket",
				where: { ticket_id, released_date: null },
			});

			if (!existingAssignment) {
				return NextResponse.json(
					{
						status: "error",
						error: "Assignment aktif tidak ditemukan",
					},
					{ status: 404 }
				);
			}

			// Get ticket untuk mendapatkan current status
			const existingTicket = await selectFirst({
				table: "tickets",
				where: { ticket_id },
			});

			// Get status "Open"
			const openStatus = await selectFirst({
				table: "statuses_ticket",
				where: { status_name: "Open" },
			});

			if (!openStatus) {
				return NextResponse.json(
					{
						status: "error",
						error: "Status 'Open' tidak ditemukan",
					},
					{ status: 500 }
				);
			}

			// Update assignment dengan released_date
			await update({
				table: "assignments_ticket",
				data: {
					released_date: moment().format("YYYY-MM-DD HH:mm:ss"),
					released_by: user.username,
				},
				where: { assignment_id: existingAssignment.assignment_id },
			});

			// Simpan old status untuk history
			const oldStatusId = existingTicket.current_status_id;

			// Update ticket untuk menghapus assigned_to dan ubah status ke Open
			await update({
				table: "tickets",
				data: {
					current_status_id: openStatus.status_id,
				},
				where: { ticket_id },
			});

			// Record status history (Assigned -> Open)
			await recordStatusHistory(
				ticket_id,
				oldStatusId,
				openStatus.status_id,
				user.username
			);

			return NextResponse.json({
				status: "success",
				message: "Assignment berhasil dilepas",
			});
		}

		// Jika action adalah 'update_status' atau tidak ada action, gunakan logic update status
		if (!ticket_id || !status) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket ID dan Status harus diisi",
				},
				{ status: 400 }
			);
		}

		// Validasi status yang diizinkan untuk IT
		const allowedStatuses = ["In Progress", "On Hold", "Resolved"];
		if (!allowedStatuses.includes(status)) {
			return NextResponse.json(
				{
					status: "error",
					error: "Status tidak valid",
				},
				{ status: 400 }
			);
		}

		// Cek apakah ticket ada
		const existingTicket = await selectFirst({
			table: "tickets",
			where: { ticket_id },
		});

		if (!existingTicket) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket tidak ditemukan",
				},
				{ status: 404 }
			);
		}

		// Cek apakah ticket sudah di-assign
		const assignment = await selectFirst({
			table: "assignments_ticket",
			where: { ticket_id, released_date: null },
		});

		if (!assignment) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket belum ditugaskan atau assignment sudah dilepas",
				},
				{ status: 400 }
			);
		}

		// Validasi bahwa user yang update adalah yang ditugaskan atau admin IT
		if (assignment.assigned_to !== user.username) {
			// Cek apakah user adalah admin IT (bisa update semua ticket)
			const isItAdmin = await rawQuery(
				"SELECT COUNT(*) as count FROM pegawai WHERE nik = ? AND departemen = 'IT'",
				[user.username]
			);

			if (isItAdmin[0].count === 0) {
				return NextResponse.json(
					{
						status: "error",
						error:
							"Anda hanya bisa mengupdate ticket yang ditugaskan kepada Anda",
					},
					{ status: 403 }
				);
			}
		}

		// Get status ID berdasarkan status name
		const statusData = await selectFirst({
			table: "statuses_ticket",
			where: { status_name: status },
		});

		if (!statusData) {
			return NextResponse.json(
				{
					status: "error",
					error: "Status tidak ditemukan dalam database",
				},
				{ status: 400 }
			);
		}

		// Simpan old status untuk history
		const oldStatusId = existingTicket.current_status_id;

		// Update ticket status
		const updateData = {
			current_status_id: statusData.status_id,
		};

		// Set resolved_date jika status Resolved
		if (status === "Resolved" && !existingTicket.resolved_date) {
			updateData.resolved_date = moment().format("YYYY-MM-DD HH:mm:ss");
		}

		await update({
			table: "tickets",
			data: updateData,
			where: { ticket_id },
		});

		// Insert update note jika ada
		if (notes && notes.trim()) {
			await insert({
				table: "ticket_notes",
				data: {
					ticket_id: parseInt(ticket_id),
					note: notes.trim(),
					created_by: user.username,
					created_date: moment().format("YYYY-MM-DD HH:mm:ss"),
					note_type: "status_update",
				},
			});
		}

		// Record status history
		await recordStatusHistory(
			ticket_id,
			oldStatusId,
			statusData.status_id,
			user.username
		);

		return NextResponse.json({
			status: "success",
			message: `Status ticket berhasil diubah ke ${status}`,
		});
	} catch (error) {
		console.error("Error updating ticket status:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengupdate status ticket: " + error.message,
			},
			{ status: 500 }
		);
	}
}
