import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import moment from "moment";
import { insert, update, selectFirst } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request) {
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
					{
						error: "Token kedaluwarsa, silakan login kembali",
					},
					{ status: 401 }
				);
			}
			throw error;
		}

		const idPegawai = verified.payload.id;
		const { date, shift, table = "jadwal_pegawai" } = await request.json();

		// Parse tanggal untuk mendapatkan tahun dan bulan
		const momentDate = moment(date);
		const tahun = momentDate.format("YYYY");
		const bulan = momentDate.format("MM");
		const tanggal = momentDate.format("D");
		const columnName = `h${tanggal}`;

		// Buat object dengan semua kolom h1-h31 berisi empty string
		const initialData = {};
		for (let i = 1; i <= 31; i++) {
			initialData[`h${i}`] = "";
		}

		// Cek apakah sudah ada jadwal untuk bulan ini
		const existingSchedule = await selectFirst({
			table,
			where: {
				id: idPegawai,
				tahun,
				bulan,
			},
		});

		let result;
		if (existingSchedule) {
			// Update jadwal yang ada
			result = await update({
				table,
				data: {
					[columnName]: shift,
				},
				where: {
					id: idPegawai,
					tahun,
					bulan,
				},
			});
		} else {
			// Update nilai shift untuk kolom yang dipilih
			initialData[columnName] = shift;

			// Buat jadwal baru dengan semua kolom
			result = await insert({
				table,
				data: {
					id: idPegawai,
					tahun,
					bulan,
					...initialData,
				},
			});
		}

		return NextResponse.json({
			message: "Jadwal berhasil disimpan",
			data: result,
		});
	} catch (error) {
		console.error("Error saving schedule:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat menyimpan jadwal" },
			{ status: 500 }
		);
	}
}

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
					{
						error: "Token kedaluwarsa, silakan login kembali",
					},
					{ status: 401 }
				);
			}
			throw error;
		}

		const idPegawai = verified.payload.id;

		// Ambil tahun dan bulan dari query params
		const { searchParams } = new URL(request.url);
		const tahun = searchParams.get("tahun");
		const bulan = searchParams.get("bulan");
		const table = searchParams.get("table") || "jadwal_pegawai";

		const result = await selectFirst({
			table,
			where: {
				id: idPegawai,
				tahun,
				bulan,
			},
		});

		return NextResponse.json({
			message: "Data jadwal berhasil diambil",
			data: result || {},
		});
	} catch (error) {
		console.error("Error fetching schedule:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil jadwal" },
			{ status: 500 }
		);
	}
}
