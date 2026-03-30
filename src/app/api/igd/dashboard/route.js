import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get("date"); // YYYY-MM-DD
    const shiftFilter = searchParams.get("shift"); // Pagi, Siang, Malam

    let whereClause = "WHERE rp.kd_poli = 'IGDK'";
    let dateCondition = "AND rp.tgl_registrasi = CURDATE()";

    if (dateFilter) {
      dateCondition = `AND rp.tgl_registrasi = '${dateFilter}'`;
    }

    let shiftCondition = "";
    if (shiftFilter) {
      if (shiftFilter === "Pagi") {
        shiftCondition = "AND rp.jam_reg BETWEEN '07:00:00' AND '14:00:00'";
      } else if (shiftFilter === "Siang") {
        shiftCondition = "AND rp.jam_reg BETWEEN '14:00:01' AND '21:00:00'";
      } else if (shiftFilter === "Malam") {
        shiftCondition = "AND (rp.jam_reg >= '21:00:01' OR rp.jam_reg < '07:00:00')";
      }
    }

    // 1. KPI Summary
    // - Total Visits
    // - Served Patients (Status = 'Sudah')
    // - Critical Patients (Status = 'Dirawat' or 'Dirujuk')
    // - Avg Wait Time (Diff between jam_reg and jam_rawat from pemeriksaan_ralan)
    const sqlSummary = `
      SELECT
        COUNT(*) as total_visits,
        SUM(CASE WHEN rp.stts = 'Sudah' THEN 1 ELSE 0 END) as served_patients,
        SUM(CASE WHEN rp.stts IN ('Dirawat', 'Dirujuk') THEN 1 ELSE 0 END) as critical_patients,
        AVG(
          CASE 
            WHEN pr.jam_rawat IS NOT NULL AND pr.jam_rawat > rp.jam_reg 
            THEN TIMEDIFF(pr.jam_rawat, rp.jam_reg) 
            ELSE NULL 
          END
        ) as avg_wait_time
      FROM reg_periksa rp
      LEFT JOIN pemeriksaan_ralan pr ON rp.no_rawat = pr.no_rawat
      ${whereClause} ${dateCondition} ${shiftCondition}
    `;

    // 2. Hourly Trend (for the selected date)
    const sqlHourlyTrend = `
      SELECT 
        HOUR(rp.jam_reg) as hour,
        COUNT(*) as total
      FROM reg_periksa rp
      ${whereClause} ${dateCondition} ${shiftCondition}
      GROUP BY HOUR(rp.jam_reg)
      ORDER BY hour ASC
    `;

    // 3. Daily Trend (Last 7 Days) - Ignoring shift filter for broader context
    const sqlDailyTrend = `
      SELECT 
        DATE_FORMAT(rp.tgl_registrasi, '%Y-%m-%d') as date,
        COUNT(*) as total
      FROM reg_periksa rp
      ${whereClause} 
      AND rp.tgl_registrasi >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(rp.tgl_registrasi)
      ORDER BY date ASC
    `;

    // 4. Top Diagnoses
    const sqlTopDiagnoses = `
      SELECT 
        p.nm_penyakit as diagnosis,
        COUNT(*) as total
      FROM reg_periksa rp
      JOIN diagnosa_pasien dp ON rp.no_rawat = dp.no_rawat
      JOIN penyakit p ON dp.kd_penyakit = p.kd_penyakit
      ${whereClause} ${dateCondition} ${shiftCondition}
      GROUP BY p.nm_penyakit
      ORDER BY total DESC
      LIMIT 5
    `;

    // 5. Triage / Patient Status Distribution
    // Using stts as a proxy for Triage/Outcome since explicit triage table is unknown
    const sqlPatientStatus = `
      SELECT 
        rp.stts as status,
        COUNT(*) as total
      FROM reg_periksa rp
      ${whereClause} ${dateCondition} ${shiftCondition}
      GROUP BY rp.stts
    `;

    const [summary, hourlyTrend, dailyTrend, topDiagnoses, patientStatus] = await Promise.all([
      query(sqlSummary),
      query(sqlHourlyTrend),
      query(sqlDailyTrend),
      query(sqlTopDiagnoses),
      query(sqlPatientStatus),
    ]);

    // Process Summary Data
    const summaryData = summary[0] || { 
      total_visits: 0, 
      served_patients: 0, 
      critical_patients: 0, 
      avg_wait_time: 0 
    };

    // Format wait time from seconds/decimal to minutes
    // TIMEDIFF returns time format, AVG might return decimal seconds or similar depending on DB
    // Assuming MySQL returns decimal seconds or we need to handle it.
    // Actually TIMEDIFF returns TIME. AVG(TIME) returns a number.
    // Let's assume it returns seconds or just use mock if complex.
    // Better query for wait time: AVG(TIME_TO_SEC(TIMEDIFF(pr.jam_rawat, rp.jam_reg))) / 60
    
    // Let's refine the query for wait time to be safe
    const sqlWaitTime = `
      SELECT 
        AVG(TIME_TO_SEC(TIMEDIFF(pr.jam_rawat, rp.jam_reg))) / 60 as avg_minutes
      FROM reg_periksa rp
      JOIN pemeriksaan_ralan pr ON rp.no_rawat = pr.no_rawat
      ${whereClause} ${dateCondition} ${shiftCondition}
      AND pr.jam_rawat > rp.jam_reg
    `;
    
    const waitTimeResult = await query(sqlWaitTime);
    const avgWaitTime = waitTimeResult[0]?.avg_minutes ? Math.round(waitTimeResult[0].avg_minutes) : 0;

    // Fill missing hours for hourly trend
    const filledHourlyTrend = Array.from({ length: 24 }, (_, i) => {
      const found = hourlyTrend.find(h => h.hour === i);
      return { hour: i, total: found ? found.total : 0 };
    });

    // Fill missing days for daily trend
    const filledDailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = dailyTrend.find(t => t.date === dateStr);
      filledDailyTrend.push({
        date: dateStr,
        total: found ? found.total : 0
      });
    }

    // Mock data for Bed Occupancy & Satisfaction (as tables are missing)
    const bedOccupancy = {
      total: 20,
      occupied: Math.floor(Math.random() * 15) + 5, // Random 5-20
    };
    
    const patientSatisfaction = {
      score: 4.5, // Out of 5
      respondents: Math.floor(summaryData.total_visits * 0.4),
    };

    return NextResponse.json({
      summary: {
        ...summaryData,
        avg_wait_time: avgWaitTime,
        bed_occupancy: bedOccupancy,
        patient_satisfaction: patientSatisfaction,
      },
      hourly_trend: filledHourlyTrend,
      daily_trend: filledDailyTrend,
      top_diagnoses: topDiagnoses,
      patient_status: patientStatus,
      last_updated: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error fetching IGD data:", error);
    return NextResponse.json(
      { error: "Failed to fetch IGD data" },
      { status: 500 }
    );
  }
}
