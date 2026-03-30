import { NextResponse } from "next/server";
import { rawQuery, insert, update, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - List pegawai dengan pagination, search, filter
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const departemen = searchParams.get("departemen") || "";
		const stts_aktif = searchParams.get("stts_aktif") || "";
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "20");
		const offset = (page - 1) * limit;

		let whereClause = "WHERE 1=1";
		const params = [];

		if (search) {
			whereClause += " AND (p.nama LIKE ? OR p.nik LIKE ?)";
			params.push(`%${search}%`, `%${search}%`);
		}
		if (departemen) {
			whereClause += " AND p.departemen = ?";
			params.push(departemen);
		}
		if (stts_aktif) {
			whereClause += " AND p.stts_aktif = ?";
			params.push(stts_aktif);
		}

		const countResult = await rawQuery(
			`SELECT COUNT(*) as total FROM pegawai p ${whereClause}`,
			params,
		);
		const total = countResult[0]?.total || 0;
		const totalPages = Math.ceil(total / limit);

		params.push(limit, offset);
		const data = await rawQuery(
			`
			SELECT p.*, d.nama as nama_departemen,
				tkj.threshold_persen,
				tkj.bobot_jabatan,
				tkj.bobot_personal,
				COALESCE(jnj.indek, 0) as jnj_indek,
				COALESCE(kel.indek, 0) as kel_indek,
				COALESCE(res.indek, 0) as res_indek,
				COALESCE(em.indek, 0) as em_indek,
				COALESCE(pend.indek, 0) as pend_indek,
				COALESCE(eval_latest.indek, 0) as eval_indek,
				COALESCE(capai_latest.indek, 0) as capai_indek,
				(
					(
						COALESCE(jnj.indek, 0) + 
						COALESCE(kel.indek, 0) + 
						COALESCE(res.indek, 0) + 
						COALESCE(em.indek, 0)
					) * (COALESCE(tkj.bobot_jabatan, 35.00) / 100)
					+
					(
						COALESCE(pend.indek, 0) +
						COALESCE(eval_latest.indek, 0) +
						COALESCE(capai_latest.indek, 0)
					) * (COALESCE(tkj.bobot_personal, 65.00) / 100)
				) AS total_index_remunerasi
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN jnj_jabatan jnj ON p.jnj_jabatan = jnj.kode
			LEFT JOIN kelompok_jabatan kel ON p.kode_kelompok = kel.kode_kelompok
			LEFT JOIN threshold_kelompok_jabatan tkj ON p.kode_kelompok = tkj.kode_kelompok
			LEFT JOIN resiko_kerja res ON p.kode_resiko = res.kode_resiko
			LEFT JOIN emergency_index em ON p.kode_emergency = em.kode_emergency
			LEFT JOIN pendidikan pend ON p.pendidikan = pend.tingkat
			
			-- Join with latest evaluation index
			LEFT JOIN (
				SELECT ekp.id, ek.indek
				FROM evaluasi_kinerja_pegawai ekp
				JOIN evaluasi_kinerja ek ON ekp.kode_evaluasi = ek.kode_evaluasi
				WHERE (ekp.id, ekp.tahun, ekp.bulan) IN (
					SELECT id, MAX(tahun), MAX(bulan)
					FROM evaluasi_kinerja_pegawai
					GROUP BY id
				)
			) eval_latest ON p.id = eval_latest.id

			-- Join with latest achievement index
			LEFT JOIN (
				SELECT pkp.id, pk.indek
				FROM pencapaian_kinerja_pegawai pkp
				JOIN pencapaian_kinerja pk ON pkp.kode_pencapaian = pk.kode_pencapaian
				WHERE (pkp.id, pkp.tahun, pkp.bulan) IN (
					SELECT id, MAX(tahun), MAX(bulan)
					FROM pencapaian_kinerja_pegawai
					GROUP BY id
				)
			) capai_latest ON p.id = capai_latest.id

			${whereClause}
			ORDER BY p.id ASC
			LIMIT ? OFFSET ?
		`,
			params,
		);

		// Calculate total aggregate index (using the new formula) for all active employees
		const totalAggregateResult = await rawQuery(`
			SELECT SUM(
				(
					COALESCE(jnj.indek, 0) + 
					COALESCE(kel.indek, 0) + 
					COALESCE(res.indek, 0) + 
					COALESCE(em.indek, 0)
				) * (COALESCE(tkj.bobot_jabatan, 35.00) / 100)
				+
				(
					COALESCE(pend.indek, 0) +
					COALESCE(eval_latest.indek, 0) +
					COALESCE(capai_latest.indek, 0)
				) * (COALESCE(tkj.bobot_personal, 65.00) / 100)
			) as total_aggregate
			FROM pegawai p
			LEFT JOIN jnj_jabatan jnj ON p.jnj_jabatan = jnj.kode
			LEFT JOIN kelompok_jabatan kel ON p.kode_kelompok = kel.kode_kelompok
			LEFT JOIN threshold_kelompok_jabatan tkj ON p.kode_kelompok = tkj.kode_kelompok
			LEFT JOIN resiko_kerja res ON p.kode_resiko = res.kode_resiko
			LEFT JOIN emergency_index em ON p.kode_emergency = em.kode_emergency
			LEFT JOIN pendidikan pend ON p.pendidikan = pend.tingkat
			LEFT JOIN (
				SELECT ekp.id, ek.indek
				FROM evaluasi_kinerja_pegawai ekp
				JOIN evaluasi_kinerja ek ON ekp.kode_evaluasi = ek.kode_evaluasi
				WHERE (ekp.id, ekp.tahun, ekp.bulan) IN (
					SELECT id, MAX(tahun), MAX(bulan)
					FROM evaluasi_kinerja_pegawai
					GROUP BY id
				)
			) eval_latest ON p.id = eval_latest.id
			LEFT JOIN (
				SELECT pkp.id, pk.indek
				FROM pencapaian_kinerja_pegawai pkp
				JOIN pencapaian_kinerja pk ON pkp.kode_pencapaian = pk.kode_pencapaian
				WHERE (pkp.id, pkp.tahun, pkp.bulan) IN (
					SELECT id, MAX(tahun), MAX(bulan)
					FROM pencapaian_kinerja_pegawai
					GROUP BY id
				)
			) capai_latest ON p.id = capai_latest.id
			WHERE p.stts_aktif = 'AKTIF'
		`);

		const totalAggregate = totalAggregateResult[0]?.total_aggregate || 1; // Avoid division by zero

		// Calculate percentage based on Threshold
		const dataWithPercentage = data.map((employee) => {
			const totalIndex = parseFloat(employee.total_index_remunerasi || 0);
			const threshold = parseFloat(employee.threshold_persen || 100);
			// Percentage Achievement relative to Threshold
			const percentage = (totalIndex / threshold) * 100;

			return {
				...employee,
				remunerasi_percentage: percentage.toFixed(2),
			};
		});

		return NextResponse.json({
			status: "success",
			data: dataWithPercentage,
			pagination: { page, limit, total, totalPages },
			meta: {
				total_aggregate_index: totalAggregate,
			},
		});
	} catch (error) {
		console.error("Error fetching pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data pegawai" },
			{ status: 500 },
		);
	}
}

