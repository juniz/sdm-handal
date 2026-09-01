import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import moment from "moment";
import { selectFirst, insert, update, rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Mapping urgensi cuti to parameter_penilaian nilai_kondisi
export function mapCutiToKondisi(urgensi) {
	const map = {
		"Sakit": "sakit",
		"Tahunan": "cuti_tahunan",
		"Melahirkan": "cuti_melahirkan",
		"Ibadah Keagamaan": "cuti_ibadah",
		"Istimewa": "cuti_istimewa",
		"Karena Alasan Penting": "cuti_penting",
		"Di luar tanggungan negara": "cuti_luar_tanggungan",
		"Tahunan ke luar negeri": "cuti_luar_negeri",
		"Keterangan Lainnya": "cuti_lainnya",
	};
	return map[urgensi] || "cuti_lainnya";
}

// Authenticate and verify user authorization (IT, SDM, HRD, SPI)
async function verifyAuth() {
	const cookieStore = await cookies();
	const token = cookieStore.get("auth_token")?.value;

	if (!token) {
		return { error: "Unauthorized", status: 401 };
	}

	let verified;
	try {
		verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
	} catch (error) {
		return { error: "Unauthorized / Session Expired", status: 401 };
	}

	const loggedInUser = verified.payload;
	const userId = loggedInUser.id;

	const userCheck = await rawQuery(
		`SELECT p.id, p.nik, p.departemen, d.nama as departemen_nama 
		 FROM pegawai p 
		 LEFT JOIN departemen d ON p.departemen = d.dep_id 
		 WHERE p.id = ?`,
		[userId]
	);

	const userDept = (userCheck[0]?.departemen || loggedInUser.departemen || "").toUpperCase();
	const userDeptNama = (userCheck[0]?.departemen_nama || "").toUpperCase();

	const isAllowed =
		userDept.includes("IT") ||
		userDept.includes("SDM") ||
		userDept.includes("HRD") ||
		userDept.includes("SPI") ||
		userDeptNama.includes("IT") ||
		userDeptNama.includes("SDM") ||
		userDeptNama.includes("HRD") ||
		userDeptNama.includes("SPI") ||
		userDept === (process.env.NEXT_PUBLIC_DEPARTMENT_IT || "").toUpperCase() ||
		userDept === (process.env.NEXT_PUBLIC_DEPARTMENT_SPI || "").toUpperCase();

	if (!isAllowed) {
		return { error: "Akses ditolak. Hanya untuk departemen IT/SDM/SPI.", status: 403 };
	}

	return { user: { ...loggedInUser, ...userCheck[0] } };
}

export async function GET(request) {
	try {
		const auth = await verifyAuth();
		if (auth.error) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
		}

		const { searchParams } = new URL(request.url);
		const tanggalAwal = searchParams.get("tanggal_awal") || moment().startOf("month").format("YYYY-MM-DD");
		const tanggalAkhir = searchParams.get("tanggal_akhir") || moment().endOf("month").format("YYYY-MM-DD");
		const departemenFilter = searchParams.get("departemen") || "ALL";
		const searchTerm = searchParams.get("search") || "";
		const statusFilter = searchParams.get("status_filter") || "ALL";

		// 1. Fetch active approved leave requests within the date range
		let whereConditions = [
			"pc.status = 'Disetujui'",
			"pc.tanggal_awal <= ?",
			"pc.tanggal_akhir >= ?"
		];
		let queryParams = [tanggalAkhir, tanggalAwal];

		if (departemenFilter && departemenFilter !== "ALL") {
			whereConditions.push("p.departemen = ?");
			queryParams.push(departemenFilter);
		}

		if (searchTerm) {
			whereConditions.push("(p.nama LIKE ? OR p.nik LIKE ? OR pc.no_pengajuan LIKE ?)");
			queryParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
		}

		const leaveRequests = await rawQuery(
			`SELECT pc.no_pengajuan, pc.nik, pc.tanggal_awal, pc.tanggal_akhir, pc.urgensi, pc.alamat_tujuan, pc.jml,
			        p.id as pegawai_id, p.nama as pegawai_nama, p.departemen as pegawai_departemen,
			        d.nama as departemen_nama
			 FROM pengajuan_cuti pc
			 JOIN pegawai p ON p.nik = pc.nik
			 LEFT JOIN departemen d ON d.dep_id = p.departemen
			 WHERE ${whereConditions.join(" AND ")}
			 ORDER BY p.nama ASC, pc.tanggal_awal ASC`,
			queryParams
		);

		if (!leaveRequests || leaveRequests.length === 0) {
			return NextResponse.json({
				success: true,
				summary: {
					total_cuti_shift: 0,
					approved_100: 0,
					perlu_bypass: 0
				},
				data: []
			});
		}

		// 2. Collect unique pegawai_ids and distinct month/year combinations for batch schedule loading
		const pegawaiIds = [...new Set(leaveRequests.map((r) => r.pegawai_id))];

		// Fetch existing daily evaluations for these employees in date range
		const penilaianHarianList = await rawQuery(
			`SELECT id, pegawai_id, DATE_FORMAT(tanggal, '%Y-%m-%d') as tanggal, shift_jadwal, sumber_absensi, ref_cuti_no,
			        nilai_kondisi, skor_kegiatan, skor_absensi, skor_total, status, approved_at, approved_by, catatan_supervisor
			 FROM penilaian_harian
			 WHERE pegawai_id IN (?) AND tanggal >= ? AND tanggal <= ?`,
			[pegawaiIds, tanggalAwal, tanggalAkhir]
		);

		// Build fast lookup map for penilaian_harian: key = `${pegawai_id}_${tanggal}`
		const penilaianMap = new Map();
		for (const ph of penilaianHarianList) {
			penilaianMap.set(`${ph.pegawai_id}_${ph.tanggal}`, ph);
		}

		// Fetch all schedules for these employees
		const jadwalPegawaiList = await rawQuery(
			`SELECT * FROM jadwal_pegawai WHERE id IN (?)`,
			[pegawaiIds]
		);
		const jadwalTambahanList = await rawQuery(
			`SELECT * FROM jadwal_tambahan WHERE id IN (?)`,
			[pegawaiIds]
		);

		// Build lookup map for schedules: key = `${id}_${bulan}_${tahun}`
		const scheduleMap = new Map();
		for (const jp of jadwalPegawaiList) {
			scheduleMap.set(`regular_${jp.id}_${String(jp.bulan).padStart(2, "0")}_${jp.tahun}`, jp);
		}
		for (const jt of jadwalTambahanList) {
			scheduleMap.set(`tambahan_${jt.id}_${String(jt.bulan).padStart(2, "0")}_${jt.tahun}`, jt);
		}

		// 3. Process each leave request and expand into shift days
		const allItems = [];
		let totalCutiShift = 0;
		let countApproved100 = 0;
		let countPerluBypass = 0;

		for (const pc of leaveRequests) {
			const reqStart = moment(pc.tanggal_awal).format("YYYY-MM-DD");
			const reqEnd = moment(pc.tanggal_akhir).format("YYYY-MM-DD");

			// Determine date range overlap
			const start = moment.max(moment(reqStart), moment(tanggalAwal));
			const end = moment.min(moment(reqEnd), moment(tanggalAkhir));

			let curr = start.clone();
			while (curr.isSameOrBefore(end)) {
				const dateStr = curr.format("YYYY-MM-DD");
				const dayNumber = curr.date();
				const monthStr = curr.format("MM");
				const yearStr = curr.format("YYYY");

				// Check regular schedule
				const regSched = scheduleMap.get(`regular_${pc.pegawai_id}_${monthStr}_${yearStr}`);
				let shift = regSched ? regSched[`h${dayNumber}`] : "";

				// Check additional schedule fallback
				if (!shift || shift.trim() === "") {
					const addSched = scheduleMap.get(`tambahan_${pc.pegawai_id}_${monthStr}_${yearStr}`);
					shift = addSched ? addSched[`h${dayNumber}`] : "";
				}

				shift = (shift || "").trim();

				// If shift is empty, "OFF", or "Libur", employee not scheduled to work
				const shiftUpper = shift.toUpperCase();
				if (!shift || shiftUpper === "OFF" || shiftUpper === "LIBUR") {
					curr.add(1, "day");
					continue;
				}

				// Check daily evaluation status
				const ph = penilaianMap.get(`${pc.pegawai_id}_${dateStr}`);
				let statusBypass = "belum_dibuat";

				if (ph) {
					const isApproved100 =
						ph.status === "approved" &&
						Number(ph.skor_total) === 100 &&
						ph.sumber_absensi === "cuti";

					statusBypass = isApproved100 ? "approved_100" : "perlu_bypass";
				}

				// Update summary counters
				totalCutiShift++;
				if (statusBypass === "approved_100") {
					countApproved100++;
				} else {
					countPerluBypass++;
				}

				const item = {
					pegawai_id: pc.pegawai_id,
					pegawai_nama: pc.pegawai_nama,
					nik: pc.nik,
					departemen: pc.pegawai_departemen,
					departemen_nama: pc.departemen_nama,
					no_pengajuan: pc.no_pengajuan,
					urgensi: pc.urgensi,
					nilai_kondisi: mapCutiToKondisi(pc.urgensi),
					tanggal: dateStr,
					shift: shift,
					status_bypass: statusBypass,
					penilaian_id: ph ? ph.id : null,
					penilaian_status: ph ? ph.status : null,
					skor_total: ph ? Number(ph.skor_total) : null,
					sumber_absensi: ph ? ph.sumber_absensi : null,
					ref_cuti_no: ph ? ph.ref_cuti_no : null
				};

				// Check status filter
				if (
					statusFilter === "ALL" ||
					statusFilter === statusBypass ||
					(statusFilter === "perlu_bypass" && statusBypass !== "approved_100")
				) {
					allItems.push(item);
				}

				curr.add(1, "day");
			}
		}

		return NextResponse.json({
			success: true,
			summary: {
				total_cuti_shift: totalCutiShift,
				approved_100: countApproved100,
				perlu_bypass: countPerluBypass
			},
			data: allItems
		});
	} catch (error) {
		console.error("Error in GET /api/it/deteksi-cuti:", error);
		return NextResponse.json(
			{ success: false, error: "Internal Server Error", message: error.message },
			{ status: 500 }
		);
	}
}

