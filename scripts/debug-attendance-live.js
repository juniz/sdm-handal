#!/usr/bin/env node

/**
 * Script untuk debugging attendance dengan koneksi database langsung
 * Jalankan dengan: node scripts/debug-attendance-live.js [employee_id]
 */

const mysql = require("mysql2/promise");
const moment = require("moment-timezone");

// Set timezone
moment.tz.setDefault("Asia/Jakarta");

// Database configuration
const dbConfig = {
	host: process.env.DB_HOST || "localhost",
	user: process.env.DB_USER || "root",
	password: process.env.DB_PASSWORD || "",
	database: process.env.DB_NAME || "sdm_db",
	port: process.env.DB_PORT || 3306,
	timezone: "+07:00",
};

async function connectDB() {
	try {
		const connection = await mysql.createConnection(dbConfig);
		console.log("✅ Connected to database");
		return connection;
	} catch (error) {
		console.error("❌ Database connection failed:", error.message);
		console.log("💡 Make sure your .env file has correct database credentials");
		process.exit(1);
	}
}

async function debugAttendanceLive(connection, employeeId = 1) {
	console.log("\n🔍 === LIVE ATTENDANCE DEBUG ===\n");

	const today = moment().format("YYYY-MM-DD");
	const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

	console.log(`📅 Today: ${today}`);
	console.log(`📅 Yesterday: ${yesterday}`);
	console.log(`⏰ Current Time: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);
	console.log(`👤 Employee ID: ${employeeId}\n`);

	// 1. Raw data check
	console.log("📋 === RAW DATA CHECK ===");

	console.log("\n1️⃣ temporary_presensi (Active Attendance):");
	const [
		tempRows,
	] = await connection.execute(
		"SELECT * FROM temporary_presensi WHERE id = ? ORDER BY jam_datang DESC LIMIT 5",
		[employeeId]
	);

	if (tempRows.length > 0) {
		console.table(tempRows);
		console.log(
			`🔴 PROBLEM: Found ${tempRows.length} active attendance records!`
		);
		console.log("❌ This will block new check-in");
	} else {
		console.log("✅ No active attendance found (good!)");
	}

	console.log("\n2️⃣ rekap_presensi (Completed Attendance):");
	const [
		rekapRows,
	] = await connection.execute(
		"SELECT * FROM rekap_presensi WHERE id = ? AND DATE(jam_datang) >= ? ORDER BY jam_datang DESC LIMIT 5",
		[employeeId, yesterday]
	);

	if (rekapRows.length > 0) {
		console.table(rekapRows);
		console.log(`✅ Found ${rekapRows.length} completed attendance records`);
	} else {
		console.log("⚠️  No completed attendance found");
	}

	// 2. Test Query 1: /api/attendance/today (should return NULL)
	console.log("\n🧪 === TEST QUERY 1: /api/attendance/today ===");
	const todayQuery = `
        SELECT *
        FROM temporary_presensi 
        WHERE id = ?
        AND jam_pulang IS NULL
        AND (
            DATE(jam_datang) = ?
            OR (
                DATE(jam_datang) = ?
                AND EXISTS (
                    SELECT 1 FROM jam_masuk jm 
                    WHERE jm.shift = temporary_presensi.shift 
                    AND TIME(jm.jam_pulang) < TIME(jm.jam_masuk)
                )
                AND (
                    CONCAT(?, ' ', (
                        SELECT jam_pulang FROM jam_masuk 
                        WHERE shift = temporary_presensi.shift
                    )) > NOW()
                    OR 
                    CONCAT(DATE_ADD(?, INTERVAL 1 DAY), ' ', (
                        SELECT jam_pulang FROM jam_masuk 
                        WHERE shift = temporary_presensi.shift
                    )) > NOW()
                )
            )
        )
        ORDER BY jam_datang DESC
        LIMIT 1
    `;

	const [todayResult] = await connection.execute(todayQuery, [
		employeeId,
		today,
		yesterday,
		yesterday,
		yesterday,
	]);

	if (todayResult.length > 0) {
		console.log("🔴 PROBLEM: Query returned active attendance:");
		console.table(todayResult);
		console.log("❌ This will block new check-in!");

		// Analyze why this record is still active
		const record = todayResult[0];
		console.log("\n🔍 Analyzing why this record is still active:");
		console.log(`- jam_datang: ${record.jam_datang}`);
		console.log(`- jam_pulang: ${record.jam_pulang || "NULL"}`);
		console.log(`- shift: ${record.shift}`);

		// Check shift configuration
		const [
			shiftConfig,
		] = await connection.execute("SELECT * FROM jam_masuk WHERE shift = ?", [
			record.shift,
		]);

		if (shiftConfig.length > 0) {
			const shift = shiftConfig[0];
			console.log(`- Shift config: ${shift.jam_masuk} - ${shift.jam_pulang}`);
			console.log(
				`- Is night shift: ${shift.jam_pulang < shift.jam_masuk ? "YES" : "NO"}`
			);

			if (shift.jam_pulang < shift.jam_masuk) {
				const jamDatang = moment(record.jam_datang);
				const jamPulangExpected = moment(
					jamDatang.format("YYYY-MM-DD") + " " + shift.jam_pulang
				).add(1, "day");
				const current = moment();

				console.log(
					`- Expected checkout: ${jamPulangExpected.format(
						"YYYY-MM-DD HH:mm:ss"
					)}`
				);
				console.log(`- Current time: ${current.format("YYYY-MM-DD HH:mm:ss")}`);
				console.log(
					`- Is overdue: ${current.isAfter(jamPulangExpected) ? "YES" : "NO"}`
				);

				if (current.isAfter(jamPulangExpected)) {
					console.log("💡 SOLUTION: This record should be auto-checked out!");
				}
			}
		}
	} else {
		console.log("✅ Query returned NULL (good!)");
		console.log("✅ User should be able to start new attendance");
	}

	// 3. Test Query 2: /api/attendance/completed
	console.log("\n🧪 === TEST QUERY 2: /api/attendance/completed ===");
	const completedQuery = `
        SELECT *
        FROM rekap_presensi 
        WHERE id = ?
        AND jam_pulang IS NOT NULL
        AND (
            DATE(jam_datang) = ?
            OR (
                DATE(jam_datang) = ?
                AND EXISTS (
                    SELECT 1 FROM jam_masuk jm 
                    WHERE jm.shift = rekap_presensi.shift 
                    AND TIME(jm.jam_pulang) < TIME(jm.jam_masuk)
                    AND DATE(jam_pulang) = ?
                )
            )
        )
        ORDER BY jam_datang DESC
        LIMIT 1
    `;

	const [completedResult] = await connection.execute(completedQuery, [
		employeeId,
		today,
		yesterday,
		today,
	]);

	if (completedResult.length > 0) {
		console.log("✅ Query returned completed attendance:");
		console.table(completedResult);
		console.log("✅ This is good - shows completed shift for UI display");
	} else {
		console.log("⚠️  Query returned NULL");
		console.log("ℹ️  No completed attendance found for today");
	}

	// 4. Recommendations
	console.log("\n💡 === RECOMMENDATIONS ===");

	if (tempRows.length > 0) {
		console.log("🔧 ACTIONS NEEDED:");
		console.log(
			"1. Check if any record in temporary_presensi should be auto-checked out"
		);
		console.log("2. Run manual cleanup if needed");
		console.log("3. Consider running auto-checkout process");

		// Show cleanup query
		console.log("\n📝 Manual cleanup query (if needed):");
		tempRows.forEach((record) => {
			console.log(
				`-- For record ID ${record.id}, jam_datang: ${record.jam_datang}`
			);
			console.log(
				`DELETE FROM temporary_presensi WHERE id = ${
					record.id
				} AND jam_datang = '${moment(record.jam_datang).format(
					"YYYY-MM-DD HH:mm:ss"
				)}';`
			);
		});
	} else {
		console.log("✅ Everything looks good!");
		console.log("✅ User should be able to start new attendance");
	}
}

async function main() {
	const connection = await connectDB();

	// Get employee ID from command line argument
	const employeeId = process.argv[2] || 1;

	console.log(`🔍 Live debugging for Employee ID: ${employeeId}`);

	try {
		await debugAttendanceLive(connection, employeeId);
	} catch (error) {
		console.error("❌ Error during debugging:", error);
	} finally {
		await connection.end();
		console.log("\n✅ Debug completed");
	}
}

// Run the script
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { debugAttendanceLive };
