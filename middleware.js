import { NextResponse } from "next/server";

export function middleware(request) {
	const { pathname } = request.nextUrl;

	// Handle foto presensi dengan headers anti-cache
	if (pathname.startsWith("/photos/")) {
		const response = NextResponse.next();

		// Set headers anti-cache untuk foto presensi
		response.headers.set(
			"Cache-Control",
			"no-store, no-cache, must-revalidate, proxy-revalidate"
		);
		response.headers.set("Pragma", "no-cache");
		response.headers.set("Expires", "0");
		response.headers.set("X-Content-Type-Options", "nosniff");
		response.headers.set("X-Photo-Middleware", "active");

		return response;
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/photos/:path*", "/api/photos/:path*"],
};
