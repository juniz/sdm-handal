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
			Authorization: `Bearer ${token}`,
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

export async function POST(request) {
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

		const body = await request.json().catch(() => ({}));
		const { bulan, tahun, departemen = "ALL" } = body || {};

		if (!bulan || !tahun) {
			return NextResponse.json({ error: "Bulan dan tahun diperlukan" }, { status: 400 });
		}

		const query = `
			mutation AutoApprovePenilaianBulan($bulan: Int!, $tahun: Int!, $departemen: String) {
				autoApprovePenilaianBulan(bulan: $bulan, tahun: $tahun, departemen: $departemen) {
					success
					message
					totalProcessed
					totalSubmitted
					totalDraft
				}
			}
		`;

		const variables = {
			bulan: Number(bulan),
			tahun: Number(tahun),
			departemen: departemen || "ALL",
		};

		const data = await fetchGraphQL(query, variables, token);
		const result = data?.autoApprovePenilaianBulan;

		return NextResponse.json({
			success: result?.success ?? true,
			message: result?.message ?? "Auto-approve berhasil dijalankan",
			data: result,
		});
	} catch (error) {
		console.error("Error in POST /api/penilaian/auto-approve:", error);
		return NextResponse.json(
			{ success: false, error: error.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}
