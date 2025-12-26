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

		// Ambil data user untuk cek department
		const userData = await rawQuery(
			`
			SELECT p.departemen, d.nama as departemen_name, p.nik 
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.nik = ?
		`,
			[userId]
		);

		if (userData.length === 0) {
			return NextResponse.json(
				{ message: "Data pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		const userDepartment = userData[0].departemen;
		const userDepartmentName = userData[0].departemen_name;
		const userNik = userData[0].nik;

		// Cek apakah user dari KEU (Keuangan)
		const isKEU =
			userDepartment === "KEU" ||
			userDepartmentName?.toLowerCase().includes("keu") ||
			userDepartmentName?.toLowerCase().includes("keuangan");

		let gajiData;
		let queryParams = [];
		let whereConditions = [];

		if (isKEU) {
			// KEU bisa lihat semua gaji
			if (periodeTahun) {
				whereConditions.push("gp.periode_tahun = ?");
				queryParams.push(parseInt(periodeTahun));
			}
			if (periodeBulan) {
				whereConditions.push("gp.periode_bulan = ?");
				queryParams.push(parseInt(periodeBulan));
			}
			if (search) {
				whereConditions.push(
					"(p.nik LIKE ? OR p.nama LIKE ?)"
				);
				queryParams.push(`%${search}%`, `%${search}%`);
			}

			const whereClause =
				whereConditions.length > 0
					? "WHERE " + whereConditions.join(" AND ")
					: "";

			gajiData = await rawQuery(
				`
				SELECT 
					gp.*,
					p.nama,
					p.jbtn,
					p.departemen,
					d.nama as departemen_name,
					u.nama as uploaded_by_name
				FROM gaji_pegawai gp
				LEFT JOIN pegawai p ON gp.nik = p.nik
				LEFT JOIN departemen d ON p.departemen = d.dep_id
				LEFT JOIN pegawai u ON gp.uploaded_by = u.nik
				${whereClause}
				ORDER BY gp.periode_tahun DESC, gp.periode_bulan DESC, p.nama ASC
			`,
				queryParams
			);
		} else {
			// User biasa hanya bisa lihat gaji sendiri
			whereConditions.push("gp.nik = ?");
			queryParams.push(userNik);

			if (periodeTahun) {
				whereConditions.push("gp.periode_tahun = ?");
				queryParams.push(parseInt(periodeTahun));
			}
			if (periodeBulan) {
				whereConditions.push("gp.periode_bulan = ?");
				queryParams.push(parseInt(periodeBulan));
			}

			const whereClause = "WHERE " + whereConditions.join(" AND ");

			gajiData = await rawQuery(
				`
				SELECT 
					gp.*,
					p.nama,
					p.jbtn,
					p.departemen,
					d.nama as departemen_name
				FROM gaji_pegawai gp
				LEFT JOIN pegawai p ON gp.nik = p.nik
				LEFT JOIN departemen d ON p.departemen = d.dep_id
				${whereClause}
				ORDER BY gp.periode_tahun DESC, gp.periode_bulan DESC
			`,
				queryParams
			);
		}

		return NextResponse.json({
			status: 200,
			message: "Data gaji berhasil diambil",
			data: gajiData,
		});
	} catch (error) {
		console.error("Error fetching gaji:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil data gaji" },
			{ status: 500 }
		);
	}
}


