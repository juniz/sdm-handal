import { query } from "../src/lib/db.js";

async function cleanAllAttendance() {
	try {
		console.log("🧹 CLEANING ALL ATTENDANCE DATA");
		console.log("=".repeat(50));

		// 1. Hapus semua data dari temporary_presensi
		console.log("🗑️  Cleaning temporary_presensi...");
		const tempResult = await query("DELETE FROM temporary_presensi");
		console.log(
			`   ✅ Deleted ${tempResult.affectedRows} rows from temporary_presensi`
		);

		// 2. Hapus semua data dari rekap_presensi
		console.log("🗑️  Cleaning rekap_presensi...");
		const rekapResult = await query("DELETE FROM rekap_presensi");
		console.log(
			`   ✅ Deleted ${rekapResult.affectedRows} rows from rekap_presensi`
		);

		// 3. Hapus semua data dari geolocation_presensi
		console.log("🗑️  Cleaning geolocation_presensi...");
		const geoResult = await query("DELETE FROM geolocation_presensi");
		console.log(
			`   ✅ Deleted ${geoResult.affectedRows} rows from geolocation_presensi`
		);

		// 4. Hapus semua data dari security_logs
		console.log("🗑️  Cleaning security_logs...");
		const securityResult = await query("DELETE FROM security_logs");
		console.log(
			`   ✅ Deleted ${securityResult.affectedRows} rows from security_logs`
		);

		console.log();
		console.log("✅ ALL ATTENDANCE DATA CLEANED SUCCESSFULLY!");
		console.log(
			"🔄 Please restart your development server and clear browser cache"
		);
		console.log();
		console.log("Commands to run:");
		console.log("1. Stop development server (Ctrl+C)");
		console.log("2. rm -rf .next");
		console.log("3. npm run dev");
		console.log("4. Clear browser cache completely");
	} catch (error) {
		console.error("❌ Error cleaning attendance data:", error);
	}
}

// Jalankan cleaning
cleanAllAttendance();
