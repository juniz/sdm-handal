import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { selectFirst, rawQuery } from "@/lib/db-helper";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Helper check authorization
async function isAuthorizedForEmployee(loggedInUser, targetEmployeeId) {
	if (Number(loggedInUser.id) === Number(targetEmployeeId)) return true;

	// Check if IT department (admin)
	if (loggedInUser.departemen?.toUpperCase() === "IT") return true;

	// Check if logged-in user is supervisor of targetEmployeeId (direct personal mapping)
	const personalMapping = await selectFirst({
		table: "supervisor_mapping",
		where: {
			supervisor_id: loggedInUser.id,
			pegawai_id: targetEmployeeId,
			tipe_relasi: "personal",
			is_aktif: 1
		}
	});
	if (personalMapping) return true;

	// Check if logged-in user is supervisor of targetEmployeeId's unit
	const target = await selectFirst({
		table: "pegawai",
		where: { id: targetEmployeeId },
		select: ["departemen", "bidang"]
	});

	if (target) {
		const unitMapping = await rawQuery(`
			SELECT id FROM supervisor_mapping
			WHERE supervisor_id = ?
			  AND tipe_relasi = 'unit'
			  AND is_aktif = 1
			  AND (
			    (tipe_unit = 'departemen' AND kode_unit = ?) OR
			    (tipe_unit = 'bidang' AND kode_unit = ?)
			  )
			LIMIT 1
		`, [loggedInUser.id, target.departemen, target.bidang]);

		if (unitMapping && unitMapping.length > 0) return true;
	}

	return false;
}

export async function GET(request) {
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

		const { searchParams } = new URL(request.url);
		const pegawaiId = searchParams.get("pegawai_id") || loggedInUser.id;
		const bulan = searchParams.get("bulan"); // format: 1-12 or 01-12
		const tahun = searchParams.get("tahun"); // format: YYYY

		if (!bulan || !tahun) {
			return NextResponse.json({ error: "Bulan dan tahun diperlukan" }, { status: 400 });
		}

		// Auth gate
		const isAuthorized = await isAuthorizedForEmployee(loggedInUser, pegawaiId);
		if (!isAuthorized) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		const formattedBulan = String(bulan).padStart(2, "0");
		const formattedTahun = String(tahun);

		// Get schedule reguler
		const schedule = await selectFirst({
			table: "jadwal_pegawai",
			where: {
				id: pegawaiId,
				bulan: formattedBulan,
				tahun: formattedTahun
			}
		});

		// Get schedule tambahan (bonus shifts)
		const scheduleTambahan = await selectFirst({
			table: "jadwal_tambahan",
			where: {
				id: pegawaiId,
				bulan: formattedBulan,
				tahun: formattedTahun
			}
		});

		if (!schedule && !scheduleTambahan) {
			return NextResponse.json({
				success: true,
				hasSchedule: false,
				schedule: null,
				isTambahan: null,
				message: "Jadwal tidak ditemukan untuk bulan/tahun ini"
			});
		}

		// Parse h1 - h31 days
		const days = {};
		const isTambahanMap = {};
		
		for (let i = 1; i <= 31; i++) {
			let shift = schedule ? (schedule[`h${i}`] || "") : "";
			let fromTambahan = false;

			// If no regular shift, check jadwal_tambahan
			if (shift === "") {
				shift = scheduleTambahan ? (scheduleTambahan[`h${i}`] || "") : "";
				if (shift !== "") {
					fromTambahan = true;
				}
			}

			days[`h${i}`] = shift;
			isTambahanMap[`h${i}`] = fromTambahan;
		}

		return NextResponse.json({
			success: true,
			hasSchedule: true,
			schedule: days,
			isTambahan: isTambahanMap
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/jadwal:", error);
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
	}
}
