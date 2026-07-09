import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { selectFirst, update } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export async function POST(request, { params }) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		let verified;
		try {
			verified = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET));
		} catch (error) {
			return NextResponse.json({ error: "Unauthorized / Session Expired" }, { status: 401 });
		}

		const loggedInUser = verified.payload;
		const { id } = await params;

		// Restriction: Temporarily IT department only
		const isIT = loggedInUser.departemen?.toUpperCase() === "IT";
		if (!isIT) {
			return NextResponse.json({ error: "Forbidden - IT department access required" }, { status: 403 });
		}

		const body = await request.json();
		const { action = "lock" } = body;

		// Get rekap record
		const rekap = await selectFirst({
			table: "rekap_bulanan",
			where: { id: id }
		});

		if (!rekap) {
			return NextResponse.json({ error: "Rekap bulanan tidak ditemukan" }, { status: 404 });
		}

		if (action === "lock") {
			await update({
				table: "rekap_bulanan",
				data: {
					status_rekap: "final",
					locked_by: loggedInUser.id,
					locked_at: new Date()
				},
				where: { id: id }
			});

			return NextResponse.json({
				success: true,
				message: "Rekap bulanan berhasil dikunci",
				data: { status_rekap: "final" }
			});
		} else if (action === "unlock") {
			await update({
				table: "rekap_bulanan",
				data: {
					status_rekap: "draft",
					locked_by: null,
					locked_at: null
				},
				where: { id: id }
			});

			return NextResponse.json({
				success: true,
				message: "Kunci rekap bulanan berhasil dibuka",
				data: { status_rekap: "draft" }
			});
		} else {
			return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
		}
	} catch (error) {
		console.error("Error in POST /api/penilaian/rekap/[id]/lock:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
