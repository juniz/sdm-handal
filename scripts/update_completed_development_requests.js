/**
 * Script untuk update status menjadi "Completed" untuk development requests
 * yang progress-nya sudah mencapai 100% tapi statusnya belum diupdate
 *
 * Usage: node scripts/update_completed_development_requests.js
 */

const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

// Load environment variables from .env.local or .env if available
function loadEnvFile() {
	const envFiles = [".env.local", ".env"];
	for (const envFile of envFiles) {
		const envPath = path.join(process.cwd(), envFile);
		if (fs.existsSync(envPath)) {
			const envContent = fs.readFileSync(envPath, "utf8");
			envContent.split("\n").forEach((line) => {
				const trimmedLine = line.trim();
				if (trimmedLine && !trimmedLine.startsWith("#")) {
					const [key, ...valueParts] = trimmedLine.split("=");
					if (key && valueParts.length > 0) {
						const value = valueParts.join("=").trim();
						// Remove quotes if present
						const cleanValue = value.replace(/^["']|["']$/g, "");
						if (!process.env[key.trim()]) {
							process.env[key.trim()] = cleanValue;
						}
					}
				}
			});
			console.log(`✅ Loaded environment variables from ${envFile}`);
			return;
		}
	}
	console.log(
		"ℹ️  No .env file found, using environment variables or defaults"
	);
}

// Load environment variables
loadEnvFile();

// Database configuration
const dbConfig = {
	host: process.env.DB_HOST || "localhost",
	port: process.env.DB_PORT || 3306,
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "sdm",
	charset: "utf8mb4",
	connectTimeout: 10000,
};

async function updateCompletedRequests() {
	let connection;

	try {
		console.log("🔌 Menghubungkan ke database...");
		connection = await mysql.createConnection(dbConfig);
		console.log("✅ Terhubung ke database\n");

		// Cari semua request yang progress-nya sudah 100% tapi statusnya belum Completed atau Closed
		const [results] = await connection.execute(
			`SELECT 
				dr.request_id,
				dr.no_request,
				dr.title,
				dr.current_status_id,
				ds.status_name as current_status,
				dp.progress_percentage,
				dp.update_date as last_progress_update,
				dp.updated_by
			FROM development_requests dr
			INNER JOIN development_statuses ds ON dr.current_status_id = ds.status_id
			INNER JOIN (
				SELECT 
					request_id, 
					progress_percentage,
					update_date,
					updated_by
				FROM development_progress dp1
				WHERE update_date = (
					SELECT MAX(update_date) 
					FROM development_progress dp2 
					WHERE dp2.request_id = dp1.request_id
				)
			) dp ON dr.request_id = dp.request_id
			WHERE dp.progress_percentage = 100
			AND ds.status_name NOT IN ('Completed', 'Closed')
			ORDER BY dp.update_date DESC`
		);

		if (results.length === 0) {
			console.log(
				"✅ Tidak ada data yang perlu diupdate. Semua request dengan progress 100% sudah memiliki status Completed atau Closed.\n"
			);
			return;
		}

		console.log(
			`📊 Ditemukan ${results.length} request yang perlu diupdate:\n`
		);
		results.forEach((req, index) => {
			console.log(
				`${index + 1}. Request ID: ${req.request_id} | No: ${
					req.no_request
				} | Status saat ini: ${req.current_status} | Progress: ${
					req.progress_percentage
				}%`
			);
		});
		console.log("");

		// Get Completed status ID
		const [completedStatusResult] = await connection.execute(
			"SELECT status_id FROM development_statuses WHERE status_name = 'Completed'"
		);

		if (completedStatusResult.length === 0) {
			throw new Error("Status 'Completed' tidak ditemukan di database");
		}

		const completedStatusId = completedStatusResult[0].status_id;

		// Update setiap request
		let successCount = 0;
		let errorCount = 0;

		for (const request of results) {
			try {
				// Start transaction untuk setiap request
				await connection.beginTransaction();

				// Update request status to Completed
				await connection.execute(
					`UPDATE development_requests 
					SET current_status_id = ?, 
						completed_date = COALESCE(completed_date, NOW()),
						updated_date = NOW()
					WHERE request_id = ?`,
					[completedStatusId, request.request_id]
				);

				// Add status history
				await connection.execute(
					`INSERT INTO development_status_history 
					(request_id, old_status, new_status, changed_by, change_date, change_reason) 
					VALUES (?, ?, ?, ?, NOW(), ?)`,
					[
						request.request_id,
						request.current_status_id,
						completedStatusId,
						request.updated_by || "SYSTEM",
						"Script update: Progress sudah 100% - Status otomatis diupdate menjadi Completed",
					]
				);

				// Add note about auto-completion
				await connection.execute(
					`INSERT INTO development_notes 
					(request_id, note, note_type, created_by, created_date) 
					VALUES (?, ?, ?, ?, NOW())`,
					[
						request.request_id,
						`Progress sudah mencapai 100%. Status otomatis diupdate menjadi Completed melalui script maintenance pada ${new Date().toLocaleString(
							"id-ID"
						)}.`,
						"update",
						request.updated_by || "SYSTEM",
					]
				);

				// Commit transaction
				await connection.commit();

				console.log(
					`✅ Request ID ${request.request_id} (${request.no_request}) berhasil diupdate: ${request.current_status} → Completed`
				);
				successCount++;
			} catch (error) {
				// Rollback transaction jika terjadi error
				await connection.rollback();
				console.error(
					`❌ Error updating request ID ${request.request_id} (${request.no_request}):`,
					error.message
				);
				errorCount++;
			}
		}

		console.log("\n" + "=".repeat(60));
		console.log(`📈 Ringkasan Update:`);
		console.log(`   ✅ Berhasil: ${successCount}`);
		console.log(`   ❌ Gagal: ${errorCount}`);
		console.log(`   📊 Total: ${results.length}`);
		console.log("=".repeat(60) + "\n");
	} catch (error) {
		console.error("❌ Error:", error.message);
		console.error(error);
		process.exit(1);
	} finally {
		if (connection) {
			await connection.end();
			console.log("🔌 Koneksi database ditutup");
		}
	}
}

// Run script
if (require.main === module) {
	updateCompletedRequests()
		.then(() => {
			console.log("✨ Script selesai dijalankan");
			process.exit(0);
		})
		.catch((error) => {
			console.error("💥 Script gagal:", error);
			process.exit(1);
		});
}

module.exports = { updateCompletedRequests };
