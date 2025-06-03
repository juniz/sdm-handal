import { NextResponse } from "next/server";
import { select, insert, update, selectFirst, rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

// Fungsi untuk generate nomor ticket
const generateTicketNumber = async () => {
	try {
		// Format: TKT-YYYYMMDD-XXXX
		const today = moment().format("YYYYMMDD");
		const prefix = `TKT-${today}`;

		// Cari nomor ticket terakhir hari ini
		const lastTicket = await rawQuery(
			"SELECT no_ticket FROM tickets WHERE no_ticket LIKE ? ORDER BY no_ticket DESC LIMIT 1",
			[`${prefix}-%`]
		);

		let sequence = 1;
		if (lastTicket.length > 0) {
			// Extract sequence number dari nomor ticket terakhir
			const lastNumber = lastTicket[0].no_ticket;
			const lastSequence = parseInt(lastNumber.split("-")[2]);
			sequence = lastSequence + 1;
		}

		// Format sequence dengan 4 digit (0001, 0002, dst)
		const sequenceStr = sequence.toString().padStart(4, "0");
		return `${prefix}-${sequenceStr}`;
	} catch (error) {
		console.error("Error generating ticket number:", error);
		// Fallback jika ada error
		const timestamp = moment().format("YYYYMMDDHHmmss");
		return `TKT-${timestamp}`;
	}
};

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
		// Ambil data user dari JWT token (opsional untuk filter)
		const user = await getUser();

		const { searchParams } = new URL(request.url);
		const userId = searchParams.get("user_id");
		const status = searchParams.get("status");
		const priority = searchParams.get("priority");
		const category = searchParams.get("category");
		const search = searchParams.get("search"); // Parameter untuk pencarian
		const myTickets = searchParams.get("my_tickets"); // Parameter untuk filter ticket milik user
		const page = parseInt(searchParams.get("page")) || 1;
		const limit = parseInt(searchParams.get("limit")) || 10;
		const offset = (page - 1) * limit;

		let whereConditions = [];
		let queryParams = [];

		// Filter berdasarkan user yang sedang login jika parameter my_tickets = true
		if (myTickets === "true" && user) {
			whereConditions.push("t.user_id = ?");
			queryParams.push(user.username);
		}

		// Filter berdasarkan user_id jika ada
		if (userId) {
			whereConditions.push("t.user_id = ?");
			queryParams.push(userId);
		}

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

		// Query untuk mengambil data ticket dengan join dan count notes
		const ticketsQuery = `
			SELECT 
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
				COALESCE(notes_count.total_notes, 0) as notes_count
			FROM tickets t
			LEFT JOIN pegawai p ON t.user_id = p.nik
			LEFT JOIN departemen d ON t.departement_id = d.dep_id
			LEFT JOIN categories_ticket c ON t.category_id = c.category_id
			LEFT JOIN priorities_ticket pr ON t.priority_id = pr.priority_id
			LEFT JOIN statuses_ticket s ON t.current_status_id = s.status_id
			LEFT JOIN (
				SELECT ticket_id, COUNT(*) as total_notes
				FROM ticket_notes
				GROUP BY ticket_id
			) notes_count ON t.ticket_id = notes_count.ticket_id
			${whereClause}
			ORDER BY t.submission_date DESC
			LIMIT ? OFFSET ?
		`;

		queryParams.push(limit, offset);

		const tickets = await rawQuery(ticketsQuery, queryParams);

		// Query untuk menghitung total data (tanpa join notes count untuk performance)
		const countQuery = `
			SELECT COUNT(*) as total
			FROM tickets t
			LEFT JOIN statuses_ticket s ON t.current_status_id = s.status_id
			LEFT JOIN priorities_ticket pr ON t.priority_id = pr.priority_id
			LEFT JOIN categories_ticket c ON t.category_id = c.category_id
			${whereClause}
		`;

		const countParams = queryParams.slice(0, -2); // Remove limit and offset
		const [{ total }] = await rawQuery(countQuery, countParams);

		// Format tanggal
		const formattedTickets = tickets.map((ticket) => ({
			...ticket,
			submission_date: moment(ticket.submission_date).format(
				"DD MMMM YYYY HH:mm"
			),
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
		console.error("Error fetching tickets:", error);
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

		const body = await request.json();
		const { category_id, priority_id, title, description } = body;

		// Validasi input
		if (!category_id || !priority_id || !title || !description) {
			return NextResponse.json(
				{
					status: "error",
					error: "Semua field harus diisi",
				},
				{ status: 400 }
			);
		}

		// Status default untuk ticket baru (Open)
		const defaultStatus = await selectFirst({
			table: "statuses_ticket",
			where: { status_name: "Open" },
		});

		if (!defaultStatus) {
			return NextResponse.json(
				{
					status: "error",
					error: "Status default tidak ditemukan",
				},
				{ status: 500 }
			);
		}

		if (!user.username) {
			return NextResponse.json(
				{
					status: "error",
					error: "User ID tidak ditemukan",
				},
				{ status: 500 }
			);
		}

		if (!user.departemen) {
			return NextResponse.json(
				{
					status: "error",
					error: "Departemen ID tidak ditemukan",
				},
				{ status: 500 }
			);
		}

		// Generate nomor ticket otomatis
		const ticketNumber = await generateTicketNumber();

		// Insert ticket baru dengan user_id dan departement_id dari JWT token
		const result = await insert({
			table: "tickets",
			data: {
				no_ticket: ticketNumber,
				user_id: user.username, // Ambil dari JWT token
				departement_id: user.departemen, // Ambil dari JWT token
				category_id: parseInt(category_id),
				priority_id: parseInt(priority_id),
				title: title.trim(),
				description: description.trim(),
				current_status_id: defaultStatus.status_id,
				submission_date: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
		});

		// Record status history untuk ticket baru (NULL -> Open)
		await recordStatusHistory(
			result.insertId,
			null, // old_status null untuk ticket baru
			defaultStatus.status_id,
			user.username
		);

		return NextResponse.json({
			status: "success",
			message: "Ticket berhasil dibuat",
			data: {
				ticket_id: result.insertId,
				no_ticket: ticketNumber,
			},
		});
	} catch (error) {
		console.error("Error creating ticket:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal membuat ticket : " + error.message,
			},
			{ status: 500 }
		);
	}
}

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

		const body = await request.json();
		const {
			ticket_id,
			category_id,
			priority_id,
			title,
			description,
			status_id,
		} = body;

		if (!ticket_id) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket ID harus diisi",
				},
				{ status: 400 }
			);
		}

		// Cek apakah ticket ada dan milik user yang sedang login
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

		// Validasi kepemilikan ticket (user hanya bisa edit ticket miliknya sendiri)
		if (existingTicket.user_id !== user.username) {
			return NextResponse.json(
				{
					status: "error",
					error: "Anda tidak memiliki akses untuk mengedit ticket ini",
				},
				{ status: 403 }
			);
		}

		// Prepare data untuk update
		const updateData = {};
		const oldStatusId = existingTicket.current_status_id;

		if (category_id) updateData.category_id = parseInt(category_id);
		if (priority_id) updateData.priority_id = parseInt(priority_id);
		if (title) updateData.title = title.trim();
		if (description) updateData.description = description.trim();

		// Handle status update dengan timestamp
		if (status_id) {
			const newStatusId = parseInt(status_id);
			updateData.current_status_id = newStatusId;

			// Get status name untuk menentukan timestamp
			const status = await selectFirst({
				table: "statuses_ticket",
				where: { status_id: newStatusId },
			});

			if (status) {
				const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");

				if (status.status_name === "Resolved") {
					updateData.resolved_date = currentTime;
				} else if (status.status_name === "Closed") {
					updateData.closed_date = currentTime;
				}
			}

			// Record status history jika ada perubahan status
			if (oldStatusId !== newStatusId) {
				await recordStatusHistory(
					ticket_id,
					oldStatusId,
					newStatusId,
					user.username
				);
			}
		}

		// Update ticket
		await update({
			table: "tickets",
			data: updateData,
			where: { ticket_id },
		});

		return NextResponse.json({
			status: "success",
			message: "Ticket berhasil diperbarui",
		});
	} catch (error) {
		console.error("Error updating ticket:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal memperbarui ticket",
			},
			{ status: 500 }
		);
	}
}

