import { NextResponse } from "next/server";
import {
	select,
	insert,
	update,
	delete_ as deleteQuery,
	rawQuery,
} from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		const tahun = searchParams.get("tahun");
		const bulan = searchParams.get("bulan");

		let where = {};
		if (id) where.id = id;
		if (tahun) where.tahun = tahun;
		if (bulan) where.bulan = bulan;

		// Since we need to join with pegawai and evaluasi_kinerja to get names,
		// and the simple select helper might not support joins easily,
		// we might need a raw query or just fetch data and enrich on frontend.
		// However, for better performance, let's use a raw query if needed,
		// but db-helper select supports simple fetching.
		// Let's try raw query to get joined data which is better for display.

		let sql = `
			SELECT 
				ekp.*,
				p.nama as nama_pegawai,
				p.nik,
				ek.nama_evaluasi,
				ek.indek
			FROM evaluasi_kinerja_pegawai ekp
			JOIN pegawai p ON ekp.id = p.id
			JOIN evaluasi_kinerja ek ON ekp.kode_evaluasi = ek.kode_evaluasi
		`;

		const values = [];
		const conditions = [];

		if (id) {
			conditions.push("ekp.id = ?");
			values.push(id);
		}
		if (tahun) {
			conditions.push("ekp.tahun = ?");
			values.push(tahun);
		}
		if (bulan) {
			conditions.push("ekp.bulan = ?");
			values.push(bulan);
		}

		if (conditions.length > 0) {
			sql += " WHERE " + conditions.join(" AND ");
		}

		sql += " ORDER BY ekp.tahun DESC, ekp.bulan DESC, p.nama ASC";

		const data = await rawQuery(sql, values);

		return NextResponse.json({
			status: "success",
			data,
		});
	} catch (error) {
		console.error("Error fetching evaluasi kinerja pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data" },
			{ status: 500 },
		);
	}
}

export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { id, kode_evaluasi, tahun, bulan, keterangan } = body;

		if (!id || !kode_evaluasi || !tahun || !bulan) {
			return NextResponse.json(
				{
					message: "Semua field (Pegawai, Evaluasi, Tahun, Bulan) wajib diisi",
				},
				{ status: 400 },
			);
		}

		// Check if exists
		const existing = await select({
			table: "evaluasi_kinerja_pegawai",
			where: { id, kode_evaluasi, tahun, bulan },
		});

		if (existing.length > 0) {
			return NextResponse.json(
				{ message: "Data evaluasi sudah ada untuk periode ini" },
				{ status: 400 },
			);
		}

		await insert({
			table: "evaluasi_kinerja_pegawai",
			data: {
				id,
				kode_evaluasi,
				tahun,
				bulan,
				keterangan,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Evaluasi pegawai berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating evaluasi kinerja pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menyimpan data" },
			{ status: 500 },
		);
	}
}

export async function PUT(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { id, kode_evaluasi, tahun, bulan, keterangan } = body;

		if (!id || !kode_evaluasi || !tahun || !bulan) {
			return NextResponse.json(
				{ message: "Key data tidak lengkap" },
				{ status: 400 },
			);
		}

		await update({
			table: "evaluasi_kinerja_pegawai",
			data: {
				keterangan,
			},
			where: { id, kode_evaluasi, tahun, bulan },
		});

		return NextResponse.json({
			status: "success",
			message: "Evaluasi pegawai berhasil diperbarui",
		});
	} catch (error) {
		console.error("Error updating evaluasi kinerja pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat memperbarui data" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");
		const kode_evaluasi = searchParams.get("kode_evaluasi");
		const tahun = searchParams.get("tahun");
		const bulan = searchParams.get("bulan");

		if (!id || !kode_evaluasi || !tahun || !bulan) {
			return NextResponse.json(
				{ message: "Key data tidak lengkap" },
				{ status: 400 },
			);
		}

		await deleteQuery({
			table: "evaluasi_kinerja_pegawai",
			where: { id, kode_evaluasi, tahun, bulan },
		});

		return NextResponse.json({
			status: "success",
			message: "Evaluasi pegawai berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting evaluasi kinerja pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus data" },
			{ status: 500 },
		);
	}
}
