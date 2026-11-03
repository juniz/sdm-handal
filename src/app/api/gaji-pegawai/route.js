import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { select, rawQuery } from "@/lib/db-helper";

/**
 * @route GET /api/gaji-pegawai
 * @description Ambil data gaji pegawai dengan pagination, search, dan filter
 */
export async function GET(request) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const bulan = searchParams.get("bulan");
        const tahun = searchParams.get("tahun");
        const jenis = searchParams.get("jenis");
        const departemen = searchParams.get("departemen");
        
        const offset = (page - 1) * limit;

        // Auto-sync final rekap_bulanan ke gaji_pegawai jika ada data final yang belum masuk
        try {
            await rawQuery(`
                INSERT INTO gaji_pegawai (nik, periode_tahun, periode_bulan, jenis, gaji, uploaded_by)
                SELECT 
                    p.nik, 
                    rb.tahun AS periode_tahun, 
                    rb.bulan AS periode_bulan, 
                    'Jasa' AS jenis, 
                    rb.nominal_jasa_final AS gaji, 
                    COALESCE(admin.nik, p.nik) AS uploaded_by
                FROM rekap_bulanan rb
                JOIN pegawai p ON rb.pegawai_id = p.id
                LEFT JOIN pegawai admin ON admin.id = rb.locked_by
                WHERE rb.status_rekap = 'final'
                ON DUPLICATE KEY UPDATE 
                    gaji = VALUES(gaji),
                    updated_at = NOW()
            `);
        } catch (syncErr) {
            console.error("[API] Error syncing final rekap to gaji_pegawai:", syncErr);
        }

        // Base query conditions
        let whereClause = "WHERE 1=1";
        whereClause += " AND p.stts_kerja <> 'POL' AND p.stts_kerja <> 'PNS'";
        const params = [];

        if (bulan && bulan !== "all") {
            whereClause += " AND gp.periode_bulan = ?";
            params.push(bulan);
        }

        if (tahun && tahun !== "all") {
            whereClause += " AND gp.periode_tahun = ?";
            params.push(tahun);
        }

        if (jenis && jenis !== "all") {
            whereClause += " AND gp.jenis = ?";
            params.push(jenis);
        }

        if (search) {
            whereClause += " AND (gp.nik LIKE ? OR p.nama LIKE ?)";
            params.push(`%${search}%`, `%${search}%`);
        }

        if (departemen && departemen !== "all") {
            whereClause += " AND p.departemen = ?";
            params.push(departemen);
        }

        // Count total queries
        const countQuery = `
            SELECT COUNT(*) as total
            FROM gaji_pegawai gp
            JOIN pegawai p ON gp.nik = p.nik
            ${whereClause}
        `;

        const countResult = await rawQuery(countQuery, params);
        const total = countResult[0].total;
        const totalPages = Math.ceil(total / limit);

        // Fetch data
        const dataQuery = `
            SELECT 
                gp.id,
                gp.nik,
                p.nama,
                gp.periode_bulan,
                gp.periode_tahun,
                gp.jenis,
                gp.gaji,
                gp.uploaded_by,
                gp.uploaded_at
            FROM gaji_pegawai gp
            JOIN pegawai p ON gp.nik = p.nik
            ${whereClause}
            ORDER BY p.nik ASC
            LIMIT ? OFFSET ?
        `;

        const data = await rawQuery(dataQuery, [...params, limit, offset]);

        // Ambil settings untuk BPJS
        const settingsQuery = `SELECT * FROM penggajian_settings ORDER BY id DESC LIMIT 1`;
        const settingsData = await rawQuery(settingsQuery);
        const settings = settingsData.length > 0 ? settingsData[0] : null;

        // Terapkan potongan BPJS jika tipe GAJI
        const formattedData = data.map((item) => {
            if (item.jenis && item.jenis.toString().trim().toUpperCase() === "GAJI" && settings) {
                const nominalBPJSKes = parseFloat(settings.bpjs_kesehatan_nominal) || 0;
                const nominalBPJSTK = parseFloat(settings.bpjs_ketenagakerjaan_nominal) || 0;
                
                // Kurangi nominal gaji dengan BPJS
                return {
                    ...item,
                    gaji_original: item.gaji,
                    gaji: parseFloat(item.gaji) - (nominalBPJSKes + nominalBPJSTK),
                    bpjs_kesehatan_nominal: nominalBPJSKes,
                    bpjs_ketenagakerjaan_nominal: nominalBPJSTK
                };
            }
            return item;
        });

        return NextResponse.json({
            status: "success",
            data: formattedData,
            pagination: {
                page,
                limit,
                total,
                totalPages
            }
        });

    } catch (error) {
        console.error("[API] Error fetching gaji pegawai:", error);
        return NextResponse.json(
            { 
                status: "error", 
                message: "Gagal mengambil data gaji pegawai",
                error: process.env.NODE_ENV === "development" ? error.message : undefined 
            }, 
            { status: 500 }
        );
    }
}