export async function DELETE(request) {
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

		const body = await request.json();
		const { ticket_id } = body;

		if (!ticket_id) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket ID harus diisi",
				},
				{ status: 400 }
			);
		}

		// Cek apakah ticket ada dan milik user yang sedang login
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

		// Validasi kepemilikan ticket (user hanya bisa hapus ticket miliknya sendiri)
		if (existingTicket.user_id !== user.username) {
			return NextResponse.json(
				{
					status: "error",
					error: "Anda tidak memiliki akses untuk menghapus ticket ini",
				},
				{ status: 403 }
			);
		}

		// Delete related status history first (foreign key constraint)
		await rawQuery("DELETE FROM status_history_ticket WHERE ticket_id = ?", [
			ticket_id,
		]);

		// Delete ticket
		await rawQuery("DELETE FROM tickets WHERE ticket_id = ?", [ticket_id]);

		return NextResponse.json({
			status: "success",
			message: "Ticket berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting ticket:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal menghapus ticket",
			},
			{ status: 500 }
		);
	}
}

// PATCH - Close ticket (set status to Closed by original user only)
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

		const body = await request.json();
		const { ticket_id, feedback } = body;

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

		// Validasi bahwa user yang close adalah user yang mengajukan ticket
		if (existingTicket.user_id !== user.username) {
			return NextResponse.json(
				{
					status: "error",
					error: "Anda hanya dapat menutup ticket yang Anda ajukan sendiri",
				},
				{ status: 403 }
			);
		}

		// Validasi bahwa ticket status saat ini adalah "Resolved"
		const currentStatus = await rawQuery(
			"SELECT s.status_name FROM statuses_ticket s WHERE s.status_id = ?",
			[existingTicket.current_status_id]
		);

		if (
			currentStatus.length === 0 ||
			currentStatus[0].status_name !== "Resolved"
		) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket hanya dapat ditutup jika statusnya sudah 'Resolved'",
				},
				{ status: 400 }
			);
		}

		// Get status "Closed"
		const closedStatus = await selectFirst({
			table: "statuses_ticket",
			where: { status_name: "Closed" },
		});

		if (!closedStatus) {
			return NextResponse.json(
				{
					status: "error",
					error: "Status 'Closed' tidak ditemukan dalam sistem",
				},
				{ status: 500 }
			);
		}

		// Simpan old status untuk history
		const oldStatusId = existingTicket.current_status_id;

		// Update ticket status to Closed
		const updateData = {
			current_status_id: closedStatus.status_id,
			closed_date: moment().format("YYYY-MM-DD HH:mm:ss"),
		};

		await update({
			table: "tickets",
			data: updateData,
			where: { ticket_id },
		});

		// Insert feedback jika ada
		if (feedback && feedback.trim()) {
			await insert({
				table: "ticket_notes",
				data: {
					ticket_id: parseInt(ticket_id),
					note: feedback.trim(),
					created_by: user.username,
					created_date: moment().format("YYYY-MM-DD HH:mm:ss"),
					note_type: "feedback",
				},
			});
		}

		// Record status history (Resolved -> Closed)
		await recordStatusHistory(
			ticket_id,
			oldStatusId,
			closedStatus.status_id,
			user.username
		);

		return NextResponse.json({
			status: "success",
			message: "Ticket berhasil ditutup",
		});
	} catch (error) {
		console.error("Error closing ticket:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal menutup ticket: " + error.message,
			},
			{ status: 500 }
		);
	}
}
