import { NextResponse } from "next/server";
import { rawQuery, selectFirst, update, insert } from "@/lib/db-helper";
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

// Fungsi untuk mengambil data tiket dengan optimasi query
const getTicketsToClose = async (resolvedStatusId, threeDaysAgo) => {
	try {
		console.log(
			`Fetching tickets to close with status ${resolvedStatusId} before ${threeDaysAgo}`
		);

		// Query yang dioptimasi dengan index hint dan limit
		const tickets = await rawQuery(
			`
			SELECT 
				t.ticket_id,
				t.no_ticket,
				t.title,
				t.user_id,
				t.resolved_date,
				t.current_status_id,
				t.departement_id,
				COALESCE(p.nama, t.user_id) as user_name,
				COALESCE(d.nama, 'Unknown') as department_name,
				DATEDIFF(NOW(), t.resolved_date) as days_resolved
			FROM tickets t
			LEFT JOIN pegawai p ON t.user_id = p.nik
			LEFT JOIN departemen d ON t.departement_id = d.dep_id
			WHERE t.current_status_id = ?
			AND t.resolved_date <= ?
			AND t.closed_date IS NULL
			ORDER BY t.resolved_date ASC
			LIMIT 100
			`,
			[resolvedStatusId, threeDaysAgo]
		);

		console.log(`Found ${tickets.length} tickets to close`);
		return tickets;
	} catch (error) {
		console.error("Error fetching tickets to close:", error);
		throw error;
	}
};

export async function POST(request) {
	try {
		console.log("Auto-close POST request started");

		// Validasi cron job authentication
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET || "your-cron-secret-key";

		if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
			console.log("Unauthorized request - invalid cron secret");
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Invalid cron secret",
				},
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { dry_run = false } = body; // Optional dry run untuk testing

		// Hitung tanggal 3 hari yang lalu
		const threeDaysAgo = moment()
			.subtract(3, "days")
			.format("YYYY-MM-DD HH:mm:ss");

		console.log(`Cutoff date: ${threeDaysAgo}`);

		// Ambil status "Resolved" dan "Closed" dengan timeout
		const resolvedStatus = await selectFirst({
			table: "statuses_ticket",
			where: { status_name: "Resolved" },
		});

		const closedStatus = await selectFirst({
			table: "statuses_ticket",
			where: { status_name: "Closed" },
		});

		if (!resolvedStatus || !closedStatus) {
			console.log("Required statuses not found");
			return NextResponse.json(
				{
					status: "error",
					error: "Status 'Resolved' atau 'Closed' tidak ditemukan",
				},
				{ status: 500 }
			);
		}

		console.log(
			`Resolved status ID: ${resolvedStatus.status_id}, Closed status ID: ${closedStatus.status_id}`
		);

		// Cari tiket yang resolved lebih dari 3 hari dan belum closed
		const ticketsToClose = await getTicketsToClose(
			resolvedStatus.status_id,
			threeDaysAgo
		);

		if (ticketsToClose.length === 0) {
			console.log("No tickets to close");
			return NextResponse.json({
				status: "success",
				message: "Tidak ada tiket yang perlu ditutup otomatis",
				data: {
					total_processed: 0,
					tickets_closed: [],
					cutoff_date: threeDaysAgo,
				},
			});
		}

		const closedTickets = [];
		const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");

		console.log(`Processing ${ticketsToClose.length} tickets`);

		// Proses setiap tiket yang perlu ditutup dengan batch processing
		for (let i = 0; i < ticketsToClose.length; i++) {
			const ticket = ticketsToClose[i];

			try {
				console.log(
					`Processing ticket ${i + 1}/${ticketsToClose.length}: ${
						ticket.no_ticket
					}`
				);

				if (!dry_run) {
					// Update status tiket menjadi "Closed"
					await update({
						table: "tickets",
						data: {
							current_status_id: closedStatus.status_id,
							closed_date: currentTime,
						},
						where: { ticket_id: ticket.ticket_id },
					});

					// Record status history
					await recordStatusHistory(
						ticket.ticket_id,
						resolvedStatus.status_id,
						closedStatus.status_id,
						"SYSTEM_AUTO_CLOSE"
					);

					// Tambahkan note otomatis
					await insert({
						table: "ticket_notes",
						data: {
							ticket_id: ticket.ticket_id,
							note:
								"Tiket ditutup otomatis karena telah resolved selama lebih dari 3 hari tanpa feedback dari user.",
							created_by: "SYSTEM_AUTO_CLOSE",
							created_date: currentTime,
							note_type: "system",
						},
					});
				}

				// Hitung berapa hari sudah resolved
				const resolvedDuration = moment().diff(
					moment(ticket.resolved_date),
					"days"
				);

				closedTickets.push({
					ticket_id: ticket.ticket_id,
					no_ticket: ticket.no_ticket,
					title: ticket.title,
					user_id: ticket.user_id,
					user_name: ticket.user_name,
					department_name: ticket.department_name,
					resolved_date: moment(ticket.resolved_date).format(
						"DD MMMM YYYY HH:mm"
					),
					days_resolved: resolvedDuration,
					status: dry_run ? "DRY_RUN" : "CLOSED",
				});

				console.log(
					`${dry_run ? "[DRY RUN] " : ""}Auto-closed ticket: ${
						ticket.no_ticket
					} (${ticket.title})`
				);
			} catch (error) {
				console.error(`Error processing ticket ${ticket.ticket_id}:`, error);
				// Lanjutkan ke tiket berikutnya jika ada error
			}
		}

		console.log(
			`Auto-close POST request completed. Processed ${closedTickets.length} tickets`
		);

		return NextResponse.json({
			status: "success",
			message: `${dry_run ? "[DRY RUN] " : ""}Berhasil memproses ${
				closedTickets.length
			} tiket`,
			data: {
				total_processed: closedTickets.length,
				tickets_closed: closedTickets,
				cutoff_date: threeDaysAgo,
				processed_at: currentTime,
				dry_run: dry_run,
			},
		});
	} catch (error) {
		console.error("Error in auto-close tickets:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal memproses auto-close tiket: " + error.message,
			},
			{ status: 500 }
		);
	}
}

