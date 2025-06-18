const { rawQuery } = require("../src/lib/db-helper");
const moment = require("moment-timezone");

async function checkCompletedAttendance() {
	try {
		console.log("🔍 DEBUGGING COMPLETED ATTENDANCE API");
		console.log("=".repeat(50));

		// Simulasi idPegawai (ganti dengan ID yang sesuai)
		const idPegawai = 1; // Ganti dengan ID pegawai yang sedang ditest

		const dateStr = moment().format("YYYY-MM-DD");
		const previousDateStr = moment().subtract(1, "day").format("YYYY-MM-DD");

		console.log(`📅 Target Date: ${dateStr}`);
		console.log(`📅 Previous Date: ${previousDateStr}`);
		console.log(`👤 ID Pegawai: ${idPegawai}`);
		console.log();

		// Query yang sama dengan yang ada di API
		const rekapQuery = `
			SELECT *
			FROM rekap_presensi 
			WHERE id = ? 
			AND jam_pulang IS NOT NULL
			AND (
				-- Presensi yang dimulai hari ini
				DATE(jam_datang) = ?
				OR (
					-- Shift malam dari kemarin yang pulangnya hari ini
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

		console.log("🔍 Executing query:");
		console.log(rekapQuery);
		console.log("📝 Parameters:", [
			idPegawai,
			dateStr,
			previousDateStr,
			dateStr,
		]);
		console.log();

		const result = await rawQuery(rekapQuery, [
			idPegawai,
			dateStr,
			previousDateStr,
			dateStr,
		]);

		console.log("📊 QUERY RESULT:");
		console.log("Result length:", result.length);

		if (result.length > 0) {
			console.log("❌ FOUND DATA IN rekap_presensi:");
			result.forEach((row, index) => {
				console.log(`\n📋 Record ${index + 1}:`);
				console.log(`   ID: ${row.id}`);
				console.log(`   Shift: ${row.shift}`);
				console.log(`   Jam Datang: ${row.jam_datang}`);
				console.log(`   Jam Pulang: ${row.jam_pulang}`);
				console.log(`   Status: ${row.status}`);
				console.log(`   Durasi: ${row.durasi}`);
				console.log(`   Photo: ${row.photo ? "Ada" : "Tidak ada"}`);
			});

			console.log("\n🚨 PROBLEM IDENTIFIED:");
			console.log("   - Database TIDAK bersih seperti yang diperkirakan");
			console.log("   - Masih ada data di tabel rekap_presensi");
			console.log("   - Ini yang menyebabkan completed attendance muncul");
		} else {
			console.log("✅ NO DATA FOUND in rekap_presensi");
			console.log("   - Database bersih untuk rekap_presensi");
			console.log("   - Masalah mungkin di tempat lain");
		}

		// Cek juga tabel temporary_presensi
		console.log("\n" + "=".repeat(50));
		console.log("🔍 CHECKING temporary_presensi");

		const tempQuery = `
			SELECT *
			FROM temporary_presensi 
			WHERE id = ?
			ORDER BY jam_datang DESC
			LIMIT 5
		`;

		const tempResult = await rawQuery(tempQuery, [idPegawai]);

		console.log("📊 temporary_presensi RESULT:");
		console.log("Result length:", tempResult.length);

		if (tempResult.length > 0) {
			console.log("❌ FOUND DATA IN temporary_presensi:");
			tempResult.forEach((row, index) => {
				console.log(`\n📋 Record ${index + 1}:`);
				console.log(`   ID: ${row.id}`);
				console.log(`   Shift: ${row.shift}`);
				console.log(`   Jam Datang: ${row.jam_datang}`);
				console.log(`   Jam Pulang: ${row.jam_pulang || "NULL"}`);
				console.log(`   Status: ${row.status}`);
				console.log(`   Photo: ${row.photo ? "Ada" : "Tidak ada"}`);
			});
		} else {
			console.log("✅ NO DATA FOUND in temporary_presensi");
		}

		console.log("\n" + "=".repeat(50));
		console.log("🏁 DEBUG COMPLETED");
	} catch (error) {
		console.error("❌ Error in debug:", error);
	}
}

// Jalankan debug
checkCompletedAttendance();
