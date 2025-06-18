#!/usr/bin/env node

/**
 * Script untuk mengecek data di rekap_presensi
 * Jalankan dengan: node scripts/check-rekap-presensi.js [employee_id]
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
		process.exit(1);
	}
}

async function checkRekapPresensi(connection, employeeId = 1) {
	console.log("\n🔍 === CHECKING REKAP_PRESENSI ===\n");

	const today = moment().format("YYYY-MM-DD");
	const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

	console.log(`📅 Today: ${today}`);
	console.log(`📅 Yesterday: ${yesterday}`);
	console.log(`⏰ Current Time: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);
	console.log(`👤 Employee ID: ${employeeId}\n`);

	// 1. Check all rekap_presensi data for this employee
	console.log("📋 === ALL REKAP_PRESENSI DATA ===");
	console.log("─".repeat(60));

	const [
		allRows,
	] = await connection.execute(
		"SELECT * FROM rekap_presensi WHERE id = ? ORDER BY jam_datang DESC LIMIT 10",
		[employeeId]
	);

	if (allRows.length > 0) {
		console.log(`Found ${allRows.length} records in rekap_presensi:`);
		console.table(allRows);
	} else {
		console.log("✅ No records found in rekap_presensi");
	}

	// 2. Test the exact query used by getTodayCheckout
	console.log("\n🧪 === TESTING getTodayCheckout QUERY ===");
	console.log("─".repeat(60));

	const checkoutQuery = `
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

	const [checkoutResult] = await connection.execute(checkoutQuery, [
		employeeId,
		today,
		yesterday,
		today,
	]);

	if (checkoutResult.length > 0) {
		console.log("🔴 PROBLEM: getTodayCheckout query returns data:");
		console.table(checkoutResult);
		console.log("❌ This data will appear in attendanceStatus.checkout");
		console.log('❌ This causes "Data Presensi Hari Ini" to be displayed');

		const record = checkoutResult[0];
		console.log("\n🔍 Analyzing the record:");
		console.log(`- jam_datang: ${record.jam_datang}`);
		console.log(`- jam_pulang: ${record.jam_pulang}`);
		console.log(`- shift: ${record.shift}`);
		console.log(`- status: ${record.status}`);

		// Check if this is a night shift
		const [
			shiftInfo,
		] = await connection.execute("SELECT * FROM jam_masuk WHERE shift = ?", [
			record.shift,
		]);

		if (shiftInfo.length > 0) {
			const shift = shiftInfo[0];
			console.log(`- Shift config: ${shift.jam_masuk} - ${shift.jam_pulang}`);
			console.log(
				`- Is night shift: ${shift.jam_pulang < shift.jam_masuk ? "YES" : "NO"}`
			);
		}
	} else {
		console.log("✅ getTodayCheckout query returns NULL (good!)");
	}

	// 3. Check records from yesterday that might affect today
	console.log("\n🧪 === CHECKING YESTERDAY RECORDS ===");
	console.log("─".repeat(60));

	const [
		yesterdayRows,
	] = await connection.execute(
		"SELECT * FROM rekap_presensi WHERE id = ? AND DATE(jam_datang) = ? ORDER BY jam_datang DESC",
		[employeeId, yesterday]
	);

	if (yesterdayRows.length > 0) {
		console.log(`Found ${yesterdayRows.length} records from yesterday:`);
		console.table(yesterdayRows);

		// Check if any of these should affect today
		for (const record of yesterdayRows) {
			if (
				record.jam_pulang &&
				moment(record.jam_pulang).format("YYYY-MM-DD") === today
			) {
				console.log(
					`🔴 FOUND PROBLEMATIC RECORD: Night shift from ${yesterday} that ended on ${today}`
				);
				console.log("This record is being returned by getTodayCheckout query");
			}
		}
	} else {
		console.log("✅ No records from yesterday");
	}

	// 4. Recommendations
	console.log("\n💡 === RECOMMENDATIONS ===");
	console.log("─".repeat(60));

	if (checkoutResult.length > 0) {
		console.log("🔧 SOLUTION NEEDED:");
		console.log(
			"1. The problem is in getTodayCheckout() function in /api/attendance/status"
		);
		console.log("2. It's returning completed attendance data");
		console.log(
			'3. This data should NOT be used to show "Data Presensi Hari Ini"'
		);
		console.log("4. We need to modify the frontend logic");
		console.log("");
		console.log("📝 PROPOSED FIX:");
		console.log(
			"- Modify frontend condition to only show section for active attendance"
		);
		console.log("- Use completedAttendance for UI display of completed data");
		console.log(
			"- Don't use attendanceStatus.checkout for displaying current data"
		);
	} else {
		console.log("✅ No problematic data found");
		console.log("✅ The issue might be in browser cache");
	}
}

async function main() {
	// Load environment variables if .env file exists
	try {
		require("dotenv").config();
	} catch (e) {
		// dotenv not available, use environment variables directly
	}

	const connection = await connectDB();

	// Get employee ID from command line argument
	const employeeId = process.argv[2] || 1;

	console.log(`🔍 Checking rekap_presensi for Employee ID: ${employeeId}`);

	try {
		await checkRekapPresensi(connection, employeeId);
	} catch (error) {
		console.error("❌ Error during checking:", error);
	} finally {
		await connection.end();
		console.log("\n✅ Check completed");
	}
}

// Run the script
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { checkRekapPresensi };
