import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	const rawKey =
		process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
		process.env.TURNSTILE_SITE_KEY ||
		"";
	const isDummy = !rawKey || /^[123]x00000/.test(rawKey);
	const siteKey =
		process.env.NODE_ENV === "production" && isDummy
			? "0x4AAAAAABnQ7KZ335kF5jw7"
			: rawKey || "1x00000000000000000000AA";

	return NextResponse.json({ siteKey });
}
