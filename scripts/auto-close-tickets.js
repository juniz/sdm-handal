#!/usr/bin/env node

const https = require("https");
const http = require("http");
const { URL } = require("url");

// Konfigurasi
const config = {
	// Base URL aplikasi (ubah sesuai dengan domain Anda)
	baseUrl: process.env.BASE_URL || "http://localhost:3000",

	// Secret key untuk autentikasi cron job
	cronSecret: process.env.CRON_SECRET || "your-cron-secret-key",

	// Timeout untuk request (dalam milliseconds) - diperpanjang untuk mengatasi socket hang up
	timeout: 120000, // 2 menit

	// Retry configuration
	maxRetries: 3,
	retryDelay: 5000, // 5 detik

	// Mode dry run untuk testing
	dryRun: process.env.DRY_RUN === "true" || false,

	// Logging level
	logLevel: process.env.LOG_LEVEL || "info",
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
};

// Fungsi untuk membuat HTTP request dengan retry mechanism
const makeRequest = (url, options, retryCount = 0) => {
	return new Promise((resolve, reject) => {
		const parsedUrl = new URL(url);
		const protocol = parsedUrl.protocol === "https:" ? https : http;

		const requestOptions = {
			hostname: parsedUrl.hostname,
			port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
			path: parsedUrl.pathname + parsedUrl.search,
			method: options.method || "GET",
			headers: {
				...options.headers,
				Connection: "keep-alive",
				"Keep-Alive": "timeout=120",
			},
			timeout: config.timeout,
		};

		log.debug(`Making request to: ${url} (attempt ${retryCount + 1})`);

		const req = protocol.request(requestOptions, (res) => {
			let data = "";

			res.on("data", (chunk) => {
				data += chunk;
			});

			res.on("end", () => {
				try {
					const jsonData = JSON.parse(data);
					resolve({
						statusCode: res.statusCode,
						headers: res.headers,
						data: jsonData,
					});
				} catch (error) {
					reject(new Error(`Invalid JSON response: ${error.message}`));
				}
			});
		});

		req.on("error", async (error) => {
			log.error(`Request error (attempt ${retryCount + 1}): ${error.message}`);

			// Retry untuk error socket hang up dan connection error
			if (
				retryCount < config.maxRetries &&
				(error.code === "ECONNRESET" ||
					error.code === "ECONNREFUSED" ||
					error.message.includes("socket hang up") ||
					error.message.includes("timeout"))
			) {
				log.info(
					`Retrying request in ${config.retryDelay}ms... (${retryCount + 1}/${
						config.maxRetries
					})`
				);

				setTimeout(() => {
					makeRequest(url, options, retryCount + 1)
						.then(resolve)
						.catch(reject);
				}, config.retryDelay);

				return;
			}

			reject(new Error(`Request error: ${error.message}`));
		});

		req.on("timeout", async () => {
			log.error(`Request timeout (attempt ${retryCount + 1})`);
			req.destroy();

			// Retry untuk timeout
			if (retryCount < config.maxRetries) {
				log.info(
					`Retrying request in ${config.retryDelay}ms... (${retryCount + 1}/${
						config.maxRetries
					})`
				);

				setTimeout(() => {
					makeRequest(url, options, retryCount + 1)
						.then(resolve)
						.catch(reject);
				}, config.retryDelay);

				return;
			}

			reject(new Error("Request timeout"));
		});

		// Set socket timeout untuk mencegah hanging
		req.setTimeout(config.timeout, () => {
			req.destroy();
		});

		if (options.body) {
			req.write(options.body);
		}

		req.end();
	});
};

// Fungsi untuk preview tiket yang akan ditutup dengan better error handling
const previewAutoClose = async () => {
	log.info("Mengambil preview tiket yang akan ditutup...");

	try {
		const startTime = Date.now();

		const response = await makeRequest(
			`${config.baseUrl}/api/ticket/auto-close`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${config.cronSecret}`,
					"Content-Type": "application/json",
					"User-Agent": "auto-close-tickets/1.0",
				},
			}
		);

		const duration = Date.now() - startTime;
		log.debug(`Preview request completed in ${duration}ms`);

		if (response.statusCode !== 200) {
			throw new Error(
				`HTTP ${response.statusCode}: ${response.data.error || "Unknown error"}`
			);
		}

		const { data } = response.data;

		log.info(
			`Ditemukan ${data.total_tickets} tiket yang akan ditutup otomatis`
		);
		log.info(`Cutoff date: ${data.cutoff_date}`);

		if (data.tickets_to_close.length > 0) {
			log.info("Daftar tiket yang akan ditutup:");
			data.tickets_to_close.forEach((ticket) => {
				log.info(
					`  - ${ticket.no_ticket}: ${ticket.title} (${ticket.days_resolved} hari)`
				);
			});
		}

		return data;
	} catch (error) {
		log.error(`Error dalam preview auto-close: ${error.message}`);

		// Log additional debug info
		if (error.code) {
			log.error(`Error code: ${error.code}`);
		}

		throw error;
	}
};

// Fungsi untuk menjalankan auto-close tiket dengan better error handling
const runAutoClose = async () => {
	log.info("Menjalankan auto-close tiket...");

	try {
		const startTime = Date.now();

		const response = await makeRequest(
			`${config.baseUrl}/api/ticket/auto-close`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${config.cronSecret}`,
					"Content-Type": "application/json",
					"User-Agent": "auto-close-tickets/1.0",
				},
				body: JSON.stringify({
					dry_run: config.dryRun,
				}),
			}
		);

		const duration = Date.now() - startTime;
		log.debug(`Auto-close request completed in ${duration}ms`);

		if (response.statusCode !== 200) {
			throw new Error(
				`HTTP ${response.statusCode}: ${response.data.error || "Unknown error"}`
			);
		}

		const { data } = response.data;

		log.info(
			`${config.dryRun ? "[DRY RUN] " : ""}Berhasil memproses ${
				data.total_processed
			} tiket`
		);

		if (data.tickets_closed.length > 0) {
			log.info("Tiket yang berhasil ditutup:");
			data.tickets_closed.forEach((ticket) => {
				log.info(
					`  - ${ticket.no_ticket}: ${ticket.title} (${ticket.days_resolved} hari)`
				);
			});
		}

		return data;
	} catch (error) {
		log.error(`Error dalam auto-close: ${error.message}`);

		// Log additional debug info
		if (error.code) {
			log.error(`Error code: ${error.code}`);
		}

		throw error;
	}
};

