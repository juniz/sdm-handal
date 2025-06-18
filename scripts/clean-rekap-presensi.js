import { query } from "../src/lib/db.js";
import moment from "moment";

async function cleanOldRekapPresensi() {
	try {
		console.log("🧹 CLEANING OLD REKAP_PRESENSI DATA");
		console.log("=".repeat(50));

		const today = moment().format("YYYY-MM-DD");
		console.log("Today:", today);

		// Hapus semua data rekap_presensi yang bukan dari hari ini
		const deleteQuery = `
			DELETE FROM rekap_presensi 
			WHERE DATE(jam_datang) < ? 
			OR DATE(jam_pulang) < ?
		`;

		console.log("Executing query:", deleteQuery);
		console.log("Parameters:", [today, today]);

		const result = await query(deleteQuery, [today, today]);
		console.log(
			`✅ Deleted ${result.affectedRows} old records from rekap_presensi`
		);

		// Cek data yang tersisa
		const remainingQuery = "SELECT COUNT(*) as count FROM rekap_presensi";
		const remaining = await query(remainingQuery);
		console.log(`📊 Remaining records: ${remaining[0].count}`);

		console.log();
		console.log("✅ CLEANING COMPLETED!");
		console.log("🔄 Please refresh the attendance page to see changes");
	} catch (error) {
		console.error("❌ Error cleaning rekap_presensi:", error);
	}
}

// Jalankan cleaning
cleanOldRekapPresensi();
