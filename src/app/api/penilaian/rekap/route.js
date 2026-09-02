import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
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

		const userDeptCheck = await rawQuery(`
			SELECT p.departemen, d.nama as departemen_nama
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.id = ?
		`, [loggedInUser.id]);

		const userDept = (userDeptCheck[0]?.departemen || loggedInUser?.departemen || "").toUpperCase();
		const userDeptNama = (userDeptCheck[0]?.departemen_nama || "").toUpperCase();
		const envIT = (process.env.NEXT_PUBLIC_DEPARTMENT_IT || "").toUpperCase();
		const envSPI = (process.env.NEXT_PUBLIC_DEPARTMENT_SPI || "").toUpperCase();
		const envKEU = (process.env.NEXT_PUBLIC_DEPARTMENT_KEU || "").toUpperCase();

		const hasFullAccess =
			userDept === "IT" ||
			userDept === "KEU" ||
			userDept === "KEUANGAN" ||
			userDept === "SDM" ||
			userDept === "HRD" ||
			userDept === "SPI" ||
			userDept === "DIR" ||
			userDept === "DIREKSI" ||
			(envIT && userDept === envIT) ||
			(envSPI && userDept === envSPI) ||
			(envKEU && userDept === envKEU) ||
			userDept.includes("IT") ||
			userDept.includes("KEU") ||
			userDept.includes("SDM") ||
			userDept.includes("HRD") ||
			userDept.includes("SPI") ||
			userDept.includes("DIR") ||
			userDeptNama.includes("IT") ||
			userDeptNama.includes("KEUANGAN") ||
			userDeptNama.includes("KEU") ||
			userDeptNama.includes("SDM") ||
			userDeptNama.includes("HRD") ||
			userDeptNama.includes("SUMBER DAYA MANUSIA") ||
			userDeptNama.includes("SPI") ||
			userDeptNama.includes("PENGAWAS") ||
			userDeptNama.includes("DIREKSI");

		const { searchParams } = new URL(request.url);
		const bulan = searchParams.get("bulan");
		const tahun = searchParams.get("tahun");
		const departemen = searchParams.get("departemen") || "ALL";
		const nama = searchParams.get("nama") || "";
		const status = searchParams.get("status") || "ALL";
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);

		if (!bulan || !tahun) {
			return NextResponse.json({ error: "Bulan dan tahun diperlukan" }, { status: 400 });
		}

		const query = `
			query GetRekapBulananList(
				$bulan: Int!
				$tahun: Int!
				$departemen: String
				$nama: String
				$status: String
				$page: Int
				$limit: Int
			) {
				rekapBulananList(
					bulan: $bulan
					tahun: $tahun
					departemen: $departemen
					nama: $nama
					status: $status
					page: $page
					limit: $limit
				) {
					data {
						id
						pegawai_id
						bulan
						tahun
						total_hari_jadwal
						hari_approved
						hari_approved_bonus
						gap_hari
						rata_skor_total
						nominal_jasa_dasar
						pengurang_jasa
						nominal_jasa_tambahan
						jasa_bagian_unit
						nominal_jasa_final
						status_rekap
						nama
						nik
						nama_departemen
					}
					meta {
						page
						limit
						totalItems
						totalPages
					}
					summary {
						totalJasaDasar
						totalPengurang
						totalJasaTambahan
						totalJasaFinal
						avgMonthlyScore
						totalLocked
						totalEmployees
					}
				}
			}
		`;

		// If Admin / Keuangan / SDM / SPI / Direksi, return full dataset without supervisor filtering
		if (hasFullAccess) {
			const variables = {
				bulan: Number(bulan),
				tahun: Number(tahun),
				departemen,
				nama,
				status,
				page,
				limit
			};

			const data = await fetchGraphQL(query, variables, token);
			return NextResponse.json({
				success: true,
				data: data.rekapBulananList.data,
				meta: data.rekapBulananList.meta,
				summary: data.rekapBulananList.summary
			});
		}

		// Non-Admin: Fetch supervisor mappings to determine allowed supervised employees
		const supervisorMappings = await rawQuery(`
			SELECT tipe_relasi, pegawai_id, tipe_unit, kode_unit
			FROM supervisor_mapping
			WHERE supervisor_id = ?
			  AND is_aktif = 1
			  AND berlaku_mulai <= CURDATE()
			  AND (berlaku_sampai IS NULL OR berlaku_sampai >= CURDATE())
		`, [loggedInUser.id]);

		const allowedPegawaiIds = new Set();

		if (supervisorMappings && supervisorMappings.length > 0) {
			// Get all active employees to match unit mappings
			const activeEmployees = await rawQuery(`
				SELECT id, departemen, bidang FROM pegawai WHERE stts_aktif = 'AKTIF'
			`);

			supervisorMappings.forEach((map) => {
				if (map.tipe_relasi === "personal" && map.pegawai_id) {
					allowedPegawaiIds.add(Number(map.pegawai_id));
				} else if (map.tipe_relasi === "unit" && map.kode_unit) {
					activeEmployees.forEach((emp) => {
						if (map.tipe_unit === "departemen" && emp.departemen === map.kode_unit) {
							allowedPegawaiIds.add(Number(emp.id));
						} else if (map.tipe_unit === "bidang" && emp.bidang === map.kode_unit) {
							allowedPegawaiIds.add(Number(emp.id));
						}
					});
				}
			});
		}

		// Also allow supervisor to view their own record
		if (loggedInUser.id) {
			allowedPegawaiIds.add(Number(loggedInUser.id));
		}

		// Fetch all records for filtering
		const variables = {
			bulan: Number(bulan),
			tahun: Number(tahun),
			departemen,
			nama,
			status,
			page: 1,
			limit: 1000
		};

		const data = await fetchGraphQL(query, variables, token);
		const rawData = data.rekapBulananList?.data || [];

		// Filter dataset for allowed supervised employees only
		const filteredData = rawData.filter((item) => allowedPegawaiIds.has(Number(item.pegawai_id)));

		// Calculate stats summary
		const totalEmployees = filteredData.length;
		const totalJasaDasar = filteredData.reduce((sum, item) => sum + (Number(item.nominal_jasa_dasar) || 0), 0);
		const totalPengurang = filteredData.reduce((sum, item) => sum + (Number(item.pengurang_jasa) || 0), 0);
		const totalJasaTambahan = filteredData.reduce((sum, item) => sum + (Number(item.nominal_jasa_tambahan) || 0), 0);
		const totalJasaFinal = filteredData.reduce((sum, item) => sum + (Number(item.nominal_jasa_final) || 0), 0);
		const totalLocked = filteredData.filter((item) => item.status_rekap === "LOCKED").length;
		const avgMonthlyScore = totalEmployees > 0
			? Math.round(filteredData.reduce((sum, item) => sum + (Number(item.rata_skor_total) || 0), 0) / totalEmployees)
			: 0;

		// Paginate filtered data
		const totalPages = Math.ceil(totalEmployees / limit) || 1;
		const startIndex = (page - 1) * limit;
		const paginatedData = filteredData.slice(startIndex, startIndex + limit);

		return NextResponse.json({
			success: true,
			data: paginatedData,
			meta: {
				page,
				limit,
				totalItems: totalEmployees,
				totalPages
			},
			summary: {
				totalJasaDasar,
				totalPengurang,
				totalJasaTambahan,
				totalJasaFinal,
				avgMonthlyScore,
				totalLocked,
				totalEmployees
			}
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/rekap:", error);
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
	}
}
