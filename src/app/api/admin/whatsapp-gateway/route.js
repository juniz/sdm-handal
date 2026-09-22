import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUser } from "@/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    const res = await fetch(`${BACKEND_URL}/web/whatsapp-gateway/status`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error fetching WhatsApp gateway status:", error);
    return NextResponse.json(
      { error: "Gagal mengambil status WhatsApp gateway" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // 'initialize' | 'logout' | 'send-test'

    const validActions = ["initialize", "logout", "send-test"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Action '${action}' tidak valid` },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    let body = undefined;
    if (action === "send-test") {
      body = JSON.stringify(await request.json());
    }

    const res = await fetch(`${BACKEND_URL}/web/whatsapp-gateway/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.error("Error executing WhatsApp gateway action:", error);
    return NextResponse.json(
      { error: "Gagal memproses aksi WhatsApp gateway" },
      { status: 500 }
    );
  }
}
