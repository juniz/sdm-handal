import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery } from "@/lib/db-helper";
import { createConnection } from "@/lib/db";

// GET - Ambil data validasi gaji
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const periode_tahun = searchParams.get("periode_tahun");
		const periode_bulan = searchParams.get("periode_bulan");
		const nik = searchParams.get("nik");

		let query = `
			SELECT 
				gv.*,
				gp.gaji,
				p.nik,
				p.nama,
				p.jbtn,
				p.departemen,
				d.nama as departemen_name,
				signed_by_pegawai.nama as signed_by_name
			FROM gaji_validasi gv
			LEFT JOIN gaji_pegawai gp ON gv.gaji_id = gp.id
			LEFT JOIN pegawai p ON gv.nik = p.nik
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN pegawai signed_by_pegawai ON gv.signed_by = signed_by_pegawai.nik
			WHERE 1=1
		`;

		const params = [];

		if (periode_tahun) {
			query += " AND gv.periode_tahun = ?";
			params.push(parseInt(periode_tahun));
		}

		if (periode_bulan) {
			query += " AND gv.periode_bulan = ?";
			params.push(parseInt(periode_bulan));
		}

		if (nik) {
			query += " AND gv.nik = ?";
			params.push(nik);
		}

		query += " ORDER BY gv.signed_at DESC";

		const result = await rawQuery(query, params);

		return NextResponse.json({
			success: true,
			data: result,
		});
	} catch (error) {
		console.error("Error fetching validasi gaji:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data validasi" },
			{ status: 500 }
		);
	}
}

// POST - Buat validasi gaji baru (tanda tangan pegawai)
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { gaji_id, tanda_tangan, catatan } = await request.json();

		if (!gaji_id || !tanda_tangan) {
			return NextResponse.json(
				{ message: "Gaji ID dan tanda tangan wajib diisi" },
				{ status: 400 }
			);
		}

		// Ambil data gaji
		const gajiData = await rawQuery(
			`
			SELECT gp.*, p.nik
			FROM gaji_pegawai gp
			LEFT JOIN pegawai p ON gp.nik = p.nik
			WHERE gp.id = ?
		`,
			[parseInt(gaji_id)]
		);

		if (gajiData.length === 0) {
			return NextResponse.json(
				{ message: "Data gaji tidak ditemukan" },
				{ status: 404 }
			);
		}

		const gaji = gajiData[0];

		// Validasi: user hanya bisa tanda tangan gaji sendiri
		if (gaji.nik !== user.username) {
			return NextResponse.json(
				{ message: "Anda hanya dapat menandatangani gaji sendiri" },
				{ status: 403 }
			);
		}

		// Cek apakah sudah ada validasi untuk gaji ini
		const existingValidasi = await rawQuery(
			`
			SELECT id FROM gaji_validasi 
			WHERE gaji_id = ? AND signed_by = ?
		`,
			[parseInt(gaji_id), user.username]
		);

		if (existingValidasi.length > 0) {
			return NextResponse.json(
				{ message: "Anda sudah menandatangani gaji ini" },
				{ status: 400 }
			);
		}

		// Insert validasi baru dalam transaction
		const connection = await createConnection();
		await connection.beginTransaction();

		try {
			// Insert validasi baru
			const [insertResult] = await connection.execute(
				`
				INSERT INTO gaji_validasi (
					gaji_id,
					nik,
					periode_tahun,
					periode_bulan,
					jenis,
					tanda_tangan,
					catatan,
					signed_by
				) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
			`,
				[
					parseInt(gaji_id),
					gaji.nik,
					gaji.periode_tahun,
					gaji.periode_bulan,
					gaji.jenis,
					tanda_tangan,
					catatan || null,
					user.username,
				]
			);

			const validasiId = insertResult.insertId;

			// Insert ke history untuk audit trail
			await connection.execute(
				`
				INSERT INTO gaji_validasi_history (
					validasi_id,
					gaji_id,
					nik,
					catatan,
					changed_by,
					change_type
				) VALUES (?, ?, ?, ?, ?, 'CREATE')
			`,
				[
					validasiId,
					parseInt(gaji_id),
					gaji.nik,
					catatan || null,
					user.username,
				]
			);

			await connection.commit();

			return NextResponse.json({
				success: true,
				message: "Tanda tangan berhasil disimpan",
				data: {
					id: validasiId,
				},
			});
		} catch (error) {
			await connection.rollback();
			throw error;
		} finally {
			await connection.end();
		}
	} catch (error) {
		console.error("Error creating validasi gaji:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menyimpan tanda tangan" },
			{ status: 500 }
		);
	}
}

