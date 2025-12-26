import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery, withTransaction, transactionHelpers } from "@/lib/db-helper";
import fs from "fs/promises";
import path from "path";

// POST - Upload Excel gaji (hanya untuk KEU)
export async function POST(request) {
	let connection;
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

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

		// Cek apakah user dari KEU (Keuangan)
		const isKEU =
			userDepartment === "KEU" ||
			userDepartmentName?.toLowerCase().includes("keu") ||
			userDepartmentName?.toLowerCase().includes("keuangan");

		if (!isKEU) {
			return NextResponse.json(
				{ message: "Hanya user departemen KEU yang dapat mengupload gaji" },
				{ status: 403 }
			);
		}

		// Parse FormData
		const formData = await request.formData();
		const file = formData.get("file");
		const periodeTahun = parseInt(formData.get("periode_tahun"));
		const periodeBulan = parseInt(formData.get("periode_bulan"));

		// Validasi input
		if (!file) {
			return NextResponse.json(
				{ message: "File Excel harus diupload" },
				{ status: 400 }
			);
		}

		if (!periodeTahun || !periodeBulan) {
			return NextResponse.json(
				{ message: "Periode tahun dan bulan harus diisi" },
				{ status: 400 }
			);
		}

		if (periodeBulan < 1 || periodeBulan > 12) {
			return NextResponse.json(
				{ message: "Bulan harus antara 1-12" },
				{ status: 400 }
			);
		}

		// Validasi file extension
		const fileName = file.name;
		const fileExt = path.extname(fileName).toLowerCase();
		if (![".xlsx", ".xls"].includes(fileExt)) {
			return NextResponse.json(
				{ message: "File harus berformat Excel (.xlsx atau .xls)" },
				{ status: 400 }
			);
		}

		// Simpan file sementara
		const uploadDir = path.join(process.cwd(), "uploads", "gaji");
		try {
			await fs.access(uploadDir);
		} catch {
			await fs.mkdir(uploadDir, { recursive: true });
		}

		const timestamp = Date.now();
		const tempFileName = `gaji_${timestamp}${fileExt}`;
		const tempFilePath = path.join(uploadDir, tempFileName);

		// Convert file to buffer
		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);

		// Simpan file
		await fs.writeFile(tempFilePath, buffer);

		// Parse Excel - dynamic import untuk xlsx
		let XLSX;
		try {
			XLSX = await import("xlsx");
		} catch (importError) {
			await fs.unlink(tempFilePath);
			return NextResponse.json(
				{
					message:
						"Library xlsx belum terinstall. Silakan jalankan: npm install xlsx",
				},
				{ status: 500 }
			);
		}

		const workbook = XLSX.read(buffer, { type: "buffer" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		if (data.length === 0) {
			await fs.unlink(tempFilePath);
			return NextResponse.json(
				{ message: "File Excel kosong" },
				{ status: 400 }
			);
		}

		// Skip header jika ada
		let startRow = 0;
		if (
			data[0] &&
			(data[0][0]?.toString().toLowerCase().includes("nik") ||
				data[0][1]?.toString().toLowerCase().includes("nama"))
		) {
			startRow = 1;
		}

		const errors = [];
		const successRecords = [];
		let successCount = 0;
		let errorCount = 0;

		// Process data dalam transaction
		await withTransaction(async (transaction) => {
			// Cek duplikasi NIK dalam file
			const nikInFile = new Set();

			for (let i = startRow; i < data.length; i++) {
				const row = data[i];
				if (!row || row.length < 4) {
					continue;
				}

				const nik = row[0]?.toString().trim();
				const nama = row[1]?.toString().trim();
				const jenis = row[2]?.toString().trim();
				const totalGaji = parseFloat(row[3]) || 0;

				// Validasi NIK
				if (!nik) {
					errors.push({
						row: i + 1,
						nik: nik || "",
						message: "NIK tidak boleh kosong",
					});
					errorCount++;
					continue;
				}

				// Cek duplikasi dalam file
				if (nikInFile.has(nik)) {
					errors.push({
						row: i + 1,
						nik: nik,
						message: `NIK ${nik} duplikat dalam file`,
					});
					errorCount++;
					continue;
				}
				nikInFile.add(nik);

				// Validasi jenis
				const jenisUpper = jenis.toUpperCase();
				if (!["GAJI", "JASA"].includes(jenisUpper)) {
					errors.push({
						row: i + 1,
						nik: nik,
						message: `Jenis harus 'Gaji' atau 'Jasa', ditemukan: ${jenis}`,
					});
					errorCount++;
					continue;
				}

				// Validasi total gaji
				if (isNaN(totalGaji) || totalGaji < 0) {
					errors.push({
						row: i + 1,
						nik: nik,
						message: `Total gaji harus angka positif, ditemukan: ${row[3]}`,
					});
					errorCount++;
					continue;
				}

				// Cek NIK ada di database
				const pegawaiCheck = await transactionHelpers.rawQuery(
					transaction,
					`SELECT nik FROM pegawai WHERE nik = ?`,
					[nik]
				);

				if (pegawaiCheck.length === 0) {
					errors.push({
						row: i + 1,
						nik: nik,
						message: `NIK ${nik} tidak ditemukan di database`,
					});
					errorCount++;
					continue;
				}

				// Cek duplikasi untuk periode yang sama
				const existingGaji = await transactionHelpers.rawQuery(
					transaction,
					`
					SELECT id FROM gaji_pegawai 
					WHERE nik = ? AND periode_tahun = ? AND periode_bulan = ? AND jenis = ?
				`,
					[nik, periodeTahun, periodeBulan, jenisUpper]
				);

				if (existingGaji.length > 0) {
					errors.push({
						row: i + 1,
						nik: nik,
						message: `Gaji untuk NIK ${nik}, periode ${periodeBulan}/${periodeTahun}, jenis ${jenisUpper} sudah ada`,
					});
					errorCount++;
					continue;
				}

				// Insert gaji
				try {
					await transactionHelpers.insert(transaction, {
						table: "gaji_pegawai",
						data: {
							nik: nik,
							periode_tahun: periodeTahun,
							periode_bulan: periodeBulan,
							jenis: jenisUpper,
							gaji: totalGaji,
							uploaded_by: userNik,
						},
					});

					successRecords.push({ nik, nama, jenis: jenisUpper, gaji: totalGaji });
					successCount++;
				} catch (insertError) {
					errors.push({
						row: i + 1,
						nik: nik,
						message: `Error insert: ${insertError.message}`,
					});
					errorCount++;
				}
			}

			// Simpan upload log
			const errorDetails =
				errors.length > 0 ? JSON.stringify(errors) : null;

			await transactionHelpers.insert(transaction, {
				table: "gaji_upload_log",
				data: {
					file_name: fileName,
					file_path: tempFilePath,
					periode_tahun: periodeTahun,
					periode_bulan: periodeBulan,
					total_records: data.length - startRow,
					success_count: successCount,
					error_count: errorCount,
					uploaded_by: userNik,
					error_details: errorDetails,
				},
			});
		});

		// Hapus file sementara setelah beberapa waktu (opsional, bisa dijadwalkan)
		// Untuk sekarang kita biarkan file tersimpan untuk audit

		return NextResponse.json({
			status: 200,
			message: "Upload selesai",
			data: {
				total_records: data.length - startRow,
				success_count: successCount,
				error_count: errorCount,
				errors: errors.slice(0, 50), // Limit error untuk response
				success_records: successRecords.slice(0, 10), // Sample success records
			},
		});
	} catch (error) {
		console.error("Error uploading gaji:", error);
		return NextResponse.json(
			{
				message: "Terjadi kesalahan saat mengupload gaji",
				error: process.env.NODE_ENV === "development" ? error.message : undefined,
			},
			{ status: 500 }
		);
	}
}

