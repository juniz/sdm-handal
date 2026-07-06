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

		// Fetch all active employees
		let employeeQuery = `
			SELECT p.id, p.nik, p.nama, p.departemen, d.nama AS nama_departemen
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.stts_aktif = 'AKTIF'
		`;
		const queryParams = [];

		if (departemen !== "ALL") {
			employeeQuery += ` AND p.departemen = ?`;
			queryParams.push(departemen);
		}

		employeeQuery += ` ORDER BY p.nama ASC`;
		const employees = await rawQuery(employeeQuery, queryParams);

		const rekapList = [];

		for (const emp of employees) {
			// 1. Check if rekap already exists and is locked
			const existingRekap = await selectFirst({
				table: "rekap_bulanan",
				where: {
					pegawai_id: emp.id,
					bulan: Number(bulan),
					tahun: Number(tahun)
				}
			});

			if (existingRekap && existingRekap.status_rekap === "final") {
				rekapList.push({
					...existingRekap,
					nama: emp.nama,
					nik: emp.nik,
					nama_departemen: emp.nama_departemen
				});
				continue;
			}

			// 2. Fetch schedule
			const schedule = await selectFirst({
				table: "jadwal_pegawai",
				where: {
					id: emp.id,
					bulan: formattedBulan,
					tahun: formattedTahun
				}
			});

			const totalHariJadwal = getWorkDaysFromSchedule(schedule);

			// 3. Count approved days
			const approvedResult = await rawQuery(`
				SELECT 
					SUM(CASE WHEN is_tambahan = 0 THEN 1 ELSE 0 END) AS count_reguler,
					SUM(CASE WHEN is_tambahan = 1 THEN 1 ELSE 0 END) AS count_bonus,
					AVG(CASE WHEN is_tambahan = 0 THEN skor_total ELSE NULL END) AS avg_skor
				FROM penilaian_harian
				WHERE pegawai_id = ?
				  AND MONTH(tanggal) = ?
				  AND YEAR(tanggal) = ?
				  AND status = 'approved'
			`, [emp.id, Number(bulan), Number(tahun)]);

			const hariApprovedReguler = approvedResult[0]?.count_reguler ? Number(approvedResult[0].count_reguler) : 0;
			const hariApprovedBonus = approvedResult[0]?.count_bonus ? Number(approvedResult[0].count_bonus) : 0;
			const rataSkorTotal = approvedResult[0]?.avg_skor ? Number(approvedResult[0].avg_skor) : 0;
			const hariApproved = hariApprovedReguler + hariApprovedBonus;

			// 4. Fetch base incentive (jasa dasar)
			const dateStr = `${formattedTahun}-${formattedBulan}-28`; // end of month approximate
			const jasaDasarResult = await rawQuery(`
				SELECT nominal_jasa_dasar FROM jasa_dasar_pegawai
				WHERE pegawai_id = ? AND berlaku_mulai <= ?
				ORDER BY berlaku_mulai DESC
				LIMIT 1
			`, [emp.id, dateStr]);

			const nominalJasaDasar = jasaDasarResult.length > 0 ? Number(jasaDasarResult[0].nominal_jasa_dasar) : 0;

			// 5. Calculations
			const gapHari = Math.max(0, totalHariJadwal - hariApprovedReguler);
			const pengurangJasa = totalHariJadwal > 0
				? (gapHari / totalHariJadwal) * nominalJasaDasar
				: 0;
			const jasaReguler = nominalJasaDasar - pengurangJasa;
			const jasaBonus = hariApprovedBonus * nominalTambahan;

			const nominalJasaFinal = jasaReguler + jasaBonus;

			let rekapRow;

			if (existingRekap) {
				// Update draft rekap
				await update({
					table: "rekap_bulanan",
					data: {
						total_hari_jadwal: totalHariJadwal,
						hari_approved: hariApproved,
						gap_hari: gapHari,
						rata_skor_total: rataSkorTotal,
						nominal_jasa_dasar: nominalJasaDasar,
						pengurang_jasa: pengurangJasa,
						nominal_jasa_final: nominalJasaFinal,
						updated_at: new Date()
					},
					where: { id: existingRekap.id }
				});

				rekapRow = {
					...existingRekap,
					total_hari_jadwal: totalHariJadwal,
					hari_approved: hariApproved,
					gap_hari: gapHari,
					rata_skor_total: rataSkorTotal,
					nominal_jasa_dasar: nominalJasaDasar,
					pengurang_jasa: pengurangJasa,
					nominal_jasa_final: nominalJasaFinal,
					nama: emp.nama,
					nik: emp.nik,
					nama_departemen: emp.nama_departemen
				};
			} else {
				// Insert new draft rekap
				const insertResult = await insert({
					table: "rekap_bulanan",
					data: {
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
						generated_by: loggedInUser.id,
						generated_at: new Date()
					}
				});

				rekapRow = {
					id: insertResult.insertId,
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

			rekapList.push(rekapRow);
		}

		return NextResponse.json({
			success: true,
			data: rekapList
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/rekap:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
