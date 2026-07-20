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

export async function POST(request) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { ids, action = "lock" } = body;

		if (!ids || !Array.isArray(ids) || ids.length === 0) {
			return NextResponse.json({ error: "IDs rekap bulanan diperlukan" }, { status: 400 });
		}

		const query = `
			mutation LockUnlockManyRekapBulanan($ids: [Int!]!, $action: String!) {
				lockUnlockManyRekapBulanan(ids: $ids, action: $action)
			}
		`;
		
		const variables = {
			ids: ids.map(Number),
			action
		};

		await fetchGraphQL(query, variables, token);
		
		return NextResponse.json({
			success: true,
			message: action === "lock" ? `${ids.length} rekap bulanan berhasil dikunci` : `Kunci ${ids.length} rekap bulanan berhasil dibuka`,
			data: { status_rekap: action === "lock" ? "final" : "draft" }
		});
	} catch (error) {
		console.error("Error in POST /api/penilaian/rekap/lock:", error);
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
	}
}
