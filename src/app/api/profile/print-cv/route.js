import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized", status: 401 }, { status: 401 });
		}

		const idPegawai = user.id;

		// Query data
		const pegawaiRows = await query("SELECT * FROM pegawai WHERE id = ?", [idPegawai]);
		if (pegawaiRows.length === 0) {
			return NextResponse.json({ error: "Data pegawai tidak ditemukan", status: 404 }, { status: 404 });
		}
		const pegawai = pegawaiRows[0];

		// Fetch Riwayat
		const jabatan = await query("SELECT * FROM riwayat_jabatan WHERE id = ? ORDER BY tgl_sk ASC", [idPegawai]);
		const pendidikan = await query("SELECT * FROM riwayat_pendidikan WHERE id = ? ORDER BY id ASC", [idPegawai]);
		const seminar = await query("SELECT * FROM riwayat_seminar WHERE id = ? ORDER BY id ASC", [idPegawai]);
		const penghargaan = await query("SELECT * FROM riwayat_penghargaan WHERE id = ? ORDER BY id ASC", [idPegawai]);
		const gaji = await query("SELECT * FROM riwayat_naik_gaji WHERE id = ? ORDER BY id ASC", [idPegawai]);

		return NextResponse.json({
			status: "success",
			data: {
				pegawai,
				jabatan,
				pendidikan,
				seminar,
				penghargaan,
				gaji
			}
		});

	} catch (error) {
		console.error("Error generating CV print API:", error);
		return NextResponse.json(
			{ error: "Internal server error", status: 500 },
			{ status: 500 }
		);
	}
}
