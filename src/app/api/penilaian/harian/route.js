import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import moment from "moment";
import { select, selectFirst, insert, rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper check authorization
async function isAuthorizedForEmployee(loggedInUser, targetEmployeeId) {
	if (Number(loggedInUser.id) === Number(targetEmployeeId)) return true;
	if (loggedInUser.departemen?.toUpperCase() === "IT") return true;

	const personalMapping = await selectFirst({
		table: "supervisor_mapping",
		where: {
			supervisor_id: loggedInUser.id,
			pegawai_id: targetEmployeeId,
			tipe_relasi: "personal",
			is_aktif: 1
		}
	});
	if (personalMapping) return true;

	const target = await selectFirst({
		table: "pegawai",
		where: { id: targetEmployeeId },
		select: ["departemen", "bidang"]
	});

	if (target) {
		const unitMapping = await rawQuery(`
			SELECT id FROM supervisor_mapping
			WHERE supervisor_id = ?
			  AND tipe_relasi = 'unit'
			  AND is_aktif = 1
			  AND (
			    (tipe_unit = 'departemen' AND kode_unit = ?) OR
			    (tipe_unit = 'bidang' AND kode_unit = ?)
			  )
			LIMIT 1
		`, [loggedInUser.id, target.departemen, target.bidang]);

		if (unitMapping && unitMapping.length > 0) return true;
	}

	return false;
}

// Internal attendance resolver
function mapCutiToKondisi(urgensi) {
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

function mapIzinToKondisi(urgensi) {
	const map = {
		"Perjalanan Dinas": "izin_dinas",
		"Dinas Dalam Kota": "izin_dinas_dalam",
		"Dinas Luar Kota": "izin_dinas_luar",
		"Lain-lain": "izin_lainnya",
	};
	return map[urgensi] || "izin_lainnya";
}

function mapAbsenStatusToKondisi(status) {
	const lower = (status || "").toLowerCase().trim();
	if (lower.includes("toleransi") || lower.includes("terlambat_ringan")) {
		return "terlambat_ringan";
	}
	if (lower.includes("terlambat i") || lower.includes("terlambat_sedang") || lower === "terlambat 1" || lower === "terlambat i") {
		return "terlambat_sedang";
	}
	if (lower.includes("terlambat ii") || lower.includes("terlambat_berat") || lower === "terlambat 2" || lower === "terlambat ii") {
		return "terlambat_berat";
	}
	if (lower.includes("hadir") || lower.includes("tepat") || lower === "tepat_waktu") {
		return "tepat_waktu";
	}
	if (lower.includes("alpha")) {
		return "alpha";
	}
	return "tepat_waktu";
}

async function resolveAbsensi(pegawaiId, nikPegawai, tanggal, isTambahan = false) {
	// 1. Cek Cuti
	const cuti = await rawQuery(`
		SELECT urgensi, no_pengajuan FROM pengajuan_cuti
		WHERE nik = ? AND status = 'Disetujui'
		  AND tanggal_awal <= ? AND tanggal_akhir >= ?
		LIMIT 1
	`, [nikPegawai, tanggal, tanggal]);

	if (cuti && cuti.length > 0) {
		return {
			sumber: "cuti",
			nilai_kondisi: mapCutiToKondisi(cuti[0].urgensi),
			ref_no: cuti[0].no_pengajuan
		};
	}

	// 2. Cek Izin
	const izin = await rawQuery(`
		SELECT urgensi, no_pengajuan FROM pengajuan_izin
		WHERE nik = ? AND status = 'Disetujui'
		  AND tanggal_awal <= ? AND tanggal_akhir >= ?
		LIMIT 1
	`, [nikPegawai, tanggal, tanggal]);

	if (izin && izin.length > 0) {
		return {
			sumber: "izin",
			nilai_kondisi: mapIzinToKondisi(izin[0].urgensi),
			ref_no: izin[0].no_pengajuan
		};
	}

	// 3. Cek Absensi
	const isToday = tanggal === moment().format("YYYY-MM-DD");
	let absen = [];

	if (isToday) {
		absen = await rawQuery(`
			SELECT status FROM temporary_presensi
			WHERE id = ? AND DATE(jam_datang) = ?
			LIMIT 1
		`, [pegawaiId, tanggal]);

		if (!absen || absen.length === 0) {
			absen = await rawQuery(`
				SELECT status FROM rekap_presensi
				WHERE id = ? AND DATE(jam_datang) = ?
				LIMIT 1
			`, [pegawaiId, tanggal]);
		}
	} else {
		absen = await rawQuery(`
			SELECT status FROM rekap_presensi
			WHERE id = ? AND DATE(jam_datang) = ?
			LIMIT 1
		`, [pegawaiId, tanggal]);

		if (!absen || absen.length === 0) {
			absen = await rawQuery(`
				SELECT status FROM temporary_presensi
				WHERE id = ? AND DATE(jam_datang) = ?
				LIMIT 1
			`, [pegawaiId, tanggal]);
		}
	}

	if (absen && absen.length > 0) {
		return {
			sumber: "absensi",
			nilai_kondisi: mapAbsenStatusToKondisi(absen[0].status),
			ref_no: null
		};
	}

	if (isTambahan) {
		return {
			sumber: "tepat_waktu",
			nilai_kondisi: "tepat_waktu",
			ref_no: null
		};
	}

	return {
		sumber: "alpha",
		nilai_kondisi: "alpha",
		ref_no: null
	};
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function fetchGraphQL(query, variables, token) {
	const res = await fetch(GQL_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`,
		},
		body: JSON.stringify({ query, variables }),
	});
	
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP error ${res.status}`);
	}
	
	const json = await res.json();
	if (json.errors) {
		throw new Error(json.errors[0]?.message || "GraphQL Error");
	}
	return json.data;
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

		const { searchParams } = new URL(request.url);
		const pegawaiId = searchParams.get("pegawai_id") || loggedInUser.id;
		const tanggal = searchParams.get("tanggal"); // YYYY-MM-DD
		const bulan = searchParams.get("bulan"); // 1-12 or MM
		const tahun = searchParams.get("tahun"); // YYYY

		if (!tanggal && (!bulan || !tahun)) {
			return NextResponse.json({ error: "Tanggal atau (Bulan dan Tahun) diperlukan" }, { status: 400 });
		}

		// Mode 1: Fetch list of daily evaluations for a month
		if (bulan && tahun) {
			const query = `
				query GetPenilaianHarianBulan($pegawaiId: Int, $bulan: Int!, $tahun: Int!) {
					penilaianHarianBulan(pegawaiId: $pegawaiId, bulan: $bulan, tahun: $tahun) {
						id
						pegawai_id
						tanggal
						shift_jadwal
						sumber_absensi
						nilai_kondisi
						skor_kegiatan
						skor_absensi
						skor_total
						status
						catatan_supervisor
						alasan_terlambat
					}
				}
			`;
			const variables = {
				pegawaiId: Number(pegawaiId),
				bulan: Number(bulan),
				tahun: Number(tahun)
			};
			
			const data = await fetchGraphQL(query, variables, token);
			return NextResponse.json({
				success: true,
				data: data.penilaianHarianBulan
			});
		}

		// Mode 2: Fetch single daily evaluation with activities
		const query = `
			query GetPenilaianHarianTanggal($pegawaiId: Int, $tanggal: String!) {
				penilaianHarianTanggal(pegawaiId: $pegawaiId, tanggal: $tanggal) {
					harian {
						id
						pegawai_id
						tanggal
						shift_jadwal
						sumber_absensi
						nilai_kondisi
						skor_kegiatan
						skor_absensi
						skor_total
						status
						catatan_supervisor
						alasan_terlambat
					}
					kegiatan {
						id
						penilaian_id
						judul_kegiatan
						penjabaran
						status_selesai
						alasan_belum_selesai
						urutan
					}
					presensi {
						photo
						latitude
						longitude
					}
				}
			}
		`;
		const variables = {
			pegawaiId: Number(pegawaiId),
			tanggal: String(tanggal)
		};
		const data = await fetchGraphQL(query, variables, token);
		const result = data.penilaianHarianTanggal;

		return NextResponse.json({
			success: true,
			data: result.harian ? {
				...result.harian,
				kegiatan: result.kegiatan || [],
				presensi: result.presensi || null
			} : null
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/harian:", error);
		const status = error.message?.includes("Forbidden") ? 403 : 500;
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status });
	}
}

export async function POST(request) {
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
		const body = await request.json();
		const { tanggal } = body; // YYYY-MM-DD
		const pegawaiId = loggedInUser.id;

		if (!tanggal) {
			return NextResponse.json({ error: "Tanggal diperlukan" }, { status: 400 });
		}

		// Block future dates
		const inputDate = new Date(tanggal);
		const today = new Date();
		today.setHours(23, 59, 59, 999);
		if (inputDate > today) {
			return NextResponse.json({ error: "Tidak dapat mengisi untuk tanggal masa depan" }, { status: 400 });
		}

		// Verify stts_aktif
		const pegawai = await selectFirst({
			table: "pegawai",
			where: { id: pegawaiId },
			select: ["nik", "stts_aktif"]
		});

		if (!pegawai || pegawai.stts_aktif !== "AKTIF") {
			return NextResponse.json({ error: "Hanya pegawai aktif yang dapat mengisi penilaian" }, { status: 403 });
		}

		// Verify schedule is non-empty
		const momentDate = new Date(tanggal);
		const day = momentDate.getDate();
		const month = String(momentDate.getMonth() + 1).padStart(2, "0");
		const year = momentDate.getFullYear();

		const schedule = await selectFirst({
			table: "jadwal_pegawai",
			where: {
				id: pegawaiId,
				bulan: month,
				tahun: year
			}
		});

		let shift = schedule ? schedule[`h${day}`] : "";
		let isTambahan = false;

		if (!shift || shift === "") {
			const scheduleTambahan = await selectFirst({
				table: "jadwal_tambahan",
				where: {
					id: pegawaiId,
					bulan: month,
					tahun: year
				}
			});
			shift = scheduleTambahan ? scheduleTambahan[`h${day}`] : "";
			if (shift && shift !== "") {
				isTambahan = true;
			}
		}

		if (!shift || shift === "") {
			return NextResponse.json({ error: "Tanggal ini bukan hari kerja per jadwal Anda" }, { status: 400 });
		}

		// Check if record already exists
		const existing = await selectFirst({
			table: "penilaian_harian",
			where: {
				pegawai_id: pegawaiId,
				tanggal: tanggal
			}
		});

		if (existing) {
			return NextResponse.json({ error: "Penilaian untuk hari ini sudah dibuat" }, { status: 400 });
		}

		// Resolve absensi status securely on backend
		const resAbsen = await resolveAbsensi(pegawaiId, pegawai.nik, tanggal, isTambahan);

		// Get score from parameter_penilaian
		const param = await selectFirst({
			table: "parameter_penilaian",
			where: {
				nilai_kondisi: resAbsen.nilai_kondisi,
				is_aktif: 1
			}
		});
		const skorAbsensi = param ? Number(param.nilai_skor) : 0;

		const insertData = {
			pegawai_id: pegawaiId,
			tanggal: tanggal,
			shift_jadwal: shift,
			sumber_absensi: resAbsen.sumber,
			ref_cuti_no: resAbsen.sumber === "cuti" ? resAbsen.ref_no : null,
			ref_izin_no: resAbsen.sumber === "izin" ? resAbsen.ref_no : null,
			nilai_kondisi: resAbsen.nilai_kondisi,
			skor_kegiatan: 0,
			skor_absensi: skorAbsensi,
			skor_total: 0, // will compute during submit
			is_tambahan: isTambahan ? 1 : 0,
			status: "draft",
			dibuat_oleh: pegawaiId
		};

		const result = await insert({
			table: "penilaian_harian",
			data: insertData
		});

		return NextResponse.json({
			success: true,
			message: "Draft penilaian harian berhasil dibuat",
			data: {
				id: result.insertId,
				...insertData
			}
		});
	} catch (error) {
		console.error("Error in POST /api/penilaian/harian:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
