#!/usr/bin/env node

/**
 * Script untuk testing query attendance secara langsung
 * Jalankan dengan: node scripts/test-attendance-query.js [employee_id]
 */

const moment = require("moment-timezone");

// Set timezone
moment.tz.setDefault("Asia/Jakarta");

async function testAttendanceQueries(employeeId = 1) {
	console.log("\n🧪 === TESTING ATTENDANCE QUERIES ===\n");

	const today = moment().format("YYYY-MM-DD");
	const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

	console.log(`📅 Today: ${today}`);
	console.log(`📅 Yesterday: ${yesterday}`);
	console.log(`⏰ Current Time: ${moment().format("YYYY-MM-DD HH:mm:ss")}`);
	console.log(`👤 Employee ID: ${employeeId}\n`);

	// Query 1: API /today (hanya presensi aktif)
	console.log("🔍 === QUERY 1: /api/attendance/today ===");
	const todayQuery = `
        SELECT *
        FROM temporary_presensi 
        WHERE id = ${employeeId}
        AND jam_pulang IS NULL
        AND (
            DATE(jam_datang) = '${today}'
            OR (
                DATE(jam_datang) = '${yesterday}'
                AND EXISTS (
                    SELECT 1 FROM jam_masuk jm 
                    WHERE jm.shift = temporary_presensi.shift 
                    AND TIME(jm.jam_pulang) < TIME(jm.jam_masuk)
                )
                AND (
                    CONCAT('${yesterday}', ' ', (
                        SELECT jam_pulang FROM jam_masuk 
                        WHERE shift = temporary_presensi.shift
                    )) > NOW()
                    OR 
                    CONCAT(DATE_ADD('${yesterday}', INTERVAL 1 DAY), ' ', (
                        SELECT jam_pulang FROM jam_masuk 
                        WHERE shift = temporary_presensi.shift
                    )) > NOW()
                )
            )
        )
        ORDER BY jam_datang DESC
        LIMIT 1;
    `;

	console.log("Query:");
	console.log(todayQuery);

	// Query 2: API /completed (presensi selesai)
	console.log("\n🔍 === QUERY 2: /api/attendance/completed ===");
	const completedQuery = `
        SELECT *
        FROM rekap_presensi 
        WHERE id = ${employeeId}
        AND jam_pulang IS NOT NULL
        AND (
            DATE(jam_datang) = '${today}'
            OR (
                DATE(jam_datang) = '${yesterday}'
                AND EXISTS (
                    SELECT 1 FROM jam_masuk jm 
                    WHERE jm.shift = rekap_presensi.shift 
                    AND TIME(jm.jam_pulang) < TIME(jm.jam_masuk)
                    AND DATE(jam_pulang) = '${today}'
                )
            )
        )
        ORDER BY jam_datang DESC
        LIMIT 1;
    `;

	console.log("Query:");
	console.log(completedQuery);

	// Query 3: Raw data check
	console.log("\n🔍 === QUERY 3: RAW DATA CHECK ===");
	console.log("temporary_presensi:");
	console.log(
		`SELECT * FROM temporary_presensi WHERE id = ${employeeId} ORDER BY jam_datang DESC LIMIT 3;`
	);

	console.log("\nrekap_presensi:");
	console.log(
		`SELECT * FROM rekap_presensi WHERE id = ${employeeId} AND DATE(jam_datang) >= '${yesterday}' ORDER BY jam_datang DESC LIMIT 3;`
	);

	console.log("\n📝 === EXPECTED RESULTS ===");
	console.log("✅ Query 1 (/today) should return: NULL (no active attendance)");
	console.log(
		"✅ Query 2 (/completed) should return: Data shift 17-18 (completed attendance)"
	);
	console.log("✅ User should be able to start new attendance");

	console.log("\n💡 === HOW TO TEST ===");
	console.log("1. Copy queries above and run in your MySQL client");
	console.log("2. Check if Query 1 returns empty result");
	console.log("3. Check if Query 2 returns the completed shift data");
	console.log(
		"4. If Query 1 still returns data, there is still active attendance blocking new check-in"
	);
}

async function main() {
	const employeeId = process.argv[2] || 1;

	try {
		await testAttendanceQueries(employeeId);
	} catch (error) {
		console.error("❌ Error during testing:", error);
	}

	console.log("\n✅ Test queries generated successfully");
	console.log(
		"📋 Copy the queries above and run them in your MySQL client to debug the issue"
	);
}

// Run the script
if (require.main === module) {
	main().catch(console.error);
}

module.exports = { testAttendanceQueries };
