import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

/**
 * Fungsi untuk memverifikasi JWT token
 * @param {string} token - JWT token yang akan diverifikasi
 * @returns {Promise<Object|null>} - Payload token jika valid, null jika tidak valid
 */
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
