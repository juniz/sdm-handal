import { NextResponse } from "next/server";
import { select, update, rawQuery, transactionHelpers, withTransaction } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";

const DEPRECATION_HEADERS = {
	Deprecation: "true",
	"X-Deprecation-Notice": "Migrated to NestJS GraphQL backend (PegawaiModule & GajiModule)",
};

const jsonResponse = (data, init = {}) =>
	NextResponse.json(data, {
		...init,
		headers: {
			...DEPRECATION_HEADERS,
			...init.headers,
		},
	});

/**
 * @deprecated
 * Migrated to NestJS GraphQL backend (PegawaiModule & GajiModule).
 * This REST API route is deprecated and kept only for backward compatibility.
 *
 * @route GET /api/pegawai/gapok
 * @description Mengambil daftar pegawai beserta gaji pokok
 * @query search - Filter berdasarkan nama atau nik (opsional)
 * @query page - Halaman saat ini (defaults to 1)
 * @query limit - Jumlah per halaman (defaults to 50)
 */
export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const action = searchParams.get("action");

		// Download template Excel dikelompokkan per departemen
		if (action === "template") {
			const user = await getUser();
			if (!user) {
				return jsonResponse({ message: "Unauthorized" }, { status: 401 });
			}

			let XLSX;
			try {
				XLSX = await import("xlsx");
			} catch {
				return jsonResponse(
					{ message: "Library xlsx belum terinstall" },
					{ status: 500 }
				);
			}

			const pegawaiList = await rawQuery(`
				SELECT p.nik, p.nama, COALESCE(d.nama, p.departemen) as nama_dept, p.jbtn, COALESCE(p.gapok, 0) as gapok
				FROM pegawai p
				LEFT JOIN departemen d ON p.departemen = d.dep_id
				WHERE p.stts_aktif = 'AKTIF'
				ORDER BY COALESCE(d.nama, p.departemen) ASC, p.nama ASC
			`);

			const rows = [["NIK", "Nama Pegawai", "Departemen", "Jabatan", "Gaji Pokok"]];
			let currentDept = null;
			for (const p of pegawaiList) {
				const deptName = p.nama_dept || "TANPA DEPARTEMEN";
				if (deptName !== currentDept) {
					currentDept = deptName;
					rows.push([`>> DEPARTEMEN: ${currentDept}`, "", "", "", ""]);
				}
				rows.push([p.nik, p.nama, deptName, p.jbtn || "-", Number(p.gapok) || 0]);
			}

			const workbook = XLSX.utils.book_new();
			const worksheet = XLSX.utils.aoa_to_sheet(rows);
			worksheet["!cols"] = [
				{ wch: 20 },
				{ wch: 32 },
				{ wch: 25 },
				{ wch: 25 },
				{ wch: 18 },
			];
			XLSX.utils.book_append_sheet(workbook, worksheet, "Template Gaji Pokok");
			const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

			return new NextResponse(buffer, {
				headers: {
					...DEPRECATION_HEADERS,
					"Content-Type":
						"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
					"Content-Disposition":
						'attachment; filename="Template_Gaji_Pokok_Pegawai.xlsx"',
				},
			});
		}

		const search = searchParams.get("search");
		const dep_id = searchParams.get("dep_id");
		const unset_only = searchParams.get("unset_only");
		const page = parseInt(searchParams.get("page") || "1");
		const limit = parseInt(searchParams.get("limit") || "50");
		const offset = (page - 1) * limit;

		let whereClause = "WHERE p.stts_aktif = 'AKTIF'";
		let params = [];

		if (dep_id) {
			whereClause += " AND p.departemen = ?";
			params.push(dep_id);
		}

		if (search) {
			whereClause += " AND (p.nama LIKE ? OR p.nik LIKE ?)";
			params.push(`%${search}%`, `%${search}%`);
		}

		if (unset_only === "true") {
			whereClause += " AND (p.gapok IS NULL OR p.gapok = 0)";
		}

		// Count total data
		const countResult = await rawQuery(`
			SELECT COUNT(*) as total 
			FROM pegawai p 
			${whereClause}
		`, params);
		
		const total = countResult[0].total;
		const totalPages = Math.ceil(total / limit);

		// Global unset count for pre-generation audit
		const unsetAuditResult = await rawQuery(`
			SELECT COUNT(*) as unset_count
			FROM pegawai
			WHERE stts_aktif = 'AKTIF' AND (gapok IS NULL OR gapok = 0)
		`);
		const unsetTotal = unsetAuditResult[0]?.unset_count || 0;

		// Add limit and offset
		params.push(limit, offset);

		const data = await rawQuery(`
			SELECT 
				p.id, 
				p.nik, 
				p.nama, 
				p.jbtn, 
				p.departemen, 
				d.nama as nama_departemen,
				p.gapok
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			${whereClause}
			ORDER BY p.gapok DESC, p.nama ASC
			LIMIT ? OFFSET ?
		`, params);

		return jsonResponse({
			status: "success",
			data,
			pagination: {
				page,
				limit,
				total,
				totalPages
			},
			meta: {
				unset_total: unsetTotal
			}
		});

	} catch (error) {
		console.error("[API] Error fetching gapok:", error);
		return jsonResponse(
			{ 
				status: "error", 
				message: "Gagal mengambil data pegawai" 
			},
			{ status: 500 }
		);
	}
}

