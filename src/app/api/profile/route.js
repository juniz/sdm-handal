import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { selectFirst } from "@/lib/db-helper";

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

		// Ambil data profil pegawai
		let profile = await selectFirst({
			table: "pegawai",
			where: {
				id: idPegawai,
			},
		});

		const kelompok = await selectFirst({
			table: "kelompok_jabatan",
			where: {
				kode_kelompok: profile.kode_kelompok,
			},
			fields: ["nama_kelompok"],
		});

		const departemen = await selectFirst({
			table: "departemen",
			where: {
				dep_id: profile.departemen,
			},
			select: ["nama"],
		});

		const sttsKerja = await selectFirst({
			table: "stts_kerja",
			where: {
				stts: profile.stts_kerja,
			},
			select: ["ktg"],
		});

		profile.kode_kelompok = kelompok?.nama_kelompok;
		profile.departemen = departemen?.nama;
		profile.stts_kerja = sttsKerja?.ktg;

		if (!profile) {
			return NextResponse.json(
				{ error: "Data profil tidak ditemukan" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			status: 200,
			message: "Data profil berhasil diambil",
			data: profile,
		});
	} catch (error) {
		console.error("Error fetching profile:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat mengambil data profil" },
			{ status: 500 }
		);
	}
}
