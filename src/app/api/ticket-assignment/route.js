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

// GET - Ambil daftar ticket untuk assignment (khusus user IT)
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
		const assignedTo = searchParams.get("assigned_to");
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
		if (assignedTo) {
			if (assignedTo === "unassigned") {
				whereConditions.push("t.assigned_to IS NULL");
			} else {
				whereConditions.push("t.assigned_to = ?");
				queryParams.push(assignedTo);
			}
		}

		// Filter pencarian
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

		// Query untuk mengambil data ticket dengan assignment info dan count notes
		const ticketsQuery = `
			SELECT 
				t.ticket_id,
				t.no_ticket,
				t.user_id,
				t.category_id,
				t.priority_id,
				ta.assigned_to,
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
				assigned_pegawai.nama as assigned_to_name,
				ta.assigned_date,
				ta.released_date,
				assigned_by_pegawai.nama as assigned_by_name,
				COALESCE(notes_count.total_notes, 0) as notes_count
			FROM tickets t
			LEFT JOIN pegawai p ON t.user_id = p.nik
			LEFT JOIN departemen d ON t.departement_id = d.dep_id
			LEFT JOIN categories_ticket c ON t.category_id = c.category_id
			LEFT JOIN priorities_ticket pr ON t.priority_id = pr.priority_id
			LEFT JOIN statuses_ticket s ON t.current_status_id = s.status_id
			LEFT JOIN assignments_ticket ta ON t.ticket_id = ta.ticket_id AND ta.released_date IS NULL
			LEFT JOIN pegawai assigned_pegawai ON ta.assigned_to = assigned_pegawai.nik
			LEFT JOIN pegawai assigned_by_pegawai ON ta.assigned_by = assigned_by_pegawai.nik
			LEFT JOIN (
				SELECT ticket_id, COUNT(*) as total_notes
				FROM ticket_notes
				GROUP BY ticket_id
			) notes_count ON t.ticket_id = notes_count.ticket_id
			${whereClause}
			ORDER BY 
				CASE 
					WHEN ta.assigned_to IS NULL THEN 0 
					ELSE 1 
				END,
				pr.priority_level DESC,
				t.submission_date DESC
			LIMIT ? OFFSET ?
		`;

		queryParams.push(limit, offset);

		const tickets = await rawQuery(ticketsQuery, queryParams);

		// Query untuk menghitung total data
		const countQuery = `
			SELECT COUNT(*) as total
			FROM tickets t
			LEFT JOIN statuses_ticket s ON t.current_status_id = s.status_id
			LEFT JOIN priorities_ticket pr ON t.priority_id = pr.priority_id
			LEFT JOIN categories_ticket c ON t.category_id = c.category_id
			${whereClause}
		`;

		const countParams = queryParams.slice(0, -2);
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
			released_date: ticket.released_date
				? moment(ticket.released_date).format("DD MMMM YYYY HH:mm")
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
		console.error("Error fetching tickets for assignment:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil data ticket",
			},
			{ status: 500 }
		);
	}
}

// POST - Assign ticket ke pegawai IT
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

		// Cek apakah pegawai yang ditugaskan ada dan dari departemen IT
		const assignedEmployee = await rawQuery(
			"SELECT p.nik, p.nama, d.dep_id FROM pegawai p LEFT JOIN departemen d ON p.departemen = d.dep_id WHERE p.nik = ? AND d.dep_id = 'IT'",
			[assigned_to]
		);

		if (assignedEmployee.length === 0) {
			return NextResponse.json(
				{
					status: "error",
					error:
						"Pegawai yang ditugaskan tidak ditemukan atau bukan dari departemen IT",
				},
				{ status: 400 }
			);
		}

		// Get status "Assigned"
		// const assignedStatus = await selectFirst({
		// 	table: "assignments_ticket",
		// 	where: { ticket_id: ticket_id },
		// });

		// if (!assignedStatus) {
		// 	return NextResponse.json(
		// 		{
		// 			status: "error",
		// 			error: "Status 'Assigned' tidak ditemukan",
		// 		},
		// 		{ status: 500 }
		// 	);
		// }

		// Simpan old status untuk history
		const oldStatusId = existingTicket.current_status_id;

		// Update ticket dengan assigned_to dan status
		await update({
			table: "tickets",
			data: {
				current_status_id: 2,
			},
			where: { ticket_id },
		});

		// Insert ke assignments_ticket
		await insert({
			table: "assignments_ticket",
			data: {
				ticket_id: parseInt(ticket_id),
				assigned_to: assigned_to,
				assigned_by: user.username,
				assigned_date: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
		});

		// Record status history (old status -> Assigned)
		await recordStatusHistory(ticket_id, oldStatusId, 2, user.username);

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

// PUT - Release assignment (set released_date)
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
		const { ticket_id } = body;

		// Validasi input
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
	} catch (error) {
		console.error("Error releasing assignment:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal melepas assignment: " + error.message,
			},
			{ status: 500 }
		);
	}
}

// PATCH - Update status ticket oleh pegawai IT
export async function PATCH(request) {
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
		const { ticket_id, status, notes } = body;

		// Validasi input
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
