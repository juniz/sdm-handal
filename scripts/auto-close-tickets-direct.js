#!/usr/bin/env node

const path = require("path");
const moment = require("moment-timezone");

// Set timezone
moment.tz.setDefault("Asia/Jakarta");

// Import database adapter (CommonJS)
const {
	rawQuery,
	selectFirst,
	update,
	insert,
	testConnection,
} = require("./db-adapter");

// Konfigurasi
const config = {
	// Mode dry run untuk testing
	dryRun: process.env.DRY_RUN === "true" || false,

	// Logging level
	logLevel: process.env.LOG_LEVEL || "info",

	// Timezone
	timezone: process.env.TZ || "Asia/Jakarta",

	// Days to wait before auto-close
	daysToWait: parseInt(process.env.AUTO_CLOSE_DAYS) || 3,

	// Batch size for processing
	batchSize: parseInt(process.env.BATCH_SIZE) || 50,
};

// Utility functions
const log = {
	info: (message) => {
		if (config.logLevel === "info" || config.logLevel === "debug") {
			console.log(`[INFO] ${new Date().toISOString()}: ${message}`);
		}
	},
	error: (message) => {
		console.error(`[ERROR] ${new Date().toISOString()}: ${message}`);
	},
	debug: (message) => {
		if (config.logLevel === "debug") {
			console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`);
		}
	},
	success: (message) => {
		console.log(`[SUCCESS] ${new Date().toISOString()}: ${message}`);
	},
	warning: (message) => {
		if (config.logLevel === "info" || config.logLevel === "debug") {
			console.warn(`[WARNING] ${new Date().toISOString()}: ${message}`);
		}
	},
};

// Helper function untuk mendapatkan sistem user yang valid
const getValidSystemUser = async (ticketUserId = null) => {
	try {
		// Jika ada ticket user ID, gunakan itu (pemilik ticket)
		if (ticketUserId) {
			log.debug(`Using ticket owner as system user: ${ticketUserId}`);
			return ticketUserId;
		}

		// Fallback: coba cari admin user atau sistem user yang ada
		const adminUser = await selectFirst({
			table: "pegawai",
			where: { jabatan: "IT" },
			fields: ["nik"],
		});

		if (adminUser && adminUser.nik) {
			log.debug(`Using IT admin user: ${adminUser.nik}`);
			return adminUser.nik;
		}

		// Coba cari user dengan role admin atau sistem
		const fallbackUser = await rawQuery(
			"SELECT nik FROM pegawai WHERE (nama LIKE '%admin%' OR nama LIKE '%sistem%' OR nama LIKE '%it%') LIMIT 1"
		);

		if (fallbackUser && fallbackUser.length > 0) {
			log.debug(`Using fallback system user: ${fallbackUser[0].nik}`);
			return fallbackUser[0].nik;
		}

		// Coba ambil user pertama sebagai fallback terakhir
		const anyUser = await rawQuery("SELECT nik FROM pegawai LIMIT 1");
		if (anyUser && anyUser.length > 0) {
			log.warning(
				`Using first available user as system user: ${anyUser[0].nik}`
			);
			return anyUser[0].nik;
		}

		// Jika tidak ada user sama sekali, return null
		log.error("No valid users found in pegawai table");
		return null;
	} catch (error) {
		log.error(`Error finding system user: ${error.message}`);
		return null;
	}
};

// Fungsi untuk mencatat status history
const recordStatusHistory = async (
	ticketId,
	oldStatusId,
	newStatusId,
	ticketUserId
) => {
	try {
		// Jangan record jika status sama
		if (oldStatusId === newStatusId) {
			return;
		}

		// Gunakan user ID dari ticket sebagai changed_by (pemilik ticket)
		// Ini mengatasi masalah foreign key constraint karena user_id sudah valid
		const systemUser = await getValidSystemUser(ticketUserId);

		if (!systemUser) {
			log.warning(
				`No valid system user found for status history, skipping for ticket ${ticketId}`
			);
			return;
		}

		await insert({
			table: "status_history_ticket",
			data: {
				ticket_id: ticketId,
				old_status: oldStatusId,
				new_status: newStatusId,
				changed_by: systemUser,
				change_date: moment().format("YYYY-MM-DD HH:mm:ss"),
			},
		});

		log.debug(
			`Status history recorded: Ticket ${ticketId}, ${oldStatusId} -> ${newStatusId} by ${systemUser}`
		);
	} catch (error) {
		log.error(
			`Error recording status history for ticket ${ticketId}: ${error.message}`
		);
		// Tidak throw error karena ini bukan proses critical
		// Auto-close tetap berjalan meskipun status history gagal
		log.warning(`Continuing auto-close process despite status history error`);
	}
};

// Fungsi untuk mendapatkan status ID
const getStatusIds = async () => {
	try {
		log.debug("Fetching status IDs...");

		const resolvedStatus = await selectFirst({
			table: "statuses_ticket",
			where: { status_name: "Resolved" },
		});

		const closedStatus = await selectFirst({
			table: "statuses_ticket",
			where: { status_name: "Closed" },
		});

		if (!resolvedStatus) {
			throw new Error("Status 'Resolved' tidak ditemukan dalam database");
		}

		if (!closedStatus) {
			throw new Error("Status 'Closed' tidak ditemukan dalam database");
		}

		log.debug(`Resolved Status ID: ${resolvedStatus.status_id}`);
		log.debug(`Closed Status ID: ${closedStatus.status_id}`);

		return { resolvedStatus, closedStatus };
	} catch (error) {
		log.error(`Error getting status IDs: ${error.message}`);
		throw error;
	}
};

// Fungsi untuk mengambil tiket yang perlu ditutup
const getTicketsToClose = async (resolvedStatusId, cutoffDate) => {
	try {
		log.debug(
			`Fetching tickets to close with status ${resolvedStatusId} before ${cutoffDate}`
		);

		// Query yang dioptimasi untuk mendapatkan tiket yang perlu ditutup
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
			LIMIT ?
			`,
			[resolvedStatusId, cutoffDate, config.batchSize]
		);

		log.info(`Found ${tickets.length} tickets to close`);
		return tickets;
	} catch (error) {
		log.error(`Error fetching tickets to close: ${error.message}`);
		throw error;
	}
};

