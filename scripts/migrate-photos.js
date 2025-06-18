const fs = require("fs").promises;
const path = require("path");
const mysql = require("mysql2/promise");

// Database configuration
const dbConfig = {
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "your_database",
	port: process.env.DB_PORT || 3306,
};

async function migratePhotos() {
	let connection;

	try {
		console.log("🚀 Starting photo migration...");

		// Connect to database
		connection = await mysql.createConnection(dbConfig);
		console.log("✅ Connected to database");

		// Ensure uploads directory exists
		const uploadsDir = path.join(process.cwd(), "uploads", "attendance");
		try {
			await fs.access(uploadsDir);
		} catch {
			await fs.mkdir(uploadsDir, { recursive: true });
			console.log("📁 Created uploads/attendance directory");
		}

		// Get all photos from database
		const [tempPresensiRows] = await connection.execute(
			'SELECT id, jam_datang, photo FROM temporary_presensi WHERE photo IS NOT NULL AND photo != ""'
		);

		const [rekapPresensiRows] = await connection.execute(
			'SELECT id, jam_datang, photo FROM rekap_presensi WHERE photo IS NOT NULL AND photo != ""'
		);

		const allRows = [...tempPresensiRows, ...rekapPresensiRows];
		console.log(`📊 Found ${allRows.length} photos to migrate`);

		let migratedCount = 0;
		let errorCount = 0;

		for (const row of allRows) {
			try {
				const oldPhotoUrl = row.photo;

				// Skip if already migrated (starts with /api/uploads/)
				if (oldPhotoUrl.startsWith("/api/uploads/")) {
					console.log(`⏭️  Skipping already migrated: ${oldPhotoUrl}`);
					continue;
				}

				// Extract filename from old URL
				let filename;
				if (oldPhotoUrl.includes("/photos/")) {
					filename = oldPhotoUrl.split("/photos/")[1];
				} else if (oldPhotoUrl.includes("photos/")) {
					filename = oldPhotoUrl.split("photos/")[1];
				} else {
					// Try to extract filename from URL
					const urlParts = oldPhotoUrl.split("/");
					filename = urlParts[urlParts.length - 1];
				}

				if (!filename) {
					console.log(`❌ Cannot extract filename from: ${oldPhotoUrl}`);
					errorCount++;
					continue;
				}

				// Remove query parameters from filename
				filename = filename.split("?")[0];

				// Old file path
				const oldFilePath = path.join(
					process.cwd(),
					"public",
					"photos",
					filename
				);

				// New file path
				const newFilePath = path.join(uploadsDir, filename);

				// Check if old file exists
				try {
					await fs.access(oldFilePath);
				} catch {
					console.log(`⚠️  Old file not found: ${oldFilePath}`);
					errorCount++;
					continue;
				}

				// Copy file to new location
				await fs.copyFile(oldFilePath, newFilePath);

				// New URL for database
				const newPhotoUrl = `/api/uploads/attendance/${filename}`;

				// Update database
				await connection.execute(
					"UPDATE temporary_presensi SET photo = ? WHERE id = ? AND jam_datang = ?",
					[newPhotoUrl, row.id, row.jam_datang]
				);

				await connection.execute(
					"UPDATE rekap_presensi SET photo = ? WHERE id = ? AND jam_datang = ?",
					[newPhotoUrl, row.id, row.jam_datang]
				);

				console.log(`✅ Migrated: ${filename}`);
				migratedCount++;
			} catch (error) {
				console.error(`❌ Error migrating ${row.photo}:`, error.message);
				errorCount++;
			}
		}

		console.log("\n📈 Migration Summary:");
		console.log(`✅ Successfully migrated: ${migratedCount} photos`);
		console.log(`❌ Errors: ${errorCount} photos`);
		console.log(`📊 Total processed: ${allRows.length} photos`);

		if (migratedCount > 0) {
			console.log("\n🧹 Cleanup old photos (optional):");
			console.log(
				"You can now safely delete the public/photos folder if all photos are migrated successfully."
			);
			console.log("Command: rm -rf public/photos");
		}
	} catch (error) {
		console.error("💥 Migration failed:", error);
	} finally {
		if (connection) {
			await connection.end();
			console.log("🔐 Database connection closed");
		}
	}
}

// Run migration
if (require.main === module) {
	migratePhotos();
}

module.exports = migratePhotos;
