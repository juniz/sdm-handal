import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery } from "@/lib/db-helper";

/**
 * @route POST /api/gaji/generate
 * @description Generate data gaji pegawai berdasarkan gaji pokok (gapok) saat ini
 * @body { periode_bulan, periode_tahun }
 */
export async function POST(request) {
    try {
        // Cek auth
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { periode_bulan, periode_tahun } = body;

        // Validasi input
        if (!periode_bulan || !periode_tahun) {
            return NextResponse.json(
                { status: "error", message: "Periode bulan dan tahun harus diisi" },
                { status: 400 }
            );
        }

        // Generate gaji: Insert dari tabel pegawai ke gaji_pegawai
        // Jika data sudah ada (duplicate key), update nilai gaji dan uploaded_by
        const query = `
            INSERT INTO gaji_pegawai (nik, periode_tahun, periode_bulan, jenis, gaji, uploaded_by)
            SELECT 
                nik, 
                ? as periode_tahun, 
                ? as periode_bulan, 
                'Gaji' as jenis, 
                gapok, 
                ? as uploaded_by
            FROM pegawai 
            WHERE stts_aktif = 'AKTIF'
            ON DUPLICATE KEY UPDATE 
                gaji = VALUES(gaji),
                uploaded_by = VALUES(uploaded_by),
                updated_at = NOW();
        `;

        await rawQuery(query, [
            parseInt(periode_tahun), 
            parseInt(periode_bulan), 
            user.username // Asumsi username adalah NIK atau identifier user
        ]);

        return NextResponse.json({
            status: "success",
            message: `Gaji periode ${periode_bulan}-${periode_tahun} berhasil digenerate`
        });

    } catch (error) {
        console.error("[API] Error generating gaji:", error);
        return NextResponse.json(
            { 
                status: "error", 
                message: "Gagal generate gaji",
                error: process.env.NODE_ENV === "development" ? error.message : undefined
            },
            { status: 500 }
        );
    }
}
