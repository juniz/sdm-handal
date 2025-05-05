import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
	try {
		const cookieStore = cookies();
		await cookieStore.delete("auth_token");

		return NextResponse.json({ message: "Logout berhasil" });
	} catch (error) {
		console.error("Logout error:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat logout" },
			{ status: 500 }
		);
	}
}
