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
		const isIT = loggedInUser.departemen === "IT" || loggedInUser.departemen_name?.toLowerCase().includes("it");
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		// Fetch all jasa dasar records with employee details
		const jdpList = await rawQuery(`
			SELECT 
				jdp.*, 
				p.nama AS nama_pegawai, 
				p.nik AS nik_pegawai,
				d.nama AS nama_departemen
			FROM jasa_dasar_pegawai jdp
			JOIN pegawai p ON jdp.pegawai_id = p.id
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			ORDER BY jdp.berlaku_mulai DESC, jdp.id DESC
		`);

		return NextResponse.json({
			success: true,
			data: jdpList
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/jasa-dasar:", error);
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
		const isIT = loggedInUser.departemen === "IT" || loggedInUser.departemen_name?.toLowerCase().includes("it");
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const body = await request.json();
		const { pegawai_id, nominal_jasa_dasar, berlaku_mulai, berlaku_sampai, keterangan } = body;

		if (!pegawai_id || nominal_jasa_dasar === undefined || !berlaku_mulai) {
			return NextResponse.json({ error: "Pegawai, nominal jasa dasar, dan tanggal mulai berlaku wajib diisi" }, { status: 400 });
		}

		await insert({
			table: "jasa_dasar_pegawai",
			data: {
				pegawai_id,
				nominal_jasa_dasar: Number(nominal_jasa_dasar),
				berlaku_mulai,
				berlaku_sampai: berlaku_sampai || null,
				keterangan: keterangan || null,
				dibuat_oleh: loggedInUser.id
			}
		});

		return NextResponse.json({
			success: true,
			message: "Jasa dasar pegawai berhasil ditambahkan"
		});
	} catch (error) {
		console.error("Error in POST /api/penilaian/jasa-dasar:", error);
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
		const isIT = loggedInUser.departemen === "IT" || loggedInUser.departemen_name?.toLowerCase().includes("it");
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const body = await request.json();
		const { id, nominal_jasa_dasar, berlaku_sampai, keterangan } = body;

		if (!id) {
			return NextResponse.json({ error: "ID record jasa dasar diperlukan" }, { status: 400 });
		}

		const dataToUpdate = {};
		if (nominal_jasa_dasar !== undefined) dataToUpdate.nominal_jasa_dasar = Number(nominal_jasa_dasar);
		if (berlaku_sampai !== undefined) dataToUpdate.berlaku_sampai = berlaku_sampai || null;
		if (keterangan !== undefined) dataToUpdate.keterangan = keterangan || null;

		await update({
			table: "jasa_dasar_pegawai",
			data: dataToUpdate,
			where: { id: id }
		});

		return NextResponse.json({
			success: true,
			message: "Jasa dasar pegawai berhasil diperbarui"
		});
	} catch (error) {
		console.error("Error in PUT /api/penilaian/jasa-dasar:", error);
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
		const isIT = loggedInUser.departemen === "IT" || loggedInUser.departemen_name?.toLowerCase().includes("it");
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "ID record jasa dasar diperlukan" }, { status: 400 });
		}

		await delete_({
			table: "jasa_dasar_pegawai",
			where: { id: id }
		});

		return NextResponse.json({
			success: true,
			message: "Jasa dasar pegawai berhasil dihapus"
		});
	} catch (error) {
		console.error("Error in DELETE /api/penilaian/jasa-dasar:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