// Fungsi untuk menutup tiket individual
const closeIndividualTicket = async (ticket, closedStatusId, currentTime) => {
	try {
		log.debug(
			`Processing ticket ${ticket.no_ticket} (ID: ${ticket.ticket_id})`
		);

		if (!config.dryRun) {
			// Update status tiket menjadi "Closed"
			await update({
				table: "tickets",
				data: {
					current_status_id: closedStatusId,
					closed_date: currentTime,
				},
				where: { ticket_id: ticket.ticket_id },
			});

			// Record status history menggunakan user_id dari ticket
			await recordStatusHistory(
				ticket.ticket_id,
				ticket.current_status_id,
				closedStatusId,
				ticket.user_id
			);

			// Dapatkan sistem user yang valid untuk note (gunakan user_id dari ticket)
			const noteCreator = await getValidSystemUser(ticket.user_id);

			// Tambahkan note otomatis
			if (noteCreator) {
				await insert({
					table: "ticket_notes",
					data: {
						ticket_id: ticket.ticket_id,
						note: `Tiket ditutup otomatis karena telah resolved selama lebih dari ${config.daysToWait} hari tanpa feedback dari user.`,
						created_by: noteCreator,
						created_date: currentTime,
						note_type: "status_update",
					},
				});
				log.debug(
					`Note created for ticket ${ticket.no_ticket} by user ${noteCreator}`
				);
			} else {
				log.warning(
					`No valid user found for creating ticket note, skipping note for ticket ${ticket.ticket_id}`
				);
			}

			log.debug(`Successfully closed ticket ${ticket.no_ticket}`);
		} else {
			log.debug(`[DRY RUN] Would close ticket ${ticket.no_ticket}`);
		}

		// Return formatted ticket info
		return {
			ticket_id: ticket.ticket_id,
			no_ticket: ticket.no_ticket,
			title: ticket.title,
			user_id: ticket.user_id,
			user_name: ticket.user_name,
			department_name: ticket.department_name,
			resolved_date: moment(ticket.resolved_date).format("DD MMMM YYYY HH:mm"),
			days_resolved: parseInt(ticket.days_resolved),
			status: config.dryRun ? "DRY_RUN" : "CLOSED",
		};
	} catch (error) {
		log.error(`Error closing ticket ${ticket.no_ticket}: ${error.message}`);
		throw error;
	}
};