export async function POST(request) {
	try {
		const auth = await verifyAuth();
		if (auth.error) {
			return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
		}

		const loggedInUser = auth.user;
		const body = await request.json();
		const items = body?.items;

		if (!Array.isArray(items) || items.length === 0) {
			return NextResponse.json(
				{ success: false, error: "Data items tidak boleh kosong" },
				{ status: 400 }
			);
		}

		let processedCount = 0;

		for (const item of items) {
			const { pegawai_id, tanggal, no_pengajuan, urgensi, shift } = item;
			if (!pegawai_id || !tanggal) continue;

			const formattedDate = moment(tanggal).format("YYYY-MM-DD");
			const nilaiKondisi = mapCutiToKondisi(urgensi);
			const urgensiText = urgensi || "Tahunan";
			const refCuti = no_pengajuan || "-";

			// Check existing penilaian_harian
			const existing = await selectFirst({
				table: "penilaian_harian",
				where: {
					pegawai_id: pegawai_id,
					tanggal: formattedDate
				}
			});

			if (!existing) {
				// Insert new penilaian_harian
				const insertResult = await insert({
					table: "penilaian_harian",
					data: {
						pegawai_id: pegawai_id,
						tanggal: formattedDate,
						shift_jadwal: shift || "Pagi",
						sumber_absensi: "cuti",
						ref_cuti_no: no_pengajuan || null,
						nilai_kondisi: nilaiKondisi,
						skor_kegiatan: 100.0,
						skor_absensi: 100.0,
						skor_total: 100.0,
						status: "approved",
						approved_at: new Date(),
						approved_by: loggedInUser.id,
						catatan_supervisor: `[Auto-Approved Sistem: Cuti ${urgensiText} - Ref: ${refCuti}]`,
						dibuat_oleh: loggedInUser.id
					}
				});

				// Insert default kegiatan_harian
				await insert({
					table: "kegiatan_harian",
					data: {
						penilaian_id: insertResult.insertId,
						judul_kegiatan: `Melaksanakan Cuti ${urgensiText}`,
						penjabaran: `Cuti ${urgensiText} sesuai pengajuan resmi ${refCuti}`.trim(),
						prioritas: "tinggi",
						status_selesai: "selesai",
						urutan: 1,
						selesai_at: new Date()
					}
				});
			} else {
				// Update existing penilaian_harian to approved with 100% score
				await update({
					table: "penilaian_harian",
					data: {
						sumber_absensi: "cuti",
						ref_cuti_no: no_pengajuan || null,
						nilai_kondisi: nilaiKondisi,
						skor_kegiatan: 100.0,
						skor_absensi: 100.0,
						skor_total: 100.0,
						status: "approved",
						approved_at: new Date(),
						approved_by: loggedInUser.id,
						catatan_supervisor: `[Auto-Approved Sistem: Cuti ${urgensiText} - Ref: ${refCuti}]`
					},
					where: { id: existing.id }
				});

				// Check if any kegiatan_harian exists
				const existingActivities = await rawQuery(
					`SELECT id FROM kegiatan_harian WHERE penilaian_id = ? LIMIT 1`,
					[existing.id]
				);

				if (!existingActivities || existingActivities.length === 0) {
					await insert({
						table: "kegiatan_harian",
						data: {
							penilaian_id: existing.id,
							judul_kegiatan: `Melaksanakan Cuti ${urgensiText}`,
							penjabaran: `Cuti ${urgensiText} sesuai pengajuan resmi ${refCuti}`.trim(),
							prioritas: "tinggi",
							status_selesai: "selesai",
							urutan: 1,
							selesai_at: new Date()
						}
					});
				}
			}

			processedCount++;
		}

		return NextResponse.json({
			success: true,
			message: `Berhasil memproses ${processedCount} data cuti menjadi Disetujui (100%)`,
			processed_count: processedCount
		});
	} catch (error) {
		console.error("Error in POST /api/it/deteksi-cuti:", error);
		return NextResponse.json(
			{ success: false, error: "Internal Server Error", message: error.message },
			{ status: 500 }
		);
	}
}
