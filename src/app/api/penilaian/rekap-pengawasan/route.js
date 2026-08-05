import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

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

		try {
			await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			return NextResponse.json({ error: "Unauthorized / Session Expired" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const bulan = searchParams.get("bulan");
		const tahun = searchParams.get("tahun");
		const departemen = searchParams.get("departemen") || "ALL";
		const sttsKerja = searchParams.get("stts_kerja") || searchParams.get("sttsKerja") || "ALL";
		const nama = searchParams.get("nama") || "";
		const page = parseInt(searchParams.get("page") || "1", 10);
		const limit = parseInt(searchParams.get("limit") || "10", 10);

		if (!bulan || !tahun) {
			return NextResponse.json({ error: "Bulan dan tahun diperlukan" }, { status: 400 });
		}

		const query = `
			query GetRekapPengawasanList(
				$bulan: Int!
				$tahun: Int!
				$departemen: String
				$sttsKerja: String
				$nama: String
				$page: Int
				$limit: Int
			) {
				rekapPengawasanList(
					bulan: $bulan
					tahun: $tahun
					departemen: $departemen
					sttsKerja: $sttsKerja
					nama: $nama
					page: $page
					limit: $limit
				) {
					data {
						id
						pegawai_id
						nik
						nama
						nama_departemen
						stts_kerja
						bulan
						tahun
						total_hari_jadwal
						hari_approved
						hari_approved_bonus
						gap_hari
						rata_skor_total
						status_rekap
					}
					meta {
						page
						limit
						totalItems
						totalPages
					}
					summary {
						totalEmployees
						avgMonthlyScore
						totalLocked
						totalDraft
						compliancePercentage
					}
				}
			}
		`;

		const variables = {
			bulan: Number(bulan),
			tahun: Number(tahun),
			departemen,
			sttsKerja,
			nama,
			page,
			limit
		};

		const data = await fetchGraphQL(query, variables, token);

		return NextResponse.json({
			success: true,
			data: data.rekapPengawasanList.data,
			meta: data.rekapPengawasanList.meta,
			summary: data.rekapPengawasanList.summary
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/rekap-pengawasan:", error);
		return NextResponse.json(
			{ error: error.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}