// POST - Insert pegawai baru
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		// Validasi NIK unique
		const existingNik = await rawQuery("SELECT id FROM pegawai WHERE nik = ?", [
			body.nik,
		]);
		if (existingNik.length > 0) {
			return NextResponse.json(
				{ message: "NIK sudah terdaftar" },
				{ status: 400 },
			);
		}

		// Validasi field wajib
		if (!body.tgl_lahir || !body.mulai_kerja) {
			return NextResponse.json(
				{ message: "Tanggal lahir dan mulai kerja wajib diisi" },
				{ status: 400 },
			);
		}

		const pegawaiData = {
			nik: body.nik,
			nama: body.nama,
			jk: body.jk || "Pria",
			jbtn: body.jbtn,
			jnj_jabatan: body.jnj_jabatan,
			kode_kelompok: body.kode_kelompok,
			kode_resiko: body.kode_resiko,
			kode_emergency: body.kode_emergency,
			departemen: body.departemen,
			bidang: body.bidang,
			stts_wp: body.stts_wp,
			stts_kerja: body.stts_kerja,
			npwp: body.npwp || "",
			pendidikan: body.pendidikan,
			gapok: parseFloat(body.gapok) || 0,
			tmp_lahir: body.tmp_lahir || "",
			tgl_lahir: body.tgl_lahir,
			alamat: body.alamat || "",
			kota: body.kota || "",
			mulai_kerja: body.mulai_kerja,
			ms_kerja: body.ms_kerja || "FT>1",
			indexins: body.indexins || body.departemen,
			bpd: body.bpd || "",
			rekening: body.rekening || "",
			stts_aktif: body.stts_aktif || "AKTIF",
			wajibmasuk: parseInt(body.wajibmasuk) ?? 6,
			pengurang: parseFloat(body.pengurang) || 0,
			indek: parseInt(body.indek) ?? 0,
			mulai_kontrak: body.mulai_kontrak || null,
			cuti_diambil: parseInt(body.cuti_diambil) ?? 0,
			dankes: parseFloat(body.dankes) || 0,
			photo: body.photo || null,
			no_ktp: body.no_ktp || "",
		};

		await insert({ table: "pegawai", data: pegawaiData });

		return NextResponse.json({
			status: "success",
			message: "Pegawai berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menambah pegawai" },
			{ status: 500 },
		);
	}
}