// Fungsi untuk menjalankan auto-close
const runAutoClose = async () => {
	const startTime = Date.now();

	log.info("=== Auto-Close Tickets Started (Direct Database) ===");
	log.info(`Mode: ${config.dryRun ? "DRY RUN" : "PRODUCTION"}`);
	log.info(`Days to wait: ${config.daysToWait}`);
	log.info(`Batch size: ${config.batchSize}`);
	log.info(`Timezone: ${config.timezone}`);

	try {
		// Hitung tanggal cutoff
		const cutoffDate = moment()
			.subtract(config.daysToWait, "days")
			.format("YYYY-MM-DD HH:mm:ss");

		log.info(`Cutoff date: ${cutoffDate}`);

		// Dapatkan status IDs
		const { resolvedStatus, closedStatus } = await getStatusIds();

		// Dapatkan tiket yang perlu ditutup
		const ticketsToClose = await getTicketsToClose(
			resolvedStatus.status_id,
			cutoffDate
		);

		if (ticketsToClose.length === 0) {
			log.info("No tickets found that need to be auto-closed");
			return {
				status: "success",
				message: "Tidak ada tiket yang perlu ditutup otomatis",
				data: {
					total_processed: 0,
					tickets_closed: [],
					cutoff_date: cutoffDate,
					processed_at: moment().format("YYYY-MM-DD HH:mm:ss"),
					dry_run: config.dryRun,
				},
			};
		}

		log.info(`Processing ${ticketsToClose.length} tickets...`);

		const closedTickets = [];
		const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");

		// Proses setiap tiket
		for (let i = 0; i < ticketsToClose.length; i++) {
			const ticket = ticketsToClose[i];

			try {
				log.info(
					`Processing ticket ${i + 1}/${ticketsToClose.length}: ${
						ticket.no_ticket
					}`
				);

				const closedTicket = await closeIndividualTicket(
					ticket,
					closedStatus.status_id,
					currentTime
				);

				closedTickets.push(closedTicket);

				// Log progress setiap 10 tiket
				if ((i + 1) % 10 === 0) {
					log.info(
						`Progress: ${i + 1}/${ticketsToClose.length} tickets processed`
					);
				}
			} catch (error) {
				log.error(
					`Failed to process ticket ${ticket.no_ticket}: ${error.message}`
				);
				// Lanjutkan ke tiket berikutnya
			}
		}

		const duration = Date.now() - startTime;
		const successMessage = `${
			config.dryRun ? "[DRY RUN] " : ""
		}Successfully processed ${closedTickets.length} tickets in ${duration}ms`;

		log.success(successMessage);

		// Log detail tiket yang ditutup
		if (closedTickets.length > 0) {
			log.info("Tickets processed:");
			closedTickets.forEach((ticket) => {
				log.info(
					`  - ${ticket.no_ticket}: ${ticket.title} (${ticket.days_resolved} days)`
				);
			});
		}

		log.info("=== Auto-Close Tickets Completed ===");

		return {
			status: "success",
			message: successMessage,
			data: {
				total_processed: closedTickets.length,
				tickets_closed: closedTickets,
				cutoff_date: cutoffDate,
				processed_at: currentTime,
				dry_run: config.dryRun,
				duration_ms: duration,
			},
		};
	} catch (error) {
		const duration = Date.now() - startTime;
		log.error(`Auto-close failed after ${duration}ms: ${error.message}`);

		return {
			status: "error",
			error: error.message,
			duration_ms: duration,
		};
	}
};

