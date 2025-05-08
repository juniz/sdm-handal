import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { rawQuery, selectFirst } from "@/lib/db-helper";
import moment from "moment";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET(request) {
	try {
		const cookieStore = cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			if (error.code === "ERR_JWT_EXPIRED") {
				return NextResponse.json(
					{ error: "Token kedaluwarsa, silakan login kembali" },
					{ status: 401 }
				);
			}
			throw error;
		}

		const idPegawai = verified.payload.id;

		// Ambil data departemen user
		const userProfile = await selectFirst({
			table: "pegawai",
			where: {
				id: idPegawai,
			},
		});

		if (!userProfile) {
			return NextResponse.json(
				{ error: "Data pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		const today = moment().format("YYYY-MM-DD");

		// Ambil data presensi hari ini untuk departemen yang sama menggunakan raw query
		const sql = `
			SELECT 
				tp.*,
				p.nama,
				p.nik,
				p.departemen,
				p.jnj_jabatan
			FROM temporary_presensi tp
			JOIN pegawai p ON p.id = tp.id
			WHERE p.departemen = ?
			AND DATE(tp.jam_datang) = ?
			ORDER BY tp.jam_datang ASC
		`;

		const attendances = await rawQuery(sql, [userProfile.departemen, today]);

		return NextResponse.json({
			status: 200,
			message: "Data presensi berhasil diambil",
			data: attendances,
		});
	} catch (error) {
		console.error("Error fetching attendance history:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat mengambil data presensi" },
			{ status: 500 }
		);
	}
}
