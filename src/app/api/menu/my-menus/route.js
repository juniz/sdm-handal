import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = await cookieStore.get("auth_token");
    const tokenValue = token?.value;

    if (!tokenValue) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const res = await fetch(GQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${tokenValue}`,
      },
      body: JSON.stringify({
        query: `
          query GetMyMenus {
            myMenus {
              href
            }
          }
        `,
      }),
    });

    const json = await res.json();
    if (json.errors) {
      return NextResponse.json({ error: json.errors[0]?.message ?? "GraphQL error" }, { status: 400 });
    }

    const hrefs = json.data?.myMenus?.map((m) => m.href) ?? [];
    return NextResponse.json({ hrefs });
  } catch (error) {
    console.error("Error in my-menus API route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
