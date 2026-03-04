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
		const limit = searchParams.get("limit")
			? parseInt(searchParams.get("limit"))
			: 20;
		const page = searchParams.get("page")
			? parseInt(searchParams.get("page"))
			: 1;
		const offset = (page - 1) * limit;

		let sql = `
			SELECT 
				pkp.*,
				p.nama as nama_pegawai,
				p.nik,
				pk.nama_pencapaian,
				pk.indek
			FROM pencapaian_kinerja_pegawai pkp
			JOIN pegawai p ON pkp.id = p.id
			JOIN pencapaian_kinerja pk ON pkp.kode_pencapaian = pk.kode_pencapaian
		`;

		const values = [];
		const conditions = [];

		if (id) {
			conditions.push("pkp.id = ?");
			values.push(id);
		}
		if (tahun) {
			conditions.push("pkp.tahun = ?");
			values.push(tahun);
		}
		if (bulan) {
			conditions.push("pkp.bulan = ?");
			values.push(bulan);
		}

		if (conditions.length > 0) {
			sql += " WHERE " + conditions.join(" AND ");
		}

		sql += " ORDER BY pkp.tahun DESC, pkp.bulan DESC, p.nama ASC";

		if (limit > 0) {
			sql += " LIMIT ? OFFSET ?";
			values.push(limit, offset);
		}

		const data = await rawQuery(sql, values);

		return NextResponse.json({
			status: "success",
			data,
		});
	} catch (error) {
		console.error("Error fetching pencapaian kinerja pegawai:", error);
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
		const { id, kode_pencapaian, tahun, bulan, keterangan } = body;

		if (!id || !kode_pencapaian || !tahun || !bulan) {
			return NextResponse.json(
				{
					message:
						"Semua field (Pegawai, Pencapaian, Tahun, Bulan) wajib diisi",
				},
				{ status: 400 },
			);
		}

		// Check if exists
		const existing = await select({
			table: "pencapaian_kinerja_pegawai",
			where: { id, kode_pencapaian, tahun, bulan },
		});

		if (existing.length > 0) {
			return NextResponse.json(
				{ message: "Data pencapaian sudah ada untuk periode ini" },
				{ status: 400 },
			);
		}

		await insert({
			table: "pencapaian_kinerja_pegawai",
			data: {
				id,
				kode_pencapaian,
				tahun,
				bulan,
				keterangan,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Pencapaian pegawai berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating pencapaian kinerja pegawai:", error);
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
		const { id, kode_pencapaian, tahun, bulan, keterangan } = body;

		if (!id || !kode_pencapaian || !tahun || !bulan) {
			return NextResponse.json(
				{ message: "Key data tidak lengkap" },
				{ status: 400 },
			);
		}

		await update({
			table: "pencapaian_kinerja_pegawai",
			data: {
				keterangan,
			},
			where: { id, kode_pencapaian, tahun, bulan },
		});

		return NextResponse.json({
			status: "success",
			message: "Pencapaian pegawai berhasil diperbarui",
		});
	} catch (error) {
		console.error("Error updating pencapaian kinerja pegawai:", error);
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
		const kode_pencapaian = searchParams.get("kode_pencapaian");
		const tahun = searchParams.get("tahun");
		const bulan = searchParams.get("bulan");

		if (!id || !kode_pencapaian || !tahun || !bulan) {
			return NextResponse.json(
				{ message: "Key data tidak lengkap" },
				{ status: 400 },
			);
		}

		await deleteQuery({
			table: "pencapaian_kinerja_pegawai",
			where: { id, kode_pencapaian, tahun, bulan },
		});

		return NextResponse.json({
			status: "success",
			message: "Pencapaian pegawai berhasil dihapus",
		});
	} catch (error) {
		console.error("Error deleting pencapaian kinerja pegawai:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menghapus data" },
			{ status: 500 },
		);
	}
}
