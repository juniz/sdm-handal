import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery } from "@/lib/db-helper";

// GET - Ambil data gaji
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = user.username;
		const { searchParams } = new URL(request.url);
		const periodeTahun = searchParams.get("periode_tahun");
		const periodeBulan = searchParams.get("periode_bulan");
		const search = searchParams.get("search");


		// Ambil data gaji untuk user yang sedang login
		let whereConditions = ["gp.nik = ?"];
		let queryParams = [userId];

		if (periodeTahun) {
			whereConditions.push("gp.periode_tahun = ?");
			queryParams.push(parseInt(periodeTahun));
		}
		if (periodeBulan) {
			whereConditions.push("gp.periode_bulan = ?");
			queryParams.push(parseInt(periodeBulan));
		}

		// Search hanya berlaku untuk nama/notes, tapi tetap dalam lingkup user ini
		// (optional: jika search digunakan untuk filter catatan dll)
		if (search) {
			// Search logic bisa disesuaikan, tapi karena hanya data sendiri, mungkin tidak terlalu kritikal
			// jika ingin search berdasarkan field lain
		}

		const whereClause = "WHERE " + whereConditions.join(" AND ");

		const gajiData = await rawQuery(
			`
			SELECT 
				gp.*,
				p.nama,
				p.jbtn,
				p.departemen,
				d.nama as departemen_name,
				gv.tanda_tangan
			FROM gaji_pegawai gp
			LEFT JOIN pegawai p ON gp.nik = p.nik
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN gaji_validasi gv ON gp.id = gv.gaji_id
			${whereClause}
			ORDER BY gp.periode_tahun DESC, gp.periode_bulan DESC
		`,
			queryParams
		);

		// Ambil settings untuk BPJS
		const settingsQuery = `SELECT * FROM penggajian_settings ORDER BY id DESC LIMIT 1`;
		const settingsData = await rawQuery(settingsQuery);
		const settings = settingsData.length > 0 ? settingsData[0] : null;

		// Terapkan potongan BPJS jika tipe GAJI
		const formattedGajiData = gajiData.map((item) => {
			if (item.jenis && item.jenis.toString().trim().toUpperCase() === "GAJI" && settings) {
                const nominalBPJSKes = parseFloat(settings.bpjs_kesehatan_nominal) || 0;
                const nominalBPJSTK = parseFloat(settings.bpjs_ketenagakerjaan_nominal) || 0;
                
                // Kurangi nominal gaji dengan BPJS
                return {
                    ...item,
                    gaji_original: item.gaji, // Simpan nilai asli jika dibutuhkan
                    gaji: parseFloat(item.gaji) - (nominalBPJSKes + nominalBPJSTK),
                    bpjs_kesehatan_nominal: nominalBPJSKes,
                    bpjs_ketenagakerjaan_nominal: nominalBPJSTK
                };
			}
			return item;
		});

		return NextResponse.json({
			status: 200,
			message: "Data gaji berhasil diambil",
			data: formattedGajiData,
		});
	} catch (error) {
		console.error("Error fetching gaji:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data gaji" },
			{ status: 500 }
		);
	}
}


