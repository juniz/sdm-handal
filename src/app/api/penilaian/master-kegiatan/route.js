import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { selectFirst, insert, rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			return NextResponse.json({ error: "Unauthorized / Session Expired" }, { status: 401 });
		}

		const loggedInUser = verified.payload;
		const { searchParams } = new URL(request.url);
		const mode = searchParams.get("mode");

		// Mode 1: Suggestions for employees typing in daily input
		if (mode === "suggestions") {
			const targetPegawaiId = searchParams.get("pegawai_id") || loggedInUser.id;
			
			// Resolve pegawai department code
			const pegawai = await selectFirst({
				table: "pegawai",
				where: { id: targetPegawaiId },
				select: ["departemen"]
			});

			if (!pegawai) {
				return NextResponse.json({ error: "Pegawai tidak ditemukan" }, { status: 404 });
			}

			// Query active global templates OR templates matching employee's department code (dep_id)
			const suggestions = await rawQuery(`
				SELECT id, dep_id, nama_kegiatan, deskripsi, prioritas
				FROM master_kegiatan_kerja
				WHERE is_aktif = 1
				  AND (dep_id IS NULL OR dep_id = ?)
				ORDER BY nama_kegiatan ASC
			`, [pegawai.departemen]);

			return NextResponse.json({
				success: true,
				data: suggestions
			});
		}

		// Mode 2: Administrative fetch for CRUD management with pagination
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);
		const search = searchParams.get("search") || "";
		const dept = searchParams.get("dept") || "all";

		let whereClause = "WHERE 1=1";
		const params = [];

		const isIT = loggedInUser.departemen?.toUpperCase() === "IT";
		if (!isIT) {
			whereClause += " AND (m.dep_id IS NULL OR m.dep_id = ?)";
			params.push(loggedInUser.departemen);
		} else if (dept !== "all") {
			if (dept === "global") {
				whereClause += " AND m.dep_id IS NULL";
			} else {
				whereClause += " AND m.dep_id = ?";
				params.push(dept);
			}
		}

		if (search.trim() !== "") {
			whereClause += " AND (m.nama_kegiatan LIKE ? OR m.deskripsi LIKE ? OR d.nama LIKE ?)";
			const searchPattern = `%${search}%`;
			params.push(searchPattern, searchPattern, searchPattern);
		}

		// Count total records
		const countResult = await rawQuery(`
			SELECT COUNT(*) as total
			FROM master_kegiatan_kerja m
			LEFT JOIN departemen d ON m.dep_id = d.dep_id
			${whereClause}
		`, params);
		const total = countResult[0]?.total || 0;
		const totalPages = Math.ceil(total / limit);

		// Fetch page items
		const offset = (page - 1) * limit;
		const paginatedParams = [...params, limit, offset];

		const list = await rawQuery(`
			SELECT m.*, d.nama AS nama_departemen
			FROM master_kegiatan_kerja m
			LEFT JOIN departemen d ON m.dep_id = d.dep_id
			${whereClause}
			ORDER BY CASE WHEN m.dep_id IS NULL THEN 0 ELSE 1 END, d.nama ASC, m.nama_kegiatan ASC
			LIMIT ? OFFSET ?
		`, paginatedParams);

		return NextResponse.json({
			success: true,
			data: list,
			pagination: {
				page,
				limit,
				total,
				totalPages
			}
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/master-kegiatan:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function POST(request) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			return NextResponse.json({ error: "Unauthorized / Session Expired" }, { status: 401 });
		}

		const loggedInUser = verified.payload;
		const isIT = loggedInUser.departemen?.toUpperCase() === "IT";

		const body = await request.json();
		const { dep_id, nama_kegiatan, deskripsi, prioritas, is_aktif } = body;

		// Jika bukan IT, paksa dep_id ke departemen user login
		const finalDepId = isIT ? (dep_id || null) : loggedInUser.departemen;

		if (!nama_kegiatan || !nama_kegiatan.trim()) {
			return NextResponse.json({ error: "Nama kegiatan wajib diisi" }, { status: 400 });
		}

		const result = await insert({
			table: "master_kegiatan_kerja",
			data: {
				dep_id: finalDepId,
				nama_kegiatan: nama_kegiatan.substring(0, 200),
				deskripsi: deskripsi || null,
				prioritas: prioritas || "sedang",
				is_aktif: is_aktif === undefined ? 1 : Number(is_aktif)
			}
		});

		return NextResponse.json({
			success: true,
			message: "Master kegiatan berhasil ditambahkan",
			data: {
				id: result.insertId,
				dep_id: finalDepId,
				nama_kegiatan,
				deskripsi,
				prioritas: prioritas || "sedang",
				is_aktif
			}
		});
	} catch (error) {
		console.error("Error in POST /api/penilaian/master-kegiatan:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
