import { NextResponse } from "next/server";

// GET - Download template Excel untuk upload gaji
export async function GET() {
	try {
		// Dynamic import untuk xlsx
		let XLSX;
		try {
			XLSX = await import("xlsx");
		} catch (importError) {
			return NextResponse.json(
				{
					message:
						"Library xlsx belum terinstall. Silakan jalankan: npm install xlsx",
				},
				{ status: 500 }
			);
		}

		// Buat workbook baru
		const workbook = XLSX.utils.book_new();

		// Data template dengan header
		const templateData = [
			["NIK", "Nama", "Jenis", "Total Gaji"],
			["1234567890123456", "Contoh Nama Pegawai", "Gaji", "5000000"],
			["", "", "", ""],
			["", "", "", ""],
		];

		// Buat worksheet dari data
		const worksheet = XLSX.utils.aoa_to_sheet(templateData);

		// Set lebar kolom
		worksheet["!cols"] = [
			{ wch: 20 }, // NIK
			{ wch: 30 }, // Nama
			{ wch: 15 }, // Jenis
			{ wch: 15 }, // Total Gaji
		];

		// Tambahkan worksheet ke workbook
		XLSX.utils.book_append_sheet(workbook, worksheet, "Template Gaji");

		// Generate buffer Excel
		const excelBuffer = XLSX.write(workbook, {
			type: "buffer",
			bookType: "xlsx",
		});

		// Return file Excel
		return new NextResponse(excelBuffer, {
			headers: {
				"Content-Type":
					"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
				"Content-Disposition":
					'attachment; filename="Template_Gaji_Pegawai.xlsx"',
			},
		});
	} catch (error) {
		console.error("Error generating Excel template:", error);
		return NextResponse.json(
			{
				message: "Terjadi kesalahan saat generate template Excel",
				error:
					process.env.NODE_ENV === "development" ? error.message : undefined,
			},
			{ status: 500 }
		);
	}
}

