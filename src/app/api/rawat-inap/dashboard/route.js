import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
	try {
		// 1. Fetch Detailed Patient List (Latest 30 Days or Active)
		const sqlPatients = `
      SELECT 
        ki.no_rawat,
        rp.no_rkm_medis,
        p.nm_pasien,
        ki.kd_kamar,
        DATE_FORMAT(ki.tgl_masuk, '%Y-%m-%d') as tgl_masuk,
        ki.jam_masuk,
        DATE_FORMAT(ki.tgl_keluar, '%Y-%m-%d') as tgl_keluar,
        ki.jam_keluar,
        ki.diagnosa_awal,
        ki.ttl_biaya,
        ki.stts_pulang,
        rp.kd_pj,
        pj.png_jawab AS penjab_nama,
        rp.stts AS status_reg
      FROM kamar_inap ki
      JOIN reg_periksa rp ON ki.no_rawat = rp.no_rawat
      LEFT JOIN pasien p ON rp.no_rkm_medis = p.no_rkm_medis
      LEFT JOIN penjab pj ON rp.kd_pj = pj.kd_pj
      WHERE 
        ki.tgl_masuk >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) 
        OR ki.stts_pulang = '-'
        OR ki.stts_pulang = 'Pindah Kamar'
      ORDER BY ki.tgl_masuk DESC, ki.jam_masuk DESC
      LIMIT 1000
    `;

		// 2. Fetch Hourly Statistics for Today
		const sqlHourlyStats = `
      SELECT 
        HOUR(jam_masuk) as hour, 
        COUNT(*) as admissions 
      FROM kamar_inap 
      WHERE tgl_masuk = CURDATE() 
      GROUP BY HOUR(jam_masuk)
    `;

		const sqlHourlyDischarges = `
      SELECT 
        HOUR(jam_keluar) as hour, 
        COUNT(*) as discharges 
      FROM kamar_inap 
      WHERE tgl_keluar = CURDATE() 
        AND stts_pulang NOT IN ('-', 'Pindah Kamar')
      GROUP BY HOUR(jam_keluar)
    `;

		// 3. Fetch Daily Statistics for Last 30 Days (Extended Range)
		const sqlDailyAdmissions = `
      SELECT 
        DATE_FORMAT(tgl_masuk, '%Y-%m-%d') as date, 
        COUNT(*) as admissions 
      FROM kamar_inap 
      WHERE tgl_masuk >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) 
      GROUP BY DATE(tgl_masuk)
      ORDER BY date ASC
    `;

		const sqlDailyDischarges = `
      SELECT 
        DATE_FORMAT(tgl_keluar, '%Y-%m-%d') as date, 
        COUNT(*) as discharges 
      FROM kamar_inap 
      WHERE tgl_keluar >= DATE_SUB(CURDATE(), INTERVAL 29 DAY) 
        AND stts_pulang NOT IN ('-', 'Pindah Kamar')
      GROUP BY DATE(tgl_keluar)
      ORDER BY date ASC
    `;

		// 4. Fetch Comparison Statistics (Today vs Yesterday)
		const sqlComparison = `
      SELECT
        (SELECT COUNT(*) FROM kamar_inap WHERE tgl_masuk = CURDATE()) as admissions_today,
        (SELECT COUNT(*) FROM kamar_inap WHERE tgl_masuk = DATE_SUB(CURDATE(), INTERVAL 1 DAY)) as admissions_yesterday,
        (SELECT COUNT(*) FROM kamar_inap WHERE tgl_keluar = CURDATE() AND stts_pulang NOT IN ('-', 'Pindah Kamar')) as discharges_today,
        (SELECT COUNT(*) FROM kamar_inap WHERE tgl_keluar = DATE_SUB(CURDATE(), INTERVAL 1 DAY) AND stts_pulang NOT IN ('-', 'Pindah Kamar')) as discharges_yesterday,
        (SELECT COUNT(*) FROM kamar_inap WHERE stts_pulang = '-') as total_active
    `;

		// Execute queries in parallel
		const [
			patients,
			hourlyAdmissions,
			hourlyDischarges,
			dailyAdmissions,
			dailyDischarges,
			comparison,
		] = await Promise.all([
			query(sqlPatients),
			query(sqlHourlyStats),
			query(sqlHourlyDischarges),
			query(sqlDailyAdmissions),
			query(sqlDailyDischarges),
			query(sqlComparison),
		]);

		// Format Patients Data
		const formattedPatients = patients.map((row) => ({
			...row,
			ttl_biaya: Number(row.ttl_biaya) || 0,
		}));

		// Process Hourly Data
		const hourlyData = Array.from({ length: 24 }, (_, i) => ({
			hour: i,
			admissions: 0,
			discharges: 0,
		}));

		hourlyAdmissions.forEach((row) => {
			if (hourlyData[row.hour])
				hourlyData[row.hour].admissions = row.admissions;
		});

		hourlyDischarges.forEach((row) => {
			if (hourlyData[row.hour])
				hourlyData[row.hour].discharges = row.discharges;
		});

		// Process Daily Data (Last 30 Days)
		const dailyData = [];
		const comparisonData = comparison[0] || {};
		let currentActive = comparisonData.total_active || 0;

		// We need to reconstruct the daily active count history.
		// The currentActive is the count RIGHT NOW.
		// To find the active count at the END of previous days, we need to reverse the flow:
		// Active(Day-1 End) = Active(Day End) - Admissions(Day) + Discharges(Day)

		// First, let's build the full 30-day array with admissions/discharges filled
		for (let i = 0; i < 30; i++) {
			const d = new Date();
			d.setDate(d.getDate() - i);
			const dateStr = d.toISOString().split("T")[0];

			const admissionCount =
				dailyAdmissions.find((r) => r.date === dateStr)?.admissions || 0;
			const dischargeCount =
				dailyDischarges.find((r) => r.date === dateStr)?.discharges || 0;

			dailyData.unshift({
				date: dateStr,
				admissions: admissionCount,
				discharges: dischargeCount,
				total_active: 0, // Placeholder
			});
		}

		// Now calculate total_active backwards
		// We start from the LAST element (today/latest)
		// Note: The 'currentActive' from DB is the LIVE count.
		// For the purpose of the chart, let's assume the last data point (today) ends with the current count.
		// (This is an approximation because 'today' isn't over, but it's the best we have for "current state")

		let runningActive = currentActive;

		// Iterate backwards from the last day (today) to the first day (30 days ago)
		for (let i = dailyData.length - 1; i >= 0; i--) {
			dailyData[i].total_active = runningActive;

			// Calculate previous day's end state
			// Active(Yesterday) = Active(Today) - In(Today) + Out(Today)
			runningActive =
				runningActive + dailyData[i].admissions - dailyData[i].discharges;

			// Safety check: Active count shouldn't be negative (though data inconsistencies might cause it)
			if (runningActive < 0) runningActive = 0;
		}

		return NextResponse.json({
			patients: formattedPatients,
			hourly_stats: hourlyData,
			daily_stats: dailyData,
			comparison: comparisonData,
			last_updated: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Error fetching rawat inap dashboard data:", error);
		return NextResponse.json(
			{ error: "Failed to fetch dashboard data" },
			{ status: 500 },
		);
	}
}
