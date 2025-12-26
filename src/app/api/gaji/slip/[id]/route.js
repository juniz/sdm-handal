import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery } from "@/lib/db-helper";
import { generateSlipGajiHTML } from "@/components/penggajian/utils/pdfSlipGenerator";

// GET - Generate HTML untuk slip gaji (bisa digunakan untuk print atau convert ke PDF)
export async function GET(request, { params }) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { id } = params;
		const userId = user.username;

		// Ambil data user untuk cek department
		const userData = await rawQuery(
			`
			SELECT p.departemen, d.nama as departemen_name, p.nik 
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.nik = ?
		`,
			[userId]
		);

		if (userData.length === 0) {
			return NextResponse.json(
				{ message: "Data pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		const userDepartment = userData[0].departemen;
		const userDepartmentName = userData[0].departemen_name;
		const userNik = userData[0].nik;

		// Cek apakah user dari KEU
		const isKEU =
			userDepartment === "KEU" ||
			userDepartmentName?.toLowerCase().includes("keu") ||
			userDepartmentName?.toLowerCase().includes("keuangan");

		// Ambil data gaji
		const gajiData = await rawQuery(
			`
			SELECT gp.*, p.nik, p.nama, p.jbtn, p.departemen, d.nama as departemen_name
			FROM gaji_pegawai gp
			LEFT JOIN pegawai p ON gp.nik = p.nik
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE gp.id = ?
		`,
			[parseInt(id)]
		);

		if (gajiData.length === 0) {
			return NextResponse.json(
				{ message: "Data gaji tidak ditemukan" },
				{ status: 404 }
			);
		}

		const gaji = gajiData[0];

		// Validasi: user hanya bisa lihat slip gaji sendiri, kecuali KEU
		if (!isKEU && gaji.nik !== userNik) {
			return NextResponse.json(
				{ message: "Anda hanya dapat melihat slip gaji sendiri" },
				{ status: 403 }
			);
		}

		// Generate HTML
		const html = generateSlipGajiHTML(gaji, {
			nik: gaji.nik,
			nama: gaji.nama,
			jbtn: gaji.jbtn,
			departemen_name: gaji.departemen_name,
		});

		// Return HTML untuk print
		return new NextResponse(html, {
			headers: {
				"Content-Type": "text/html; charset=utf-8",
			},
		});
	} catch (error) {
		console.error("Error generating slip gaji:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat generate slip gaji" },
			{ status: 500 }
		);
	}
}


