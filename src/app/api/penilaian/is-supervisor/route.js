import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ isSupervisor: false }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			return NextResponse.json({ isSupervisor: false }, { status: 401 });
		}

		const loggedInUser = verified.payload;

		// Check if active supervisor in mapping
		const mapping = await rawQuery(`
			SELECT id FROM supervisor_mapping
			WHERE supervisor_id = ?
			  AND is_aktif = 1
			  AND berlaku_mulai <= CURDATE()
			  AND (berlaku_sampai IS NULL OR berlaku_sampai >= CURDATE())
			LIMIT 1
		`, [loggedInUser.id]);

		const isSupervisor = mapping && mapping.length > 0;

		return NextResponse.json({
			success: true,
			isSupervisor: isSupervisor
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/is-supervisor:", error);
		return NextResponse.json({ isSupervisor: false, error: "Internal Server Error" }, { status: 500 });
	}
}