// Fungsi untuk preview tiket yang akan ditutup
const previewTicketsToClose = async () => {
	log.info("=== Preview Tickets to Auto-Close (Direct Database) ===");

	try {
		// Hitung tanggal cutoff
		const cutoffDate = moment()
			.subtract(config.daysToWait, "days")
			.format("YYYY-MM-DD HH:mm:ss");

		log.info(`Preview cutoff date: ${cutoffDate}`);

		// Dapatkan status IDs
		const { resolvedStatus } = await getStatusIds();

		// Dapatkan tiket yang akan ditutup
		const ticketsToClose = await getTicketsToClose(
			resolvedStatus.status_id,
			cutoffDate
		);

		// Format untuk output
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

		log.info(
			`Found ${formattedTickets.length} tickets that will be auto-closed`
		);

		if (formattedTickets.length > 0) {
			log.info("Tickets to be closed:");
			formattedTickets.forEach((ticket) => {
				log.info(
					`  - ${ticket.no_ticket}: ${ticket.title} (${ticket.days_resolved} days)`
				);
			});
		}

		log.info("=== Preview Completed ===");

		return {
			status: "success",
			message: `Found ${formattedTickets.length} tickets that will be auto-closed`,
			data: {
				total_tickets: formattedTickets.length,
				tickets_to_close: formattedTickets,
				cutoff_date: moment(cutoffDate).format("DD MMMM YYYY HH:mm"),
				current_time: moment().format("DD MMMM YYYY HH:mm"),
			},
		};
	} catch (error) {
		log.error(`Preview failed: ${error.message}`);
		return {
			status: "error",
			error: error.message,
		};
	}
};

// Fungsi untuk health check database
const healthCheck = async () => {
	log.info("=== Database Health Check (Direct Database) ===");

	try {
		// Test database connection
		const connectionOk = await testConnection();

		if (!connectionOk) {
			throw new Error("Database connection failed");
		}

		// Test with a simple query
		const testQuery = await rawQuery("SELECT 1 as test");

		if (!testQuery || testQuery.length === 0) {
			throw new Error("Database query returned no results");
		}

		// Test essential tables
		const tables = [
			"tickets",
			"statuses_ticket",
			"ticket_notes",
			"status_history_ticket",
		];

		for (const table of tables) {
			await rawQuery(`SELECT COUNT(*) as count FROM ${table} LIMIT 1`);
			log.debug(`Table ${table}: OK`);
		}

		// Test status configuration
		await getStatusIds();

		log.success("Database health check passed");

		return {
			status: "healthy",
			message: "Database connection and tables are working correctly",
			timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
		};
	} catch (error) {
		log.error(`Health check failed: ${error.message}`);

		return {
			status: "unhealthy",
			error: error.message,
			timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
		};
	}
};

// Main function
const main = async () => {
	// Parse command line arguments
	const args = process.argv.slice(2);
	const command = args[0] || "run";

	// Global error handlers
	process.on("uncaughtException", (error) => {
		log.error(`Uncaught Exception: ${error.message}`);
		process.exit(1);
	});

	process.on("unhandledRejection", (reason, promise) => {
		log.error(`Unhandled Rejection: ${reason}`);
		process.exit(1);
	});

	try {
		let result;

		switch (command) {
			case "preview":
				result = await previewTicketsToClose();
				if (result.status === "success") {
					console.log(JSON.stringify(result.data, null, 2));
				}
				break;

			case "health":
				result = await healthCheck();
				console.log(result.status === "healthy" ? "Healthy" : "Unhealthy");
				break;

			case "test":
			case "dry-run":
				// Force dry run mode
				config.dryRun = true;
				result = await runAutoClose();
				break;

			case "run":
			default:
				result = await runAutoClose();
				break;
		}

		// Exit with appropriate code
		if (result && result.status === "error") {
			process.exit(1);
		} else {
			process.exit(0);
		}
	} catch (error) {
		log.error(`Script failed: ${error.message}`);
		process.exit(1);
	}
};

// Only run if this script is executed directly
if (require.main === module) {
	main();
}

module.exports = {
	runAutoClose,
	previewTicketsToClose,
	healthCheck,
	config,
};
