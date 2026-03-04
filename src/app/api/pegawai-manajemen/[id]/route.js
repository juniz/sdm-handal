import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - Detail pegawai by ID
export async function GET(request, { params }) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { id } = await params;

		const data = await rawQuery(
			`
			SELECT p.*, d.nama as nama_departemen,
				(COALESCE(jnj.indek, 0) + COALESCE(kel.indek, 0) + COALESCE(res.indek, 0) + COALESCE(em.indek, 0) + COALESCE(pend.indek, 0)) AS total_index_remunerasi
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN jnj_jabatan jnj ON p.jnj_jabatan = jnj.kode
			LEFT JOIN kelompok_jabatan kel ON p.kode_kelompok = kel.kode_kelompok
			LEFT JOIN resiko_kerja res ON p.kode_resiko = res.kode_resiko
			LEFT JOIN emergency_index em ON p.kode_emergency = em.kode_emergency
			LEFT JOIN pendidikan pend ON p.pendidikan = pend.tingkat
			WHERE p.id = ?
		`,
			[id]
		);

		if (!data || data.length === 0) {
			return NextResponse.json(
				{ message: "Pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			status: "success",
			data: data[0],
		});
	} catch (error) {
		console.error("Error fetching pegawai detail:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data pegawai" },
			{ status: 500 }
		);
	}
}
