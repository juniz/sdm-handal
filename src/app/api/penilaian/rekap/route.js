import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { selectFirst, insert, update, rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Function to calculate total days in a month where schedule is non-empty
function getWorkDaysFromSchedule(schedule) {
	if (!schedule) return 0;
	let count = 0;
	for (let i = 1; i <= 31; i++) {
		if (schedule[`h${i}`] && schedule[`h${i}`] !== "") {
			count++;
		}
	}
	return count;
}

export async function GET(request) {
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

		// Restriction: Temporarily IT department only
		const isIT = loggedInUser.departemen === "IT" || loggedInUser.departemen_name?.toLowerCase().includes("it");
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const { searchParams } = new URL(request.url);
		const bulan = searchParams.get("bulan"); // 1-12
		const tahun = searchParams.get("tahun"); // YYYY
		const departemen = searchParams.get("departemen") || "ALL";
		const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
		const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

		if (!bulan || !tahun) {
			return NextResponse.json({ error: "Bulan dan tahun diperlukan" }, { status: 400 });
		}

		const formattedBulan = String(bulan).padStart(2, "0");
		const formattedTahun = String(tahun);

		// Fetch nominal tambahan
		const paramTambahan = await selectFirst({
			table: "parameter_penilaian",
			where: { kode: "JASA_SHIFT_TAMBAHAN" }
		});
		const nominalTambahan = paramTambahan ? Number(paramTambahan.nilai_skor) : 50000;

		const dateStr = `${formattedTahun}-${formattedBulan}-28`;

		// 1. Fetch all employee information and their stats using a single database query
		let employeeQuery = `
			SELECT 
				p.id, p.nik, p.nama, p.departemen, d.nama AS nama_departemen,
				rb.id AS rekap_id,
				rb.status_rekap,
				rb.total_hari_jadwal AS rb_total_hari_jadwal,
				rb.hari_approved AS rb_hari_approved,
				rb.gap_hari AS rb_gap_hari,
				rb.rata_skor_total AS rb_rata_skor_total,
				rb.nominal_jasa_dasar AS rb_nominal_jasa_dasar,
				rb.pengurang_jasa AS rb_pengurang_jasa,
				rb.nominal_jasa_final AS rb_nominal_jasa_final,
				
				-- schedule columns
				jp.h1, jp.h2, jp.h3, jp.h4, jp.h5, jp.h6, jp.h7, jp.h8, jp.h9, jp.h10,
				jp.h11, jp.h12, jp.h13, jp.h14, jp.h15, jp.h16, jp.h17, jp.h18, jp.h19, jp.h20,
				jp.h21, jp.h22, jp.h23, jp.h24, jp.h25, jp.h26, jp.h27, jp.h28, jp.h29, jp.h30, jp.h31,
				
				-- approved counts & score
				(
					SELECT COUNT(*)
					FROM penilaian_harian ph
					WHERE ph.pegawai_id = p.id
					  AND MONTH(ph.tanggal) = ?
					  AND YEAR(ph.tanggal) = ?
					  AND ph.status = 'approved'
					  AND ph.is_tambahan = 0
				) AS count_reguler,
				(
					SELECT COUNT(*)
					FROM penilaian_harian ph
					WHERE ph.pegawai_id = p.id
					  AND MONTH(ph.tanggal) = ?
					  AND YEAR(ph.tanggal) = ?
					  AND ph.status = 'approved'
					  AND ph.is_tambahan = 1
				) AS count_bonus,
				(
					SELECT AVG(ph.skor_total)
					FROM penilaian_harian ph
					WHERE ph.pegawai_id = p.id
					  AND MONTH(ph.tanggal) = ?
					  AND YEAR(ph.tanggal) = ?
					  AND ph.status = 'approved'
					  AND ph.is_tambahan = 0
				) AS avg_skor,
				
				-- base incentive
				(
					SELECT jdp.nominal_jasa_dasar 
					FROM jasa_dasar_pegawai jdp
					WHERE jdp.pegawai_id = p.id AND jdp.berlaku_mulai <= ?
					ORDER BY jdp.berlaku_mulai DESC
					LIMIT 1
				) AS nominal_jasa_dasar
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			LEFT JOIN rekap_bulanan rb ON rb.pegawai_id = p.id AND rb.bulan = ? AND rb.tahun = ?
			LEFT JOIN jadwal_pegawai jp ON jp.id = p.id AND jp.bulan = ? AND jp.tahun = ?
			WHERE p.stts_aktif = 'AKTIF'
		`;

		const queryParams = [
			Number(bulan), Number(tahun),
			Number(bulan), Number(tahun),
			Number(bulan), Number(tahun),
			dateStr,
			Number(bulan), Number(tahun),
			formattedBulan, formattedTahun
		];

		if (departemen !== "ALL") {
			employeeQuery += ` AND p.departemen = ?`;
			queryParams.push(departemen);
		}

		employeeQuery += ` ORDER BY p.nama ASC`;
		const rawEmployees = await rawQuery(employeeQuery, queryParams);

		// 2. Perform in-memory processing/calculations for all rows
		const allCalculatedRows = [];
		let totalJasaDasar = 0;
		let totalPengurang = 0;
		let totalJasaFinal = 0;
		let sumMonthlyScore = 0;
		let countWithScore = 0;

		for (const emp of rawEmployees) {
			let rekapRow;

			if (emp.status_rekap === "final") {
				rekapRow = {
					id: emp.rekap_id,
					pegawai_id: emp.id,
					bulan: Number(bulan),
					tahun: Number(tahun),
					total_hari_jadwal: Number(emp.rb_total_hari_jadwal) || 0,
					hari_approved: Number(emp.rb_hari_approved) || 0,
					gap_hari: Number(emp.rb_gap_hari) || 0,
					rata_skor_total: Number(emp.rb_rata_skor_total) || 0,
					nominal_jasa_dasar: Number(emp.rb_nominal_jasa_dasar) || 0,
					pengurang_jasa: Number(emp.rb_pengurang_jasa) || 0,
					nominal_jasa_final: Number(emp.rb_nominal_jasa_final) || 0,
					status_rekap: "final",
					nama: emp.nama,
					nik: emp.nik,
					nama_departemen: emp.nama_departemen
				};
			} else {
				// Calculate values dynamically
				const totalHariJadwal = getWorkDaysFromSchedule(emp);
				const hariApprovedReguler = Number(emp.count_reguler) || 0;
				const hariApprovedBonus = Number(emp.count_bonus) || 0;
				const rataSkorTotal = Number(emp.avg_skor) || 0;
				const hariApproved = hariApprovedReguler + hariApprovedBonus;
				const nominalJasaDasar = Number(emp.nominal_jasa_dasar) || 0;
				const gapHari = Math.max(0, totalHariJadwal - hariApprovedReguler);
				const pengurangJasa = totalHariJadwal > 0
					? (gapHari / totalHariJadwal) * nominalJasaDasar
					: 0;
				const jasaReguler = nominalJasaDasar - pengurangJasa;
				const jasaBonus = hariApprovedBonus * nominalTambahan;
				const nominalJasaFinal = jasaReguler + jasaBonus;

				rekapRow = {
					id: emp.rekap_id || null, // null if draft doesn't exist in DB
					pegawai_id: emp.id,
					bulan: Number(bulan),
					tahun: Number(tahun),
					total_hari_jadwal: totalHariJadwal,
					hari_approved: hariApproved,
					gap_hari: gapHari,
					rata_skor_total: rataSkorTotal,
					nominal_jasa_dasar: nominalJasaDasar,
					pengurang_jasa: pengurangJasa,
					nominal_jasa_final: nominalJasaFinal,
					status_rekap: "draft",
					nama: emp.nama,
					nik: emp.nik,
					nama_departemen: emp.nama_departemen
				};
			}

			// Aggregate metrics for summary
			totalJasaDasar += rekapRow.nominal_jasa_dasar;
			totalPengurang += rekapRow.pengurang_jasa;
			totalJasaFinal += rekapRow.nominal_jasa_final;
			if (rekapRow.rata_skor_total > 0) {
				sumMonthlyScore += rekapRow.rata_skor_total;
				countWithScore++;
			}

			allCalculatedRows.push(rekapRow);
		}

		const avgMonthlyScore = countWithScore > 0 ? Math.round(sumMonthlyScore / countWithScore) : 0;

		// 3. Paginate the list
		const totalItems = allCalculatedRows.length;
		const totalPages = Math.ceil(totalItems / limit);
		const startIndex = (page - 1) * limit;
		const paginatedRows = allCalculatedRows.slice(startIndex, startIndex + limit);

		// 4. Sync draft status in DB for the paginated page only
		for (const row of paginatedRows) {
			if (row.status_rekap === "final") continue;

			if (row.id) {
				// Update existing draft in DB
				await update({
					table: "rekap_bulanan",
					data: {
						total_hari_jadwal: row.total_hari_jadwal,
						hari_approved: row.hari_approved,
						gap_hari: row.gap_hari,
						rata_skor_total: row.rata_skor_total,
						nominal_jasa_dasar: row.nominal_jasa_dasar,
						pengurang_jasa: row.pengurang_jasa,
						nominal_jasa_final: row.nominal_jasa_final,
						updated_at: new Date()
					},
					where: { id: row.id }
				});
			} else {
				// Insert new draft in DB
				const insertResult = await insert({
					table: "rekap_bulanan",
					data: {
						pegawai_id: row.pegawai_id,
						bulan: row.bulan,
						tahun: row.tahun,
						total_hari_jadwal: row.total_hari_jadwal,
						hari_approved: row.hari_approved,
						gap_hari: row.gap_hari,
						rata_skor_total: row.rata_skor_total,
						nominal_jasa_dasar: row.nominal_jasa_dasar,
						pengurang_jasa: row.pengurang_jasa,
						nominal_jasa_final: row.nominal_jasa_final,
						status_rekap: "draft",
						generated_by: loggedInUser.id,
						generated_at: new Date()
					}
				});
				row.id = insertResult.insertId;
			}
		}

		return NextResponse.json({
			success: true,
			data: paginatedRows,
			meta: {
				page,
				limit,
				totalItems,
				totalPages
			},
			summary: {
				totalJasaDasar,
				totalPengurang,
				totalJasaFinal,
				avgMonthlyScore
			}
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/rekap:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