// PUT - Update pegawai
export async function PUT(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const id = body.id;

		if (!id) {
			return NextResponse.json(
				{ message: "ID pegawai harus diisi" },
				{ status: 400 },
			);
		}

		// Validasi NIK unique (exclude current)
		if (body.nik) {
			const existingNik = await rawQuery(
				"SELECT id FROM pegawai WHERE nik = ? AND id != ?",
				[body.nik, id],
			);
			if (existingNik.length > 0) {
				return NextResponse.json(
					{ message: "NIK sudah terdaftar" },
					{ status: 400 },
				);
			}
		}

		const pegawaiData = {
			nik: body.nik,
			nama: body.nama,
			jk: body.jk,
			jbtn: body.jbtn,
			jnj_jabatan: body.jnj_jabatan,
			kode_kelompok: body.kode_kelompok,
			kode_resiko: body.kode_resiko,
			kode_emergency: body.kode_emergency,
			departemen: body.departemen,
			bidang: body.bidang,
			stts_wp: body.stts_wp,
			stts_kerja: body.stts_kerja,
			npwp: body.npwp,
			pendidikan: body.pendidikan,
			gapok: parseFloat(body.gapok),
			tmp_lahir: body.tmp_lahir,
			tgl_lahir: body.tgl_lahir,
			alamat: body.alamat,
			kota: body.kota,
			mulai_kerja: body.mulai_kerja,
			ms_kerja: body.ms_kerja,
			indexins: body.indexins || body.departemen,
			bpd: body.bpd,
			rekening: body.rekening,
			stts_aktif: body.stts_aktif,
			wajibmasuk: parseInt(body.wajibmasuk),
			pengurang: parseFloat(body.pengurang),
			indek: parseInt(body.indek),
			mulai_kontrak: body.mulai_kontrak || null,
			cuti_diambil: parseInt(body.cuti_diambil),
			dankes: parseFloat(body.dankes),
			photo: body.photo || null,
			no_ktp: body.no_ktp,
		};

		// Remove undefined
		Object.keys(pegawaiData).forEach((k) => {
			if (pegawaiData[k] === undefined) delete pegawaiData[k];
		});

		await update({
			table: "pegawai",
			data: pegawaiData,
			where: { id },
		});

		return NextResponse.json({
			status: "success",
			message: "Pegawai berhasil diupdate",
		});
	} catch (error) {
		console.error("Error updating pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengupdate pegawai" },
			{ status: 500 },
		);
	}
}

// DELETE - Hapus pegawai
export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json(
				{ message: "ID pegawai harus diisi" },
				{ status: 400 },
			);
		}

		await update({
			table: "pegawai",
			data: { stts_aktif: "KELUAR" },
			where: { id: parseInt(id) },
		});

		return NextResponse.json({
			status: "success",
			message: "Pegawai berhasil diubah status menjadi KELUAR",
		});
	} catch (error) {
		console.error("Error updating pegawai status:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengubah status pegawai" },
			{ status: 500 },
		);
	}
}
