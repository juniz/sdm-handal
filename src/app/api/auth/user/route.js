import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const BASE_URL = "https://simrs.rsbhayangkaranganjuk.com/webapps/penggajian/";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = await cookieStore.get("auth_token");
		const tokenValue = token?.value;

		if (!tokenValue) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const verified = await jwtVerify(
			tokenValue,
			new TextEncoder().encode(JWT_SECRET)
		);

		const payload = verified.payload;
		if (payload.photo) {
			payload.photo = BASE_URL + payload.photo;
		}

		return NextResponse.json({
			user: payload,
		});
	} catch (error) {
		console.error("Error getting user data:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 }
		);
	}
}
