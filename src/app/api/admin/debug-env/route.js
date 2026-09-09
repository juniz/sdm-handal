import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";

// TEMPORARY DEBUG ENDPOINT — delete after diagnosis
export async function GET() {
	const user = await getUser();
	if (!user) {
		return NextResponse.json({ status: "error" }, { status: 401 });
	}

	const rawApiKey = process.env.ONESIGNAL_REST_API_KEY;
	const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;

	return NextResponse.json({
		appId: appId || "(not set)",
		keySet: !!rawApiKey,
		keyLength: rawApiKey ? rawApiKey.length : 0,
		keyPrefix: rawApiKey ? rawApiKey.substring(0, 12) : "(not set)",
		keySuffix: rawApiKey ? rawApiKey.slice(-4) : "(not set)",
		hasQuotes: rawApiKey ? /^["']|["']$/.test(rawApiKey.trim()) : false,
		hasNewline: rawApiKey ? rawApiKey.includes("\n") || rawApiKey.includes("\r") : false,
	});
}
