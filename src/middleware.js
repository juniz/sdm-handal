import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function middleware(request) {
	console.log("Middleware running for path:", request.nextUrl.pathname);

	// Skip middleware untuk API routes saja
	if (request.nextUrl.pathname.startsWith("/api/")) {
		console.log("Skipping middleware for api route");
		return NextResponse.next();
	}

	try {
		const cookieStore = await cookies();
		const token = await cookieStore.get("auth_token");
		const tokenValue = token?.value;

		console.log("Token found in cookies:", tokenValue ? "Yes" : "No");

		// Validasi token jika ada
		let isValidToken = false;
		let tokenError = null;

		if (tokenValue) {
			try {
				const verified = await jwtVerify(
					tokenValue,
					new TextEncoder().encode(JWT_SECRET)
				);

				// Cek apakah token akan expired dalam 1 jam ke depan
				const now = Math.floor(Date.now() / 1000);
				const expiresIn = verified.payload.exp - now;

				if (expiresIn > 0) {
					isValidToken = true;
					console.log("Token is valid, expires in:", expiresIn, "seconds");
				} else {
					console.log("Token is expired");
					tokenError = "expired";
				}
			} catch (error) {
				console.log("Token validation error:", error.message);
				tokenError = error.message;
				isValidToken = false;
			}
		}

		// Jika mengakses root URL "/"
		if (request.nextUrl.pathname === "/") {
			if (isValidToken) {
				// Jika sudah login dengan token valid, redirect ke dashboard
				console.log("User already logged in, redirecting to dashboard");
				return NextResponse.redirect(new URL("/dashboard", request.url));
			} else {
				// Jika token tidak valid, bersihkan cookie dan biarkan akses halaman login
				if (tokenValue && !isValidToken) {
					console.log("Clearing invalid token cookie");
					const response = NextResponse.next();
					response.cookies.delete("auth_token");
					return response;
				}
				// Jika belum login, biarkan akses halaman login
				console.log("User not logged in, allowing access to login page");
				return NextResponse.next();
			}
		}

		// Untuk rute dashboard dan protected routes lainnya
		if (!isValidToken) {
			// Jika token ada tapi expired, berikan grace period untuk Android
			if (tokenValue && tokenError === "expired") {
				console.log("Token expired, but giving grace period for Android PWA");
				// Biarkan akses dengan warning, tapi jangan redirect langsung
				// User masih bisa menggunakan app, tapi akan diminta login saat melakukan action
				const response = NextResponse.next();
				response.headers.set("X-Token-Status", "expired");
				return response;
			}

			console.log("No valid token found, redirecting to login");
			const response = NextResponse.redirect(new URL("/", request.url));
			// Bersihkan cookie yang tidak valid
			if (tokenValue) {
				response.cookies.delete("auth_token");
			}
			return response;
		}

		console.log("Token valid, proceeding to next middleware");
		return NextResponse.next();
	} catch (error) {
		console.error("Error in middleware:", error);

		// Jangan langsung redirect jika error network/temporary
		if (error.message.includes("fetch") || error.message.includes("network")) {
			console.log("Network error detected, allowing access with warning");
			const response = NextResponse.next();
			response.headers.set("X-Network-Error", "true");
			return response;
		}

		const response = NextResponse.redirect(new URL("/", request.url));
		// Bersihkan cookie jika terjadi error
		response.cookies.delete("auth_token");
		return response;
	}
}

export const config = {
	matcher: ["/", "/dashboard/:path*"],
};
