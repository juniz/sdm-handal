import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { selectFirst, update, delete_ } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function PUT(request, { params }) {
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
		const isIT = loggedInUser.departemen === "IT" || loggedInUser.departemen_name?.toLowerCase().includes("it");
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const { id } = await params;
		const body = await request.json();
		const { dep_id, nama_kegiatan, deskripsi, prioritas, is_aktif } = body;

		if (!nama_kegiatan || !nama_kegiatan.trim()) {
			return NextResponse.json({ error: "Nama kegiatan wajib diisi" }, { status: 400 });
		}

		const existing = await selectFirst({
			table: "master_kegiatan_kerja",
			where: { id: id }
		});

		if (!existing) {
			return NextResponse.json({ error: "Master kegiatan tidak ditemukan" }, { status: 404 });
		}

		await update({
			table: "master_kegiatan_kerja",
			data: {
				dep_id: dep_id || null,
				nama_kegiatan: nama_kegiatan.substring(0, 200),
				deskripsi: deskripsi || null,
				prioritas: prioritas || "sedang",
				is_aktif: is_aktif === undefined ? 1 : Number(is_aktif)
			},
			where: { id: id }
		});

		return NextResponse.json({
			success: true,
			message: "Master kegiatan berhasil diperbarui"
		});
	} catch (error) {
		console.error("Error in PUT /api/penilaian/master-kegiatan/[id]:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}

export async function DELETE(request, { params }) {
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
		const isIT = loggedInUser.departemen === "IT" || loggedInUser.departemen_name?.toLowerCase().includes("it");
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const { id } = await params;

		const existing = await selectFirst({
			table: "master_kegiatan_kerja",
			where: { id: id }
		});

		if (!existing) {
			return NextResponse.json({ error: "Master kegiatan tidak ditemukan" }, { status: 404 });
		}

		await delete_({
			table: "master_kegiatan_kerja",
			where: { id: id }
		});

		return NextResponse.json({
			success: true,
			message: "Master kegiatan berhasil dihapus"
		});
	} catch (error) {
		console.error("Error in DELETE /api/penilaian/master-kegiatan/[id]:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
