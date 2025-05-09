import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function middleware(request) {
	console.log("Middleware running for path:", request.nextUrl.pathname);

	// Skip middleware untuk rute login dan API
	if (
		request.nextUrl.pathname === "/" ||
		request.nextUrl.pathname.startsWith("/api/")
	) {
		console.log("Skipping middleware for login/api route");
		return NextResponse.next();
	}

	try {
		const cookieStore = await cookies();
		const token = await cookieStore.get("auth_token");
		const tokenValue = token?.value;

		console.log("Token found in cookies:", tokenValue ? "Yes" : "No");

		if (!tokenValue) {
			console.log("No token found, redirecting to login");
			return NextResponse.redirect(new URL("/", request.url));
		}

		console.log("Token valid, proceeding to next middleware");
		return NextResponse.next();
	} catch (error) {
		console.error("Error in middleware:", error);
		return NextResponse.redirect(new URL("/", request.url));
	}
}

export const config = {
	matcher: ["/dashboard/:path*"],
};
