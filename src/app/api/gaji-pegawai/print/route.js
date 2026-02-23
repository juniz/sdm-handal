import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery } from "@/lib/db-helper";

/**
 * @route GET /api/gaji-pegawai/print
 * @description Ambil data gaji untuk print dengan tanda tangan dari gaji_validasi
 */
export async function GET(request) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const bulan = searchParams.get("bulan");
        const tahun = searchParams.get("tahun");
        const jenis = searchParams.get("jenis") || "Gaji";
        const departemen = searchParams.get("departemen");

        if (!bulan || !tahun) {
            return NextResponse.json(
                { status: "error", message: "Parameter bulan dan tahun wajib diisi" },
                { status: 400 }
            );
        }

        // Base query conditions
        let whereClause = "WHERE gp.periode_bulan = ? AND gp.periode_tahun = ? AND UPPER(TRIM(gp.jenis)) = UPPER(TRIM(?)) AND p.stts_kerja <> 'POL' AND p.stts_kerja <> 'PNS'";
        const queryParams = [parseInt(bulan), parseInt(tahun), jenis];

        if (departemen && departemen !== "all") {
            whereClause += " AND p.departemen = ?";
            queryParams.push(departemen);
        }

        // Query dengan LEFT JOIN ke gaji_validasi untuk ambil tanda tangan
        const dataQuery = `
            SELECT 
                gp.id,
                gp.nik,
                p.nama,
                p.jbtn as jabatan,
                gp.gaji,
                gp.periode_bulan,
                gp.periode_tahun,
                gp.jenis,
                gv.tanda_tangan,
                gv.signed_at
            FROM gaji_pegawai gp
            JOIN pegawai p ON gp.nik = p.nik
            LEFT JOIN gaji_validasi gv ON gp.id = gv.gaji_id
            ${whereClause}
            ORDER BY p.nik ASC
        `;

        const data = await rawQuery(dataQuery, queryParams);

        // Fetch settings
        const settingsQuery = `SELECT * FROM penggajian_settings ORDER BY id DESC LIMIT 1`;
        const settingsData = await rawQuery(settingsQuery);
        const settings = settingsData.length > 0 ? settingsData[0] : null;

        // Hitung total
        const totalGaji = data.reduce((sum, item) => sum + parseFloat(item.gaji || 0), 0);

        return NextResponse.json({
            status: "success",
            data,
            settings,
            summary: {
                totalRecords: data.length,
                totalGaji,
                periode: {
                    bulan: parseInt(bulan),
                    tahun: parseInt(tahun)
                },
                jenis
            }
        });

    } catch (error) {
        console.error("[API] Error fetching gaji print data:", error);
        return NextResponse.json(
            { 
                status: "error", 
                message: "Gagal mengambil data gaji untuk print",
                error: process.env.NODE_ENV === "development" ? error.message : undefined 
            }, 
            { status: 500 }
        );
    }
}
