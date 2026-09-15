import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
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

async function getVerifiedToken() {
	const cookieStore = await cookies();
	const token = cookieStore.get("auth_token")?.value;
	if (!token) return null;
	try {
		await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		return token;
	} catch {
		return null;
	}
}

export async function GET(request) {
	try {
		const token = await getVerifiedToken();
		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const limit = parseInt(searchParams.get("limit") || "20", 10);

		const query = `
			query GetUserNotifications($limit: Int) {
				userNotifications(limit: $limit) {
					unread_count
					notifications {
						id
						nik
						title
						message
						url
						type
						is_read
						created_at
					}
				}
			}
		`;

		const data = await fetchGraphQL(query, { limit }, token);
		const result = data?.userNotifications || {
			notifications: [],
			unread_count: 0,
		};

		return NextResponse.json({
			status: "success",
			data: {
				notifications: result.notifications || [],
				unread_count: result.unread_count || 0,
			},
		});
	} catch (error) {
		console.error("Error GET /api/notifications:", error);
		return NextResponse.json(
			{ error: error.message || "Internal Server Error" },
			{ status: 500 }
		);
	}
}
