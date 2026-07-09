import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { select, selectFirst, insert, update, delete_ } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		try {
			await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			return NextResponse.json({ error: "Unauthorized / Session Expired" }, { status: 401 });
		}

		// Public get (anyone logged in can read parameters for calculating local UI scores)
		const params = await select({
			table: "parameter_penilaian",
			orderBy: "kategori",
			order: "ASC"
		});

		return NextResponse.json({
			success: true,
			data: params
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/parameter:", error);
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
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const body = await request.json();
		const { kode, nama_parameter, kategori, bobot_persen, nilai_kondisi, nilai_skor, deskripsi } = body;

		if (!kode || !nama_parameter || !kategori) {
			return NextResponse.json({ error: "Kode, nama parameter, dan kategori wajib diisi" }, { status: 400 });
		}

		// Check if kode already exists
		const existing = await selectFirst({
			table: "parameter_penilaian",
			where: { kode: kode }
		});

		if (existing) {
			return NextResponse.json({ error: "Kode parameter sudah terdaftar" }, { status: 400 });
		}

		await insert({
			table: "parameter_penilaian",
			data: {
				kode,
				nama_parameter,
				kategori,
				bobot_persen: Number(bobot_persen || 0),
				nilai_kondisi: nilai_kondisi || null,
				nilai_skor: nilai_skor !== undefined && nilai_skor !== null ? Number(nilai_skor) : null,
				deskripsi: deskripsi || null,
				is_aktif: 1
			}
		});

		return NextResponse.json({
			success: true,
			message: "Parameter penilaian berhasil ditambahkan"
		});
	} catch (error) {
		console.error("Error in POST /api/penilaian/parameter:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function PUT(request) {
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
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const body = await request.json();
		const { id, nama_parameter, bobot_persen, nilai_kondisi, nilai_skor, deskripsi, is_aktif } = body;

		if (!id) {
			return NextResponse.json({ error: "ID parameter diperlukan" }, { status: 400 });
		}

		await update({
			table: "parameter_penilaian",
			data: {
				nama_parameter,
				bobot_persen: Number(bobot_persen || 0),
				nilai_kondisi: nilai_kondisi || null,
				nilai_skor: nilai_skor !== undefined && nilai_skor !== null ? Number(nilai_skor) : null,
				deskripsi: deskripsi || null,
				is_aktif: is_aktif === 0 ? 0 : 1
			},
			where: { id: id }
		});

		return NextResponse.json({
			success: true,
			message: "Parameter penilaian berhasil diperbarui"
		});
	} catch (error) {
		console.error("Error in PUT /api/penilaian/parameter:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function DELETE(request) {
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
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "ID parameter diperlukan" }, { status: 400 });
		}

		await delete_({
			table: "parameter_penilaian",
			where: { id: id }
		});

		return NextResponse.json({
			success: true,
			message: "Parameter penilaian berhasil dihapus"
		});
	} catch (error) {
		console.error("Error in DELETE /api/penilaian/parameter:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
