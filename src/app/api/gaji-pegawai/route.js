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

        // Base query conditions
        let whereClause = "WHERE 1=1";
        whereClause += " AND p.stts_kerja <> 'POL' AND p.stts_kerja <> 'PNS'";
        const params = [];

        if (bulan) {
            whereClause += " AND gp.periode_bulan = ?";
            params.push(bulan);
        }

        if (tahun) {
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
