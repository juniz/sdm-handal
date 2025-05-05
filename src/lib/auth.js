import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function getUser() {
	try {
		const cookieStore = cookies();
		const token = await cookieStore.get("auth_token")?.value;

		if (!token) return null;

		const secret = new TextEncoder().encode(JWT_SECRET);
		const { payload } = await jwtVerify(token, secret);

		return payload;
	} catch (error) {
		console.error("Error verifying token:", error);
		return null;
	}
}
