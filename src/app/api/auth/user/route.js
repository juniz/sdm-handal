import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";
import { selectFirst } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const BASE_URL = "https://simrs.rsbhayangkaranganjuk.com/webapps/penggajian/";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = await cookieStore.get("auth_token");
		const tokenValue = token?.value;

		if (!tokenValue) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const verified = await jwtVerify(
			tokenValue,
			new TextEncoder().encode(JWT_SECRET)
		);

		const payload = verified.payload;

		// Ambil data pegawai berdasarkan username untuk mendapatkan jabatan
		if (payload.username) {
			try {
				const pegawai = await selectFirst({
					table: "pegawai",
					where: {
						nik: payload.username,
					},
					select: ["jbtn"],
				});

				if (pegawai) {
					payload.jabatan = pegawai.jbtn;
				}
			} catch (error) {
				console.error("Error fetching pegawai jabatan:", error);
			}
		}

		// Ambil nama departemen dari tabel departemen
		if (payload.departemen) {
			try {
				const departemen = await selectFirst({
					table: "departemen",
					where: {
						dep_id: payload.departemen,
					},
					select: ["nama"],
				});

				if (departemen) {
					payload.departemen_name = departemen.nama;
				}
			} catch (error) {
				console.error("Error fetching departemen name:", error);
				// Jika gagal mengambil nama departemen, tetap lanjutkan dengan departemen ID
			}
		}

		if (payload.photo) {
			payload.photo = BASE_URL + payload.photo;
		}

		return NextResponse.json({
			user: payload,
		});
	} catch (error) {
		console.error("Error getting user data:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
