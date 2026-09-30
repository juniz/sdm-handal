const mysql = require("mysql2/promise");

function mapAbsenStatusToKondisi(status) {
	const lower = (status || "").toLowerCase().trim();
	if (lower.includes("toleransi") || lower.includes("terlambat_ringan")) {
		return "terlambat_ringan";
	}
	if (lower.includes("terlambat i") || lower.includes("terlambat_sedang") || lower === "terlambat 1" || lower === "terlambat i") {
		return "terlambat_sedang";
	}
	if (lower.includes("terlambat ii") || lower.includes("terlambat_berat") || lower === "terlambat 2" || lower === "terlambat ii") {
		return "terlambat_berat";
	}
	if (lower.includes("hadir") || lower.includes("tepat") || lower === "tepat_waktu") {
		return "tepat_waktu";
	}
	if (lower.includes("alpha")) {
		return "alpha";
	}
	return "tepat_waktu";
}

function calculateSkorTotal(skorKegiatan, skorAbsensi, bobotKegiatan = 60) {
	const bobotKgt = Number(bobotKegiatan) || 60;
	const bobotAbs = 100 - bobotKgt;
	const total = (Number(skorKegiatan || 0) * bobotKgt / 100) + (Number(skorAbsensi || 0) * bobotAbs / 100);
	return Math.round(total * 100) / 100;
}

async function run() {
	const conn = await mysql.createConnection({
		host: process.env.DB_HOST,
		port: process.env.DB_PORT,
		user: process.env.DB_USER,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME
	});

	console.log("=== Repairing Penilaian Harian Skor Mismatch ===");

	// 1. Fetch active parameters
	const [params] = await conn.query("SELECT nilai_kondisi, nilai_skor FROM parameter_penilaian WHERE is_aktif = 1");
	const scoreMap = new Map();
	for (const p of params) {
		if (p.nilai_kondisi) scoreMap.set(p.nilai_kondisi, Number(p.nilai_skor));
	}

	// 2. Find affected rows where attendance exists but skor_absensi is 0
	const [affected] = await conn.query(`
		SELECT ph.id, ph.pegawai_id, DATE_FORMAT(ph.tanggal, '%Y-%m-%d') as tgl,
		       ph.skor_kegiatan, ph.skor_absensi, ph.skor_total, ph.status,
		       rp.status as presensi_status
		FROM penilaian_harian ph
		JOIN rekap_presensi rp ON ph.pegawai_id = rp.id AND DATE(ph.tanggal) = DATE(rp.jam_datang)
		WHERE ph.status IN ('submitted', 'approved')
		  AND ph.skor_absensi = 0
		ORDER BY ph.id ASC
	`);

	console.log(`Found ${affected.length} affected rows to repair.`);

	let fixedCount = 0;
	for (const row of affected) {
		const kondisi = mapAbsenStatusToKondisi(row.presensi_status);
		const skorAbsensiBaru = scoreMap.get(kondisi) ?? 100;
		const skorTotalBaru = calculateSkorTotal(row.skor_kegiatan, skorAbsensiBaru, 60);

		console.log(`Fixing row ID ${row.id} (Pegawai: ${row.pegawai_id}, Tgl: ${row.tgl}):`);
		console.log(`  Presensi Status: "${row.presensi_status}" -> Kondisi: "${kondisi}"`);
		console.log(`  Skor Absensi: ${row.skor_absensi} -> ${skorAbsensiBaru}`);
		console.log(`  Skor Total: ${row.skor_total} -> ${skorTotalBaru}`);

		await conn.query(`
			UPDATE penilaian_harian
			SET sumber_absensi = 'absensi',
			    nilai_kondisi = ?,
			    skor_absensi = ?,
			    skor_total = ?
			WHERE id = ?
		`, [kondisi, skorAbsensiBaru, skorTotalBaru, row.id]);

		fixedCount++;
	}

	// Also fix any row where skor_kegiatan = 100 AND skor_absensi = 100 AND skor_total != 100
	const [mathMismatches] = await conn.query(`
		SELECT id, pegawai_id, DATE_FORMAT(tanggal, '%Y-%m-%d') as tgl,
		       skor_kegiatan, skor_absensi, skor_total
		FROM penilaian_harian
		WHERE status IN ('submitted', 'approved')
		  AND skor_absensi > 0
		  AND ABS(skor_total - ((skor_kegiatan * 0.6) + (skor_absensi * 0.4))) > 0.01
	`);

	console.log(`Found ${mathMismatches.length} mathematical score mismatches.`);
	for (const row of mathMismatches) {
		const correctTotal = calculateSkorTotal(row.skor_kegiatan, row.skor_absensi, 60);
		console.log(`Fixing math mismatch row ID ${row.id}: total ${row.skor_total} -> ${correctTotal}`);
		await conn.query(`UPDATE penilaian_harian SET skor_total = ? WHERE id = ?`, [correctTotal, row.id]);
		fixedCount++;
	}

	console.log(`=== Done. Repaired ${fixedCount} rows successfully ===`);
	await conn.end();
}

run().catch((err) => {
	console.error("Migration error:", err);
	process.exit(1);
});
