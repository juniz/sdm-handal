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

		// Ambil parameter dari URL
		const { searchParams } = new URL(request.url);
		const today = moment().format("YYYY-MM-DD");
		const tanggal = searchParams.get("tanggal");
		const namaRapat = searchParams.get("nama_rapat") || "";
		const namaPeserta = searchParams.get("nama_peserta") || "";
		const searchByNama = searchParams.get("search_by_nama") === "true"; // Parameter khusus untuk pencarian duplikasi

		let query = {
			table: "rapat",
			where: {},
			orderBy: searchByNama ? "tanggal" : "urutan",
			order: searchByNama ? "DESC" : "ASC",
			limit: searchByNama ? 5 : null,
		};

		// Jika search_by_nama=true, hanya filter berdasarkan nama peserta tanpa tanggal
		if (searchByNama) {
			if (namaPeserta.trim()) {
				query.where.nama = {
					operator: "LIKE",
					value: `%${namaPeserta.trim()}%`,
				};
			}
		} else {
			// Mode normal: filter berdasarkan tanggal, nama rapat, dan nama peserta
			query.where.tanggal = moment(tanggal || today).format("YYYY-MM-DD");
			if (namaRapat.trim()) {
				query.where.rapat = {
					operator: "LIKE",
					value: `%${namaRapat.trim()}%`,
				};
			}
			if (namaPeserta.trim()) {
				query.where.nama = {
					operator: "LIKE",
					value: `%${namaPeserta.trim()}%`,
				};
			}
		}

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
					tanggal: searchByNama ? null : (tanggal || today),
					nama_rapat: namaRapat,
					nama_peserta: namaPeserta,
					isToday: !searchByNama && (tanggal || today) === today,
					search_by_nama: searchByNama,
					limit: searchByNama ? 5 : null,
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
			urutan,
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
				urutan: urutan || 0,
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
			urutan,
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
				urutan: urutan || 0,
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

// PATCH: Update urutan rapat (hanya untuk IT)
export async function PATCH(request) {
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

		// Cek apakah user adalah IT
		const userDepartemen = verified.payload.departemen;
		if (userDepartemen !== "IT") {
			return NextResponse.json(
				{ error: "Akses ditolak - Hanya untuk departemen IT" },
				{ status: 403 }
			);
		}

		const { updates } = await request.json();

		if (!Array.isArray(updates) || updates.length === 0) {
			return NextResponse.json(
				{ error: "Data updates harus berupa array" },
				{ status: 400 }
			);
		}

		// Update urutan untuk setiap rapat
		const updatePromises = updates.map(({ id, urutan }) => {
			if (!id || urutan === undefined) {
				throw new Error("ID dan urutan harus disertakan");
			}
			return update({
				table: "rapat",
				data: { urutan },
				where: { id },
			});
		});

		await Promise.all(updatePromises);

		return NextResponse.json({
			status: "success",
			message: "Urutan rapat berhasil diperbarui",
		});
	} catch (error) {
		console.error("Error updating urutan rapat:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat memperbarui urutan rapat" },
			{ status: 500 }
		);
	}
}