/**
 * @deprecated Use NestJS GraphQL mutation for updating employee / gapok instead.
 * @route PUT /api/pegawai/gapok
 * @description Update gaji pokok pegawai
 * @body { nik, gapok }
 */
export async function PUT(request) {
	try {
        // Cek auth user (pastikan user punya akses edit jika perlu)
        const user = await getUser();
        if (!user) {
            return jsonResponse({ message: "Unauthorized" }, { status: 401 });
        }

		const body = await request.json();
		const { nik, gapok } = body;

		if (!nik) {
			return jsonResponse(
				{ status: "error", message: "NIK is required" },
				{ status: 400 }
			);
		}

        // Validate gapok
        const gapokValue = parseFloat(gapok);
        if (isNaN(gapokValue)) {
            return jsonResponse(
				{ status: "error", message: "Gaji pokok harus berupa angka" },
				{ status: 400 }
			);
        }

		await update({
			table: "pegawai",
			data: { gapok: gapokValue },
			where: { nik }
		});

		return jsonResponse({
			status: "success",
			message: "Gaji pokok berhasil diupdate",
            data: { nik, gapok: gapokValue }
		});

	} catch (error) {
		console.error("[API] Error updating gapok:", error);
		return jsonResponse(
			{ 
				status: "error", 
				message: "Gagal update gaji pokok",
                error: process.env.NODE_ENV === "development" ? error.message : undefined
			},
			{ status: 500 }
		);
	}
}

/**
 * @deprecated Use NestJS GraphQL Excel import mutation instead.
 * @route POST /api/pegawai/gapok
 * @description Import gaji pokok via file Excel (.xlsx / .xls)
 */
export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return jsonResponse({ message: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get("file");
		if (!file) {
			return jsonResponse(
				{ status: "error", message: "File Excel wajib diunggah" },
				{ status: 400 }
			);
		}

		const fileName = file.name || "";
		const fileExt = fileName.split(".").pop().toLowerCase();
		if (!["xlsx", "xls"].includes(fileExt)) {
			return jsonResponse(
				{ status: "error", message: "Format file harus .xlsx atau .xls" },
				{ status: 400 }
			);
		}

		let XLSX;
		try {
			XLSX = await import("xlsx");
		} catch {
			return jsonResponse(
				{ status: "error", message: "Library xlsx belum terinstall" },
				{ status: 500 }
			);
		}

		const buffer = Buffer.from(await file.arrayBuffer());
		const workbook = XLSX.read(buffer, { type: "buffer" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];
		const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		if (!rows || rows.length <= 1) {
			return jsonResponse(
				{ status: "error", message: "File Excel kosong atau tidak memiliki data" },
				{ status: 400 }
			);
		}

		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		await withTransaction(async (transaction) => {
			for (let i = 0; i < rows.length; i++) {
				const row = rows[i];
				if (!row || row.length === 0) continue;

				const col0 = row[0]?.toString().trim() || "";
				// Skip header row and department group separator row
				if (col0.toLowerCase() === "nik" || col0.startsWith(">>")) continue;

				const nik = col0;
				// Column order: NIK (0), Nama (1), Departemen (2), Jabatan (3), Gaji Pokok (4)
				let rawGapok = row[4] !== undefined && row[4] !== "" ? row[4] : row[row.length - 1];
				if (typeof rawGapok === "string") {
					rawGapok = rawGapok.replace(/[^0-9.-]+/g, "");
				}
				const gapok = parseFloat(rawGapok);

				if (!nik) {
					errors.push({ row: i + 1, message: "NIK kosong" });
					errorCount++;
					continue;
				}

				if (isNaN(gapok) || gapok < 0) {
					errors.push({
						row: i + 1,
						nik,
						message: "Nominal gaji pokok tidak valid: " + (row[4] ?? ""),
					});
					errorCount++;
					continue;
				}

				const result = await transactionHelpers.update(transaction, {
					table: "pegawai",
					data: { gapok },
					where: { nik },
				});

				if (result && (result.affectedRows > 0 || result.changedRows >= 0)) {
					successCount++;
				} else {
					errors.push({
						row: i + 1,
						nik,
						message: "NIK tidak ditemukan di database",
					});
					errorCount++;
				}
			}
		});

		return jsonResponse({
			status: "success",
			message: "Import selesai: " + successCount + " berhasil diupdate, " + errorCount + " gagal/dilewati.",
			data: {
				success_count: successCount,
				error_count: errorCount,
				errors: errors.slice(0, 30),
			},
		});
	} catch (error) {
		console.error("[API] Error importing gapok excel:", error);
		return jsonResponse(
			{
				status: "error",
				message: error.message || "Gagal mengimpor file Excel",
			},
			{ status: 500 }
		);
	}
}
