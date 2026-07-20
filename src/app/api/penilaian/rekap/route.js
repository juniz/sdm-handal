import { NextResponse } from "next/server";
import { cookies } from "next/headers";

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
						gap_hari
						rata_skor_total
						nominal_jasa_dasar
						pengurang_jasa
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
						totalJasaFinal
						avgMonthlyScore
						totalLocked
						totalEmployees
					}
				}
			}
		`;

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
	} catch (error) {
		console.error("Error in GET /api/penilaian/rekap:", error);
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
	}
}