// GET method untuk melihat tiket yang akan ditutup (preview)
export async function GET(request) {
	try {
		console.log("Auto-close GET request started");

		// Validasi cron job authentication
		const authHeader = request.headers.get("authorization");
		const cronSecret = process.env.CRON_SECRET || "your-cron-secret-key";

		if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
			console.log("Unauthorized request - invalid cron secret");
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Invalid cron secret",
				},
				{ status: 401 }
			);
		}

		// Hitung tanggal 3 hari yang lalu
		const threeDaysAgo = moment()
			.subtract(3, "days")
			.format("YYYY-MM-DD HH:mm:ss");

		console.log(`Preview cutoff date: ${threeDaysAgo}`);

		// Ambil status "Resolved"
		const resolvedStatus = await selectFirst({
			table: "statuses_ticket",
			where: { status_name: "Resolved" },
		});

		if (!resolvedStatus) {
			console.log("Resolved status not found");
			return NextResponse.json(
				{
					status: "error",
					error: "Status 'Resolved' tidak ditemukan",
				},
				{ status: 500 }
			);
		}

		console.log(`Using resolved status ID: ${resolvedStatus.status_id}`);

		// Cari tiket yang resolved lebih dari 3 hari dan belum closed
		const ticketsToClose = await getTicketsToClose(
			resolvedStatus.status_id,
			threeDaysAgo
		);

		// Format data untuk response
		const formattedTickets = ticketsToClose.map((ticket) => ({
			ticket_id: ticket.ticket_id,
			no_ticket: ticket.no_ticket,
			title: ticket.title,
			user_id: ticket.user_id,
			user_name: ticket.user_name,
			department_name: ticket.department_name,
			resolved_date: moment(ticket.resolved_date).format("DD MMMM YYYY HH:mm"),
			days_resolved: parseInt(ticket.days_resolved),
		}));

		console.log(
			`Auto-close GET request completed. Found ${formattedTickets.length} tickets`
		);

		return NextResponse.json({
			status: "success",
			message: `Ditemukan ${ticketsToClose.length} tiket yang akan ditutup otomatis`,
			data: {
				total_tickets: ticketsToClose.length,
				tickets_to_close: formattedTickets,
				cutoff_date: moment(threeDaysAgo).format("DD MMMM YYYY HH:mm"),
				current_time: moment().format("DD MMMM YYYY HH:mm"),
			},
		});
	} catch (error) {
		console.error("Error in preview auto-close tickets:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil preview auto-close tiket: " + error.message,
			},
			{ status: 500 }
		);
	}
}
