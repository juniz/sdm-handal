import { jwtVerify, SignJWT } from "jose";
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

// Alias untuk verifyToken (untuk kompatibilitas)
export async function verifyToken(token) {
	try {
		if (!token) return null;

		const secret = new TextEncoder().encode(JWT_SECRET);
		const { payload } = await jwtVerify(token, secret);

		return payload;
	} catch (error) {
		console.error("Error verifying token:", error);
		return null;
	}
}

// Fungsi untuk membuat JWT token
export async function createToken(payload) {
	const secret = new TextEncoder().encode(JWT_SECRET);
	const token = await new SignJWT(payload)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("7d") // 7 hari
		.sign(secret);
	return token;
}

// Fungsi untuk mengatur cookie di server-side
export function setServerCookie(cookieStore, token) {
	cookieStore.set("auth_token", token, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: 7 * 24 * 60 * 60, // 7 hari dalam detik
	});
}

// Fungsi untuk menghapus cookie di server-side
export function removeServerCookie(cookieStore) {
	cookieStore.delete("auth_token", {
		path: "/",
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
	});
}
