import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { removeServerCookie } from "@/lib/auth";

export async function POST() {
	try {
		const cookieStore = cookies();
		removeServerCookie(cookieStore);

		return NextResponse.json({
			status: 200,
			message: "Berhasil logout",
		});
	} catch (error) {
		console.error("Error during logout:", error);
		return NextResponse.json(
			{ error: "Terjadi kesalahan saat logout" },
			{ status: 500 }
		);
	}
}
