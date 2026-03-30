
import { NextResponse } from "next/server";
import { rawQuery, insert, update, delete_ } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

// GET - List thresholds with pagination and search
export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search") || "";
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "10");
		const offset = (page - 1) * limit;

		let whereClause = "WHERE 1=1";
		const params = [];

		if (search) {
			whereClause += " AND (kj.nama_kelompok LIKE ? OR tkj.kode_kelompok LIKE ?)";
			params.push(`%${search}%`, `%${search}%`);
		}

		const countResult = await rawQuery(
			`SELECT COUNT(*) as total 
			 FROM threshold_kelompok_jabatan tkj
			 JOIN kelompok_jabatan kj ON tkj.kode_kelompok = kj.kode_kelompok
			 ${whereClause}`,
			params
		);
		const total = countResult[0]?.total || 0;
		const totalPages = Math.ceil(total / limit);

		params.push(limit, offset);
		const data = await rawQuery(
			`
			SELECT tkj.*, kj.nama_kelompok, kj.indek
			FROM threshold_kelompok_jabatan tkj
			JOIN kelompok_jabatan kj ON tkj.kode_kelompok = kj.kode_kelompok
			${whereClause}
			ORDER BY kj.kode_kelompok ASC
			LIMIT ? OFFSET ?
		`,
			params
		);

		return NextResponse.json({
			status: "success",
			data: data,
			pagination: { page, limit, total, totalPages },
		});
	} catch (error) {
		console.error("Error fetching thresholds:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data threshold" },
			{ status: 500 }
		);
	}
}

// POST - Create new threshold
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		// Validate required fields
		if (!body.kode_kelompok || !body.threshold_persen) {
			return NextResponse.json(
				{ message: "Kode Kelompok dan Threshold Persen wajib diisi" },
				{ status: 400 }
			);
		}

		// Check uniqueness
		const existing = await rawQuery(
			"SELECT id_threshold FROM threshold_kelompok_jabatan WHERE kode_kelompok = ?",
			[body.kode_kelompok]
		);
		if (existing.length > 0) {
			return NextResponse.json(
				{ message: "Threshold untuk kelompok jabatan ini sudah ada" },
				{ status: 400 }
			);
		}

		const data = {
			kode_kelompok: body.kode_kelompok,
			threshold_persen: parseFloat(body.threshold_persen),
			bobot_jabatan: parseFloat(body.bobot_jabatan || 35.00),
			bobot_personal: parseFloat(body.bobot_personal || 65.00),
			keterangan: body.keterangan || null,
			status: 1,
		};

		await insert({ table: "threshold_kelompok_jabatan", data });

		return NextResponse.json({
			status: "success",
			message: "Threshold berhasil ditambahkan",
		});
	} catch (error) {
		console.error("Error creating threshold:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menambah threshold" },
			{ status: 500 }
		);
	}
}
