import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery } from "@/lib/db-helper";

/**
 * @route GET /api/penggajian-settings
 * @description Ambil data pengaturan penggajian terbaru
 */
export async function GET() {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const data = await rawQuery(`SELECT * FROM penggajian_settings ORDER BY id DESC LIMIT 1`);
        
        return NextResponse.json({
            status: "success",
            data: data.length > 0 ? data[0] : null
        });
    } catch (error) {
        console.error("[API] Error fetching penggajian settings:", error);
        return NextResponse.json(
            { status: "error", message: "Gagal mengambil data pengaturan" },
            { status: 500 }
        );
    }
}

/**
 * @route POST /api/penggajian-settings
 * @description Simpan atau perbarui data pengaturan penggajian
 */
export async function POST(request) {
    try {
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const {
            karumkit_nama,
            karumkit_pangkat,
            karumkit_nip,
            bendahara_nama,
            bendahara_pangkat,
            bendahara_nip,
            bpjs_kesehatan_nominal,
            bpjs_ketenagakerjaan_nominal
        } = body;

        // Validasi sederhana
        if (!karumkit_nama || !bendahara_nama) {
            return NextResponse.json(
                { status: "error", message: "Nama Karumkit dan Bendahara wajib diisi" },
                { status: 400 }
            );
        }

        // Selalu insert baru atau update yang terakhir? User minta "update", tapi biasanya settings disimpan sebagai row baru atau di-overwrite ID 1.
        // Kita gunakan pendekatan: jika ada ID 1, update. Jika tidak, insert.
        const checkExist = await rawQuery(`SELECT id FROM penggajian_settings LIMIT 1`);
        
        let query = "";
        let values = [];

        if (checkExist.length > 0) {
            // Update the existing row (assuming the first one found)
            const id = checkExist[0].id;
            query = `
                UPDATE penggajian_settings 
                SET 
                    karumkit_nama = ?, 
                    karumkit_pangkat = ?, 
                    karumkit_nip = ?, 
                    bendahara_nama = ?, 
                    bendahara_pangkat = ?, 
                    bendahara_nip = ?, 
                    bpjs_kesehatan_nominal = ?, 
                    bpjs_ketenagakerjaan_nominal = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;
            values = [
                karumkit_nama, karumkit_pangkat, karumkit_nip,
                bendahara_nama, bendahara_pangkat, bendahara_nip,
                bpjs_kesehatan_nominal, bpjs_ketenagakerjaan_nominal,
                id
            ];
        } else {
            // Insert initial row
            query = `
                INSERT INTO penggajian_settings 
                (karumkit_nama, karumkit_pangkat, karumkit_nip, bendahara_nama, bendahara_pangkat, bendahara_nip, bpjs_kesehatan_nominal, bpjs_ketenagakerjaan_nominal)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            values = [
                karumkit_nama, karumkit_pangkat, karumkit_nip,
                bendahara_nama, bendahara_pangkat, bendahara_nip,
                bpjs_kesehatan_nominal, bpjs_ketenagakerjaan_nominal
            ];
        }

        await rawQuery(query, values);

        return NextResponse.json({
            status: "success",
            message: "Pengaturan berhasil diperbarui"
        });
    } catch (error) {
        console.error("[API] Error updating penggajian settings:", error);
        return NextResponse.json(
            { status: "error", message: "Gagal memperbarui pengaturan" },
            { status: 500 }
        );
    }
}
