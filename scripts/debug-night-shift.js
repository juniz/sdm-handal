#!/usr/bin/env node

/**
 * Script untuk debugging dan testing shift malam
 * Jalankan dengan: node scripts/debug-night-shift.js
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

async function debugNightShift(connection, employeeId = null) {
	console.log("\n🌙 === NIGHT SHIFT DEBUG REPORT ===\n");

	const today = moment().format("YYYY-MM-DD");
	const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

	console.log(`📅 Today: ${today}`);
	console.log(`📅 Yesterday: ${yesterday}`);
	console.log(`⏰ Current Time: ${moment().format("YYYY-MM-DD HH:mm:ss")}\n`);

	// 1. Cek shift malam configuration
	console.log("🔧 === SHIFT CONFIGURATION ===");
	const [shifts] = await connection.execute(`
        SELECT shift, jam_masuk, jam_pulang,
               CASE WHEN TIME(jam_pulang) < TIME(jam_masuk) THEN 'NIGHT SHIFT' ELSE 'NORMAL SHIFT' END as shift_type
        FROM jam_masuk 
        ORDER BY shift
    `);

	console.table(shifts);

	// 2. Cek temporary_presensi
	console.log("\n📋 === TEMPORARY PRESENSI (ACTIVE) ===");
	let tempQuery = `
        SELECT tp.*, jm.jam_masuk, jm.jam_pulang,
               CASE WHEN TIME(jm.jam_pulang) < TIME(jm.jam_masuk) THEN 'NIGHT SHIFT' ELSE 'NORMAL SHIFT' END as shift_type,
               CASE 
                   WHEN TIME(jm.jam_pulang) < TIME(jm.jam_masuk) THEN 
                       CONCAT(DATE(tp.jam_datang), ' ', jm.jam_pulang, ' +1 day')
                   ELSE 
                       CONCAT(DATE(tp.jam_datang), ' ', jm.jam_pulang)
               END as expected_checkout
        FROM temporary_presensi tp
        LEFT JOIN jam_masuk jm ON tp.shift = jm.shift
        WHERE tp.jam_pulang IS NULL
    `;

	const tempParams = [];
	if (employeeId) {
		tempQuery += " AND tp.id = ?";
		tempParams.push(employeeId);
	}

	tempQuery += " ORDER BY tp.jam_datang DESC";

	const [tempPresensi] = await connection.execute(tempQuery, tempParams);

	if (tempPresensi.length > 0) {
		console.table(tempPresensi);

		// Analisis setiap presensi aktif
		for (const attendance of tempPresensi) {
			console.log(`\n🔍 Analysis for Employee ${attendance.id}:`);
			console.log(`   Shift: ${attendance.shift} (${attendance.shift_type})`);
			console.log(`   Check-in: ${attendance.jam_datang}`);
			console.log(`   Expected checkout: ${attendance.expected_checkout}`);

			if (attendance.shift_type === "NIGHT SHIFT") {
				const jamDatang = moment(attendance.jam_datang);
				const jamPulangExpected = moment(
					jamDatang.format("YYYY-MM-DD") + " " + attendance.jam_pulang
				).add(1, "day");
				const current = moment();

				const isStillActive = current.isBefore(jamPulangExpected);
				const hoursWorked = current.diff(jamDatang, "hours", true);

				console.log(
					`   Status: ${
						isStillActive ? "🟢 STILL ACTIVE" : "🔴 SHOULD BE CHECKED OUT"
					}`
				);
				console.log(`   Hours worked: ${hoursWorked.toFixed(1)} hours`);
				console.log(
					`   Should checkout at: ${jamPulangExpected.format(
						"YYYY-MM-DD HH:mm:ss"
					)}`
				);

				if (!isStillActive) {
					console.log(
						`   ⚠️  WARNING: This attendance should be auto-checked out!`
					);
				}
			}
		}
	} else {
		console.log("✅ No active attendance found");
	}

	// 3. Cek rekap_presensi hari ini dan kemarin
	console.log("\n📊 === REKAP PRESENSI (COMPLETED) ===");
	let rekapQuery = `
        SELECT rp.*, jm.jam_masuk, jm.jam_pulang,
               CASE WHEN TIME(jm.jam_pulang) < TIME(jm.jam_masuk) THEN 'NIGHT SHIFT' ELSE 'NORMAL SHIFT' END as shift_type,
               DATE(rp.jam_datang) as work_date,
               DATE(rp.jam_pulang) as checkout_date
        FROM rekap_presensi rp
        LEFT JOIN jam_masuk jm ON rp.shift = jm.shift
        WHERE (DATE(rp.jam_datang) = ? OR DATE(rp.jam_datang) = ?)
    `;

	const rekapParams = [yesterday, today];
	if (employeeId) {
		rekapQuery += " AND rp.id = ?";
		rekapParams.push(employeeId);
	}

	rekapQuery += " ORDER BY rp.jam_datang DESC LIMIT 10";

	const [rekapPresensi] = await connection.execute(rekapQuery, rekapParams);

	if (rekapPresensi.length > 0) {
		console.table(
			rekapPresensi.map((r) => ({
				id: r.id,
				shift: r.shift,
				shift_type: r.shift_type,
				work_date: r.work_date,
				jam_datang: r.jam_datang,
				jam_pulang: r.jam_pulang,
				checkout_date: r.checkout_date,
				durasi: r.durasi,
				status: r.status,
			}))
		);
	} else {
		console.log("✅ No completed attendance found for today/yesterday");
	}

	// 4. Simulasi getTodayAttendance logic
	console.log("\n🔄 === SIMULATE getTodayAttendance() ===");

	if (employeeId) {
		// Test query yang diperbaiki
		const testQuery = `
            SELECT *
            FROM temporary_presensi 
            WHERE id = ? 
            AND (
                DATE(jam_datang) = ?
                OR (
                    DATE(jam_datang) = ? 
                    AND jam_pulang IS NULL
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

		const [todayAttendance] = await connection.execute(testQuery, [
			employeeId,
			today,
			yesterday,
			yesterday,
			yesterday,
		]);

		console.log(`Employee ${employeeId} - getTodayAttendance() result:`);
		if (todayAttendance.length > 0) {
			console.log("🔴 BLOCKED - Found active attendance:", todayAttendance[0]);
		} else {
			console.log("✅ ALLOWED - No active attendance found");

			// Check rekap_presensi juga
			const rekapCheckQuery = `
                SELECT *
                FROM rekap_presensi 
                WHERE id = ? 
                AND (
                    DATE(jam_datang) = ?
                    OR (
                        DATE(jam_datang) = ? 
                        AND jam_pulang IS NOT NULL
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

			const [rekapCheck] = await connection.execute(rekapCheckQuery, [
				employeeId,
				today,
				yesterday,
				today,
			]);

			if (rekapCheck.length > 0) {
				console.log(
					"ℹ️  Found completed attendance (won't block):",
					rekapCheck[0]
				);
			}
		}
	} else {
		console.log("ℹ️  Specify employee ID to test getTodayAttendance() logic");
	}

	console.log("\n🎯 === RECOMMENDATIONS ===");

	// Cek apakah ada presensi yang perlu auto-checkout
	const [overdueAttendance] = await connection.execute(`
        SELECT tp.*, jm.jam_masuk, jm.jam_pulang,
               TIMESTAMPDIFF(HOUR, tp.jam_datang, NOW()) as hours_worked
        FROM temporary_presensi tp
        LEFT JOIN jam_masuk jm ON tp.shift = jm.shift
        WHERE tp.jam_pulang IS NULL
        AND TIME(jm.jam_pulang) < TIME(jm.jam_masuk)
        AND (
            CONCAT(DATE(tp.jam_datang), ' ', jm.jam_pulang, ' +1 day') < NOW()
            OR TIMESTAMPDIFF(HOUR, tp.jam_datang, NOW()) > 15
        )
    `);

	if (overdueAttendance.length > 0) {
		console.log("⚠️  OVERDUE ATTENDANCE FOUND - Need auto-checkout:");
		console.table(overdueAttendance);
	} else {
		console.log("✅ No overdue attendance found");
	}

	console.log("\n📝 === SUMMARY ===");
	console.log(
		`Active night shifts: ${
			tempPresensi.filter((t) => t.shift_type === "NIGHT SHIFT").length
		}`
	);
	console.log(
		`Completed attendance today: ${
			rekapPresensi.filter((r) => r.checkout_date === today).length
		}`
	);
	console.log(`Overdue attendance: ${overdueAttendance.length}`);
}

async function main() {
	const connection = await connectDB();

	// Get employee ID from command line argument
	const employeeId = process.argv[2] || null;

	if (employeeId) {
		console.log(`🔍 Debugging for Employee ID: ${employeeId}`);
	} else {
		console.log(
			"🔍 Debugging for all employees (specify employee ID as argument for detailed analysis)"
		);
	}

	try {
		await debugNightShift(connection, employeeId);
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

module.exports = { debugNightShift };
