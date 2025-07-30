const mysql = require("mysql2/promise");

// Database configuration
const dbConfig = {
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "sdm_db",
};

async function addSampleProgress() {
	let connection;

	try {
		console.log("🔍 Adding Sample Progress Data...");

		// Connect to database
		connection = await mysql.createConnection(dbConfig);
		console.log("✅ Connected to database");

		// Get first development request
		const [requestsResult] = await connection.execute(
			"SELECT request_id, title FROM development_requests LIMIT 1"
		);

		if (requestsResult.length === 0) {
			console.log(
				"❌ No development requests found. Please create some requests first."
			);
			return;
		}

		const request = requestsResult[0];
		console.log(
			`📋 Adding progress for request: ${request.title} (ID: ${request.request_id})`
		);

		// Check if progress already exists
		const [
			existingProgress,
		] = await connection.execute(
			"SELECT COUNT(*) as count FROM development_progress WHERE request_id = ?",
			[request.request_id]
		);

		if (existingProgress[0].count > 0) {
			console.log("✅ Progress data already exists for this request");
			return;
		}

		// Add sample progress entries
		const progressEntries = [
			{
				progress_percentage: 25,
				progress_description: "Analisis kebutuhan selesai",
				milestone: "Analysis Complete",
				updated_by: "admin",
			},
			{
				progress_percentage: 50,
				progress_description: "Desain sistem selesai",
				milestone: "Design Complete",
				updated_by: "admin",
			},
			{
				progress_percentage: 75,
				progress_description: "Coding selesai, mulai testing",
				milestone: "Development Complete",
				updated_by: "admin",
			},
		];

		for (const entry of progressEntries) {
			await connection.execute(
				`INSERT INTO development_progress 
				(request_id, progress_percentage, progress_description, milestone, updated_by, update_date) 
				VALUES (?, ?, ?, ?, ?, NOW())`,
				[
					request.request_id,
					entry.progress_percentage,
					entry.progress_description,
					entry.milestone,
					entry.updated_by,
				]
			);
			console.log(
				`  ✅ Added progress: ${entry.progress_percentage}% - ${entry.milestone}`
			);
		}

		// Update request status to "In Development"
		await connection.execute(
			'UPDATE development_requests SET current_status_id = (SELECT status_id FROM development_statuses WHERE status_name = "In Development") WHERE request_id = ?',
			[request.request_id]
		);
		console.log('  ✅ Updated request status to "In Development"');

		console.log("\n🎉 Sample progress data added successfully!");
		console.log(
			"📝 Next: Refresh the development requests page to see the progress bar"
		);
	} catch (error) {
		console.error("❌ Error adding sample progress:", error);
	} finally {
		if (connection) {
			await connection.end();
			console.log("🔌 Database connection closed");
		}
	}
}

// Run the script
if (require.main === module) {
	addSampleProgress()
		.then(() => {
			console.log("\n✅ Script completed");
			process.exit(0);
		})
		.catch((error) => {
			console.error("❌ Script failed:", error);
			process.exit(1);
		});
}

module.exports = { addSampleProgress };
