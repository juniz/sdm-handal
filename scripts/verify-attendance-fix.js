#!/usr/bin/env node

/**
 * Script untuk memverifikasi perbaikan attendance
 * Jalankan dengan: node scripts/verify-attendance-fix.js [employee_id]
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

async function verifyAttendanceFix(connection, employeeId = 1) {
	console.log("\n🔍 === VERIFYING ATTENDANCE FIX ===\n");

	const today = moment().format("YYYY-MM-DD");
	const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

	console.log(`📅 Today: ${today}`);
	console.log(`📅 Yesterday: ${yesterday}`);
	console.log(`⏰ Current Time: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);
	console.log(`👤 Employee ID: ${employeeId}\n`);

	let allTestsPassed = true;

	// Test 1: Check temporary_presensi (should be empty)
	console.log("🧪 TEST 1: temporary_presensi (Active Attendance)");
	console.log("─".repeat(50));

	const [
		tempRows,
	] = await connection.execute(
		"SELECT * FROM temporary_presensi WHERE id = ? AND jam_pulang IS NULL",
		[employeeId]
	);

	if (tempRows.length === 0) {
		console.log("✅ PASS: No active attendance found");
	} else {
		console.log("❌ FAIL: Found active attendance records:");
		console.table(tempRows);
		allTestsPassed = false;
	}

	// Test 2: Test /api/attendance/today query
	console.log("\n🧪 TEST 2: /api/attendance/today Query Logic");
	console.log("─".repeat(50));

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

	if (todayResult.length === 0) {
		console.log("✅ PASS: /today query returns NULL (no active attendance)");
	} else {
		console.log("❌ FAIL: /today query returns data:");
		console.table(todayResult);
		allTestsPassed = false;
	}

	// Test 3: Check completed attendance
	console.log("\n🧪 TEST 3: rekap_presensi (Completed Attendance)");
	console.log("─".repeat(50));

	const [
		rekapRows,
	] = await connection.execute(
		"SELECT * FROM rekap_presensi WHERE id = ? AND DATE(jam_datang) >= ? ORDER BY jam_datang DESC LIMIT 3",
		[employeeId, yesterday]
	);

	if (rekapRows.length > 0) {
		console.log(
			"✅ PASS: Found completed attendance records (good for UI display):"
		);
		console.table(rekapRows);
	} else {
		console.log("⚠️  INFO: No completed attendance found (this is OK)");
	}

	// Test 4: Check for data consistency
	console.log("\n🧪 TEST 4: Data Consistency Check");
	console.log("─".repeat(50));

	// Check for duplicate records
	const [duplicates] = await connection.execute(
		`
        SELECT jam_datang, COUNT(*) as count 
        FROM temporary_presensi 
        WHERE id = ? 
        GROUP BY jam_datang 
        HAVING COUNT(*) > 1
    `,
		[employeeId]
	);

	if (duplicates.length === 0) {
		console.log("✅ PASS: No duplicate records in temporary_presensi");
	} else {
		console.log("❌ FAIL: Found duplicate records:");
		console.table(duplicates);
		allTestsPassed = false;
	}

	// Test 5: Check orphaned records
	console.log("\n🧪 TEST 5: Orphaned Records Check");
	console.log("─".repeat(50));

	const [orphaned] = await connection.execute(
		`
        SELECT * FROM temporary_presensi 
        WHERE id = ? 
        AND jam_datang < DATE_SUB(NOW(), INTERVAL 2 DAY)
        AND jam_pulang IS NULL
    `,
		[employeeId]
	);

	if (orphaned.length === 0) {
		console.log("✅ PASS: No orphaned records found");
	} else {
		console.log("⚠️  WARNING: Found old records that might need cleanup:");
		console.table(orphaned);
	}

	// Final Result
	console.log("\n📊 === VERIFICATION SUMMARY ===");
	console.log("─".repeat(50));

	if (allTestsPassed) {
		console.log("🎉 ALL TESTS PASSED!");
		console.log("✅ Database is clean");
		console.log("✅ Queries work correctly");
		console.log("✅ User should be able to start new attendance");

		console.log("\n📝 Next Steps:");
		console.log("1. Clear browser cache (Ctrl+Shift+R)");
		console.log("2. Restart development server");
		console.log("3. Test in incognito mode");
		console.log("4. Try to start new attendance");
	} else {
		console.log("❌ SOME TESTS FAILED!");
		console.log("🔧 Manual cleanup may be required");

		if (tempRows.length > 0) {
			console.log("\n🛠️  Manual Cleanup Commands:");
			tempRows.forEach((record) => {
				console.log(
					`DELETE FROM temporary_presensi WHERE id = ${
						record.id
					} AND jam_datang = '${moment(record.jam_datang).format(
						"YYYY-MM-DD HH:mm:ss"
					)}';`
				);
			});
		}
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

	console.log(`🔍 Verifying attendance fix for Employee ID: ${employeeId}`);

	try {
		await verifyAttendanceFix(connection, employeeId);
	} catch (error) {
		console.error("❌ Error during verification:", error);
	} finally {
		await connection.end();
		console.log("\n✅ Verification completed");
	}
}

// Run the script
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { verifyAttendanceFix };
