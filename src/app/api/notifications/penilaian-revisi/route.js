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

export async function GET() {
  try {
    const token = await getVerifiedToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = `
      query {
        penilaianRevisiList {
          id
          tanggal
          catatan_supervisor
          revisi_is_read
        }
      }
    `;

    const data = await fetchGraphQL(query, {}, token);
    return NextResponse.json({ success: true, data: data.penilaianRevisiList });
  } catch (error) {
    console.error("Error GET /api/notifications/penilaian-revisi:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const token = await getVerifiedToken();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id } = body;
    if (!id) {
      return NextResponse.json({ error: "id diperlukan" }, { status: 400 });
    }

    const mutation = `
      mutation MarkPenilaianRevisiRead($id: Int!) {
        markPenilaianRevisiRead(id: $id)
      }
    `;

    await fetchGraphQL(mutation, { id: Number(id) }, token);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error PUT /api/notifications/penilaian-revisi:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
