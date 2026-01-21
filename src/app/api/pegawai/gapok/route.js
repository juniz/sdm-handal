import { NextResponse } from "next/server";
import { select, update, rawQuery, transactionHelpers, withTransaction } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

/**
 * @route GET /api/pegawai/gapok
 * @description Mengambil daftar pegawai beserta gaji pokok
 * @query search - Filter berdasarkan nama atau nik (opsional)
 * @query page - Halaman saat ini (defaults to 1)
 * @query limit - Jumlah per halaman (defaults to 50)
 */
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const search = searchParams.get("search");
		const dep_id = searchParams.get("dep_id");
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = (page - 1) * limit;

		let whereClause = "WHERE p.stts_aktif = 'AKTIF'";
		let params = [];

		if (dep_id) {
			whereClause += " AND p.departemen = ?";
			params.push(dep_id);
		}

		if (search) {
			whereClause += " AND (p.nama LIKE ? OR p.nik LIKE ?)";
			params.push(`%${search}%`, `%${search}%`);
		}

		// Count total data
		const countResult = await rawQuery(`
			SELECT COUNT(*) as total 
			FROM pegawai p 
			${whereClause}
		`, params);
		
		const total = countResult[0].total;
		const totalPages = Math.ceil(total / limit);

		// Add limit and offset
		params.push(limit, offset);

		const data = await rawQuery(`
			SELECT 
				p.id, 
				p.nik, 
				p.nama, 
				p.jbtn, 
				p.departemen, 
				d.nama as nama_departemen,
				p.gapok
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			${whereClause}
			ORDER BY p.gapok DESC, p.nama ASC
			LIMIT ? OFFSET ?
		`, params);

		return NextResponse.json({
			status: "success",
			data,
			pagination: {
				page,
				limit,
				total,
				totalPages
			}
		});

	} catch (error) {
		console.error("[API] Error fetching gapok:", error);
		return NextResponse.json(
			{ 
				status: "error", 
				message: "Gagal mengambil data pegawai" 
			},
			{ status: 500 }
		);
	}
}

/**
 * @route PUT /api/pegawai/gapok
 * @description Update gaji pokok pegawai
 * @body { nik, gapok }
 */
export async function PUT(request) {
	try {
        // Cek auth user (pastikan user punya akses edit jika perlu)
        const user = await getUser();
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

		const body = await request.json();
		const { nik, gapok } = body;

		if (!nik) {
			return NextResponse.json(
				{ status: "error", message: "NIK is required" },
				{ status: 400 }
			);
		}

        // Validate gapok
        const gapokValue = parseFloat(gapok);
        if (isNaN(gapokValue)) {
            return NextResponse.json(
				{ status: "error", message: "Gaji pokok harus berupa angka" },
				{ status: 400 }
			);
        }

		await update({
			table: "pegawai",
			data: { gapok: gapokValue },
			where: { nik }
		});

		return NextResponse.json({
			status: "success",
			message: "Gaji pokok berhasil diupdate",
            data: { nik, gapok: gapokValue }
		});

	} catch (error) {
		console.error("[API] Error updating gapok:", error);
		return NextResponse.json(
			{ 
				status: "error", 
				message: "Gagal update gaji pokok",
                error: process.env.NODE_ENV === "development" ? error.message : undefined
			},
			{ status: 500 }
		);
	}
}
