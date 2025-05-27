import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { select, insert, update, delete_ } from "@/lib/db-helper";
import moment from "moment-timezone";
import "moment/locale/id";

moment.locale("id");
moment.tz.setDefault("Asia/Jakarta");

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// GET: Mengambil daftar rapat
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
			return NextResponse.json(
				{ error: "Token tidak valid atau kadaluarsa" },
				{ status: 401 }
			);
		}

		// Ambil parameter tanggal dari URL, default ke hari ini jika tidak ada
		const { searchParams } = new URL(request.url);
		const today = moment().format("YYYY-MM-DD");
		const tanggal = searchParams.get("tanggal") || today;

		// Buat query berdasarkan filter
		let query = {
			table: "rapat",
			where: {
				tanggal: moment(tanggal).format("YYYY-MM-DD"),
			},
		};

		const result = await select(query);

		// Format tanggal untuk setiap data rapat
		const formattedResult = result.map((rapat) => ({
			...rapat,
			tanggal: moment(rapat.tanggal).format("DD MMMM YYYY"),
			// Konversi tanda tangan ke format base64 yang valid
			tanda_tangan: rapat.tanda_tangan
				? Buffer.from(rapat.tanda_tangan).toString()
				: null,
		}));

		return NextResponse.json({
			status: "success",
			data: formattedResult,
			metadata: {
				filter: {
					tanggal,
					isToday: tanggal === today,
				},
			},
		});
	} catch (error) {
		console.error("Error fetching rapat:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat mengambil data rapat" },
			{ status: 500 }
		);
	}
}

// POST: Menambah rapat baru
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
			return NextResponse.json(
				{ error: "Token tidak valid atau kadaluarsa" },
				{ status: 401 }
			);
		}

		const {
			tanggal,
			rapat,
			nama,
			instansi,
			tanda_tangan,
		} = await request.json();

		// Validasi input
		if (!tanggal || !rapat || !nama || !instansi) {
			return NextResponse.json(
				{ error: "Semua field harus diisi" },
				{ status: 400 }
			);
		}

		const result = await insert({
			table: "rapat",
			data: {
				tanggal: moment(tanggal).format("YYYY-MM-DD"),
				rapat,
				nama,
				instansi,
				tanda_tangan,
			},
		});

		return NextResponse.json({
			status: "success",
			message: "Data rapat berhasil ditambahkan",
			data: result,
		});
	} catch (error) {
		console.error("Error adding rapat:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat menambah data rapat" },
			{ status: 500 }
		);
	}
}

// PUT: Mengupdate data rapat
export async function PUT(request) {
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
			return NextResponse.json(
				{ error: "Token tidak valid atau kadaluarsa" },
				{ status: 401 }
			);
		}

		const {
			id,
			tanggal,
			rapat,
			nama,
			instansi,
			tanda_tangan,
		} = await request.json();

		if (!id) {
			return NextResponse.json(
				{ error: "ID rapat harus disertakan" },
				{ status: 400 }
			);
		}

		const result = await update({
			table: "rapat",
			data: {
				tanggal: moment(tanggal).format("YYYY-MM-DD"),
				rapat,
				nama,
				instansi,
				tanda_tangan,
			},
			where: { id },
		});

		return NextResponse.json({
			status: "success",
			message: "Data rapat berhasil diperbarui",
			data: result,
		});
	} catch (error) {
		console.error("Error updating rapat:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat memperbarui data rapat" },
			{ status: 500 }
		);
	}
}

// DELETE: Menghapus data rapat
export async function DELETE(request) {
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
			return NextResponse.json(
				{ error: "Token tidak valid atau kadaluarsa" },
				{ status: 401 }
			);
		}

		const { id } = await request.json();

		if (!id) {
			return NextResponse.json(
				{ error: "ID rapat harus disertakan" },
				{ status: 400 }
			);
		}

		const result = await delete_({
			table: "rapat",
			where: { id },
		});

		return NextResponse.json({
			status: "success",
			message: "Data rapat berhasil dihapus",
			data: result,
		});
	} catch (error) {
		console.error("Error deleting rapat:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat menghapus data rapat" },
			{ status: 500 }
		);
	}
}
