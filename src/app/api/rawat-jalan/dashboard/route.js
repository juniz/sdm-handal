import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const poliFilters = searchParams.getAll("poli");
    
    let poliCondition = "";
    let poliConditionRp = "";
    let queryParams = [];

    if (poliFilters.length > 0) {
      const placeholders = poliFilters.map(() => "?").join(",");
      poliCondition = ` AND kd_poli IN (${placeholders})`;
      poliConditionRp = ` AND rp.kd_poli IN (${placeholders})`;
      // For queries that use the filter, we need to pass the params. 
      // Since we use Promise.all and our `query` function might just take string or array,
      // it's safer to build the string if we are careful, or use proper parameterized arrays.
      // Assuming `query(sql, params)` is supported by `@/lib/db`. Let's check `query` implementation if possible, 
      // but usually `query(sql, values)` works.
    }

    // Since we don't know the exact db wrapper, to be safe with dynamic IN clause without values array if it's a simple wrapper:
    // Let's escape the poliFilters safely.
    const safePoliList = poliFilters.map(p => `'${p.replace(/'/g, "''")}'`).join(",");
    const filterSql = poliFilters.length > 0 ? ` AND kd_poli IN (${safePoliList})` : "";
    const filterSqlRp = poliFilters.length > 0 ? ` AND rp.kd_poli IN (${safePoliList})` : "";

    // 0. Get all active polyclinics for the filter dropdown
    const sqlAllPoli = `SELECT kd_poli, nm_poli FROM poliklinik WHERE status = '1' ORDER BY nm_poli ASC`;

    // 1. KPI Summary (Today)
    const sqlSummary = `
      SELECT
        COUNT(*) as total_visits,
        SUM(CASE WHEN stts = 'Sudah' THEN 1 ELSE 0 END) as served_patients,
        SUM(CASE WHEN stts = 'Batal' THEN 1 ELSE 0 END) as cancelled_patients,
        SUM(biaya_reg) as total_revenue
      FROM reg_periksa
      WHERE tgl_registrasi = CURDATE() ${filterSql}
    `;

    // 2. Visit Trend (Last 7 Days)
    const sqlTrend = `
      SELECT 
        DATE_FORMAT(tgl_registrasi, '%Y-%m-%d') as date,
        COUNT(*) as total
      FROM reg_periksa
      WHERE tgl_registrasi >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) ${filterSql}
      GROUP BY DATE(tgl_registrasi)
      ORDER BY date ASC
    `;

    // 3. Top Polyclinics (Today)
    const sqlTopPoli = `
      SELECT 
        p.nm_poli,
        COUNT(*) as total
      FROM reg_periksa rp
      JOIN poliklinik p ON rp.kd_poli = p.kd_poli
      WHERE rp.tgl_registrasi = CURDATE() ${filterSqlRp}
      GROUP BY p.nm_poli
      ORDER BY total DESC
      LIMIT 5
    `;

    // 4. Doctor Performance (Today)
    const sqlTopDoctors = `
      SELECT 
        d.nm_dokter,
        COUNT(*) as total
      FROM reg_periksa rp
      JOIN dokter d ON rp.kd_dokter = d.kd_dokter
      WHERE rp.tgl_registrasi = CURDATE() ${filterSqlRp}
      GROUP BY d.nm_dokter
      ORDER BY total DESC
      LIMIT 5
    `;

    // 5. Patient Type (Lama vs Baru)
    const sqlPatientType = `
      SELECT 
        stts_daftar,
        COUNT(*) as total
      FROM reg_periksa
      WHERE tgl_registrasi = CURDATE() ${filterSql}
      GROUP BY stts_daftar
    `;

    // 6. Guarantor Composition (Penjamin)
    const sqlGuarantor = `
      SELECT 
        pj.png_jawab as penjamin,
        COUNT(*) as total
      FROM reg_periksa rp
      JOIN penjab pj ON rp.kd_pj = pj.kd_pj
      WHERE rp.tgl_registrasi = CURDATE() ${filterSqlRp}
      GROUP BY pj.png_jawab
      ORDER BY total DESC
    `;

    const [allPoli, summary, trend, topPoli, topDoctors, patientType, guarantor] = await Promise.all([
      query(sqlAllPoli),
      query(sqlSummary),
      query(sqlTrend),
      query(sqlTopPoli),
      query(sqlTopDoctors),
      query(sqlPatientType),
      query(sqlGuarantor),
    ]);

    // Format Trend Data (Fill missing dates)
    const formattedTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = trend.find(t => t.date === dateStr);
      formattedTrend.push({
        date: dateStr,
        total: found ? found.total : 0
      });
    }

    return NextResponse.json({
      all_poli: allPoli,
      summary: summary[0] || { total_visits: 0, served_patients: 0, cancelled_patients: 0, total_revenue: 0 },
      trend: formattedTrend,
      top_poli: topPoli,
      top_doctors: topDoctors,
      patient_type: patientType,
      guarantor: guarantor,
      last_updated: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Error fetching rawat jalan data:", error);
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
