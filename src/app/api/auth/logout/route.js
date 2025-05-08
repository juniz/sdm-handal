import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
	try {
		const cookieStore = cookies();

		// Hapus cookie auth_token
		cookieStore.delete("auth_token");

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