// Fungsi untuk mengirim notifikasi (email, slack, dll)
const sendNotification = async (result) => {
	// Implementasi notifikasi bisa ditambahkan di sini
	// Contoh: kirim email ke admin jika ada tiket yang ditutup

	if (result.total_processed > 0) {
		log.info(
			`Notifikasi: ${result.total_processed} tiket telah ditutup otomatis`
		);
		// TODO: Implementasi pengiriman email/notifikasi
	}
};

// Fungsi untuk validasi konfigurasi
const validateConfig = () => {
	if (!config.baseUrl) {
		throw new Error("BASE_URL tidak ditemukan");
	}

	if (!config.cronSecret) {
		throw new Error("CRON_SECRET tidak ditemukan");
	}

	try {
		new URL(config.baseUrl);
	} catch (error) {
		throw new Error("BASE_URL tidak valid");
	}

	log.info("Konfigurasi valid");
};

// Fungsi untuk health check
const healthCheck = async () => {
	log.info("Melakukan health check...");

	try {
		const response = await makeRequest(
			`${config.baseUrl}/api/ticket/auto-close`,
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${config.cronSecret}`,
					"Content-Type": "application/json",
				},
			}
		);

		if (response.statusCode === 200) {
			log.info("Health check berhasil");
			return true;
		} else {
			log.error(`Health check gagal: HTTP ${response.statusCode}`);
			return false;
		}
	} catch (error) {
		log.error(`Health check error: ${error.message}`);
		return false;
	}
};

// Main function
const main = async () => {
	const startTime = Date.now();

	log.info("=== Auto-Close Tickets Cron Job Started ===");
	log.info(`Base URL: ${config.baseUrl}`);
	log.info(`Dry Run: ${config.dryRun}`);
	log.info(`Log Level: ${config.logLevel}`);

	try {
		// Validasi konfigurasi
		validateConfig();

		// Health check
		const isHealthy = await healthCheck();
		if (!isHealthy) {
			throw new Error("Health check gagal");
		}

		// Preview tiket yang akan ditutup
		const previewData = await previewAutoClose();

		// Jalankan auto-close jika ada tiket yang perlu ditutup
		if (previewData.total_tickets > 0) {
			const result = await runAutoClose();

			// Kirim notifikasi jika perlu
			await sendNotification(result);

			log.info(`Cron job selesai: ${result.total_processed} tiket diproses`);
		} else {
			log.info("Tidak ada tiket yang perlu ditutup");
		}

		const duration = Date.now() - startTime;
		log.info(`=== Auto-Close Tickets Cron Job Completed (${duration}ms) ===`);

		// Exit dengan status sukses
		process.exit(0);
	} catch (error) {
		log.error(`Cron job gagal: ${error.message}`);

		const duration = Date.now() - startTime;
		log.error(`=== Auto-Close Tickets Cron Job Failed (${duration}ms) ===`);

		// Exit dengan status error
		process.exit(1);
	}
};

// Handle command line arguments
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
	case "preview":
		// Mode preview - hanya tampilkan tiket yang akan ditutup
		config.dryRun = true;
		previewAutoClose()
			.then((data) => {
				console.log(JSON.stringify(data, null, 2));
				process.exit(0);
			})
			.catch((error) => {
				console.error("Error:", error.message);
				process.exit(1);
			});
		break;

	case "test":
		// Mode test - jalankan dengan dry run
		config.dryRun = true;
		main();
		break;

	case "health":
		// Mode health check
		healthCheck()
			.then((isHealthy) => {
				console.log(isHealthy ? "Healthy" : "Unhealthy");
				process.exit(isHealthy ? 0 : 1);
			})
			.catch((error) => {
				console.error("Error:", error.message);
				process.exit(1);
			});
		break;

	default:
		// Mode normal - jalankan auto-close
		main();
		break;
}
