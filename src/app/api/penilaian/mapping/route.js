import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { selectFirst, insert, update, delete_, rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET() {
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

		// Fetch all mappings with employee and supervisor names
		const mappings = await rawQuery(`
			SELECT 
				sm.*, 
				p1.nama AS nama_pegawai, 
				p1.nik AS nik_pegawai, 
				p2.nama AS nama_supervisor, 
				p2.nik AS nik_supervisor
			FROM supervisor_mapping sm
			LEFT JOIN pegawai p1 ON sm.pegawai_id = p1.id
			JOIN pegawai p2 ON sm.supervisor_id = p2.id
			ORDER BY sm.berlaku_mulai DESC, sm.id DESC
		`);

		return NextResponse.json({
			success: true,
			data: mappings
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/mapping:", error);
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
		const { tipe_relasi, pegawai_id, supervisor_id, tipe_unit, kode_unit, berlaku_mulai, berlaku_sampai } = body;

		if (!tipe_relasi || !supervisor_id || !berlaku_mulai) {
			return NextResponse.json({ error: "Tipe relasi, supervisor, dan tanggal mulai berlaku wajib diisi" }, { status: 400 });
		}

		if (tipe_relasi === "personal" && !pegawai_id) {
			return NextResponse.json({ error: "Pegawai wajib diisi untuk tipe relasi personal" }, { status: 400 });
		}

		if (tipe_relasi === "unit" && (!tipe_unit || !kode_unit)) {
			return NextResponse.json({ error: "Tipe unit dan kode unit wajib diisi untuk tipe relasi unit" }, { status: 400 });
		}

		await insert({
			table: "supervisor_mapping",
			data: {
				tipe_relasi,
				pegawai_id: tipe_relasi === "personal" ? pegawai_id : null,
				supervisor_id,
				tipe_unit: tipe_relasi === "unit" ? tipe_unit : null,
				kode_unit: tipe_relasi === "unit" ? kode_unit : null,
				is_aktif: 1,
				berlaku_mulai,
				berlaku_sampai: berlaku_sampai || null,
				dibuat_oleh: loggedInUser.id
			}
		});

		return NextResponse.json({
			success: true,
			message: "Mapping supervisor berhasil ditambahkan"
		});
	} catch (error) {
		console.error("Error in POST /api/penilaian/mapping:", error);
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
		const { 
			id, 
			tipe_relasi, 
			pegawai_id, 
			supervisor_id, 
			tipe_unit, 
			kode_unit, 
			berlaku_mulai, 
			berlaku_sampai, 
			is_aktif 
		} = body;

		if (!id) {
			return NextResponse.json({ error: "ID mapping diperlukan" }, { status: 400 });
		}

		const dataToUpdate = {};
		if (is_aktif !== undefined) dataToUpdate.is_aktif = is_aktif === 0 ? 0 : 1;
		if (supervisor_id !== undefined) dataToUpdate.supervisor_id = supervisor_id;
		if (berlaku_mulai !== undefined) dataToUpdate.berlaku_mulai = berlaku_mulai;
		if (berlaku_sampai !== undefined) dataToUpdate.berlaku_sampai = berlaku_sampai || null;

		if (tipe_relasi !== undefined) {
			dataToUpdate.tipe_relasi = tipe_relasi;
			if (tipe_relasi === "personal") {
				dataToUpdate.pegawai_id = pegawai_id;
				dataToUpdate.tipe_unit = null;
				dataToUpdate.kode_unit = null;
			} else if (tipe_relasi === "unit") {
				dataToUpdate.pegawai_id = null;
				dataToUpdate.tipe_unit = tipe_unit;
				dataToUpdate.kode_unit = kode_unit;
			}
		}

		await update({
			table: "supervisor_mapping",
			data: dataToUpdate,
			where: { id: id }
		});

		return NextResponse.json({
			success: true,
			message: "Mapping supervisor berhasil diperbarui"
		});
	} catch (error) {
		console.error("Error in PUT /api/penilaian/mapping:", error);
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
			return NextResponse.json({ error: "ID mapping diperlukan" }, { status: 400 });
		}

		await delete_({
			table: "supervisor_mapping",
			where: { id: id }
		});

		return NextResponse.json({
			success: true,
			message: "Mapping supervisor berhasil dihapus"
		});
	} catch (error) {
		console.error("Error in DELETE /api/penilaian/mapping:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
