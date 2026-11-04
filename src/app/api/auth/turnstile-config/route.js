import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
	const rawKey =
		process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
		process.env.TURNSTILE_SITE_KEY ||
		"";
	const isDummy = !rawKey || /^[123]x00000/.test(rawKey);
	const siteKey = isDummy ? "0x4AAAAAABnQ7KZ335kF5jw7" : rawKey;

	return NextResponse.json({ siteKey });
}
