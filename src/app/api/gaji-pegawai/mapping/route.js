import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery } from "@/lib/db-helper";

// Pastikan tabel siap
async function ensureTables() {
	await rawQuery(`
		CREATE TABLE IF NOT EXISTS gaji_kategori_jenis (
			id INT PRIMARY KEY AUTO_INCREMENT,
			nama VARCHAR(100) NOT NULL UNIQUE,
			urutan INT NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
	`);

	await rawQuery(`
		CREATE TABLE IF NOT EXISTS gaji_pegawai_mapping (
			nik VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci PRIMARY KEY,
			kategori_id INT NOT NULL,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			INDEX idx_kategori_id (kategori_id)
		)
	`);

	const count = await rawQuery(`SELECT COUNT(*) as cnt FROM gaji_kategori_jenis`);
	if (count[0]?.cnt === 0) {
		await rawQuery(`
			INSERT IGNORE INTO gaji_kategori_jenis (id, nama, urutan) VALUES 
			(1, 'Nakes', 1),
			(2, 'Apoteker', 2),
			(3, 'Administrasi', 3),
			(4, 'Radiologi', 4)
		`);
	}
}

// GET - Ambil list kategori dan list pegawai kontrak
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		await ensureTables();

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const departemen = searchParams.get("departemen") || "";
		const kategori_id = searchParams.get("kategori_id") || "";
		const hanya_2018 = searchParams.get("hanya_2018") !== "false"; // default true

		// Ambil list kategori
		const kategoriList = await rawQuery(
			`SELECT * FROM gaji_kategori_jenis ORDER BY urutan ASC, nama ASC`
		);

		// Bangun query pegawai
		let whereClause = "WHERE p.stts_kerja NOT IN ('POL', 'PNS') AND p.stts_aktif = 'AKTIF'";
		const params = [];

		if (search) {
			whereClause += " AND (p.nama LIKE ? OR p.nik LIKE ?)";
			params.push(`%${search}%`, `%${search}%`);
		}

		if (departemen && departemen !== "all") {
			whereClause += " AND p.departemen = ?";
			params.push(departemen);
		}

		if (kategori_id === "unmapped") {
			whereClause += " AND gpm.kategori_id IS NULL";
		} else if (kategori_id && kategori_id !== "all") {
			whereClause += " AND gpm.kategori_id = ?";
			params.push(parseInt(kategori_id));
		}

		if (hanya_2018) {
			whereClause += " AND (YEAR(p.mulai_kontrak) >= 2018 OR p.mulai_kontrak IS NULL)";
		}

		const pegawaiList = await rawQuery(
			`
			SELECT 
				p.nik,
				p.nama,
				p.jbtn as jabatan,
				p.departemen,
				d.nama as nama_departemen,
				p.mulai_kontrak,
				gpm.kategori_id,
				gkj.nama as nama_kategori,
				gkj.urutan as kategori_urutan
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN gaji_pegawai_mapping gpm ON p.nik = gpm.nik
			LEFT JOIN gaji_kategori_jenis gkj ON gpm.kategori_id = gkj.id
			${whereClause}
			ORDER BY p.mulai_kontrak ASC, p.nama ASC
		`,
			params
		);

		return NextResponse.json({
			status: "success",
			kategori: kategoriList,
			pegawai: pegawaiList,
		});
	} catch (error) {
		console.error("Error in GET /api/gaji-pegawai/mapping:", error);
		return NextResponse.json(
			{ status: "error", message: "Gagal memuat data mapping" },
			{ status: 500 }
		);
	}
}

// POST - Aksi CRUD kategori & simpan mapping
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		await ensureTables();
		const body = await request.json();
		const { action } = body;

		if (action === "add_kategori") {
			const { nama, urutan } = body;
			if (!nama || !nama.trim()) {
				return NextResponse.json(
					{ status: "error", message: "Nama kategori wajib diisi" },
					{ status: 400 }
				);
			}
			await rawQuery(
				`INSERT INTO gaji_kategori_jenis (nama, urutan) VALUES (?, ?)`,
				[nama.trim(), parseInt(urutan) || 0]
			);
			return NextResponse.json({ status: "success", message: "Kategori berhasil ditambahkan" });
		}

		if (action === "update_kategori") {
			const { id, nama, urutan } = body;
			if (!id || !nama || !nama.trim()) {
				return NextResponse.json(
					{ status: "error", message: "Data kategori tidak valid" },
					{ status: 400 }
				);
			}
			await rawQuery(
				`UPDATE gaji_kategori_jenis SET nama = ?, urutan = ? WHERE id = ?`,
				[nama.trim(), parseInt(urutan) || 0, id]
			);
			return NextResponse.json({ status: "success", message: "Kategori berhasil diperbarui" });
		}

		if (action === "delete_kategori") {
			const { id } = body;
			if (!id) {
				return NextResponse.json(
					{ status: "error", message: "ID kategori wajib diisi" },
					{ status: 400 }
				);
			}
			await rawQuery(`DELETE FROM gaji_pegawai_mapping WHERE kategori_id = ?`, [id]);
			await rawQuery(`DELETE FROM gaji_kategori_jenis WHERE id = ?`, [id]);
			return NextResponse.json({ status: "success", message: "Kategori berhasil dihapus" });
		}

		if (action === "set_mapping") {
			const { nik_list, kategori_id } = body;
			if (!Array.isArray(nik_list) || nik_list.length === 0) {
				return NextResponse.json(
					{ status: "error", message: "Pilih minimal satu pegawai" },
					{ status: 400 }
				);
			}

			if (!kategori_id) {
				// Hapus mapping jika kategori_id kosong/null
				const placeholders = nik_list.map(() => "?").join(",");
				await rawQuery(
					`DELETE FROM gaji_pegawai_mapping WHERE nik IN (${placeholders})`,
					nik_list
				);
				return NextResponse.json({
					status: "success",
					message: `Mapping untuk ${nik_list.length} pegawai telah dihapus`,
				});
			}

			// Upsert mapping
			for (const nik of nik_list) {
				await rawQuery(
					`
					INSERT INTO gaji_pegawai_mapping (nik, kategori_id) 
					VALUES (?, ?) 
					ON DUPLICATE KEY UPDATE kategori_id = ?
				`,
					[nik, kategori_id, kategori_id]
				);
			}

			return NextResponse.json({
				status: "success",
				message: `Mapping ${nik_list.length} pegawai berhasil disimpan`,
			});
		}

		return NextResponse.json({ status: "error", message: "Action tidak dikenal" }, { status: 400 });
	} catch (error) {
		console.error("Error in POST /api/gaji-pegawai/mapping:", error);
		return NextResponse.json(
			{ status: "error", message: error.message || "Gagal memproses aksi mapping" },
			{ status: 500 }
		);
	}
}
