import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function fetchGraphQL(query, variables, token) {
	const res = await fetch(GQL_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`,
		},
		body: JSON.stringify({ query, variables }),
	});
	
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP error ${res.status}`);
	}
	
	const json = await res.json();
	if (json.errors) {
		throw new Error(json.errors[0]?.message || "GraphQL Error");
	}
	return json.data;
}

export async function GET(request) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const pegawaiId = searchParams.get("pegawai_id") ? Number(searchParams.get("pegawai_id")) : null;
		const bulan = searchParams.get("bulan"); // format: 1-12 or 01-12
		const tahun = searchParams.get("tahun"); // format: YYYY

		if (!bulan || !tahun) {
			return NextResponse.json({ error: "Bulan dan tahun diperlukan" }, { status: 400 });
		}

		const query = `
			query GetPenilaianJadwal($pegawaiId: Int, $bulan: String!, $tahun: String!) {
				penilaianJadwal(pegawaiId: $pegawaiId, bulan: $bulan, tahun: $tahun) {
					hasSchedule
					schedule {
						day
						shift
						isTambahan
					}
					shiftDetails {
						shift
						jamMasuk
						jamPulang
					}
					message
				}
			}
		`;

		const variables = {
			pegawaiId,
			bulan: String(bulan),
			tahun: String(tahun)
		};

		const data = await fetchGraphQL(query, variables, token);
		const result = data.penilaianJadwal;

		if (!result.hasSchedule) {
			return NextResponse.json({
				success: true,
				hasSchedule: false,
				schedule: null,
				isTambahan: null,
				message: result.message || "Jadwal tidak ditemukan untuk bulan/tahun ini"
			});
		}

		// Re-construct frontend expected key-value maps
		const scheduleMap = {};
		const isTambahanMap = {};

		if (result.schedule) {
			result.schedule.forEach((item) => {
				scheduleMap[`h${item.day}`] = item.shift;
				isTambahanMap[`h${item.day}`] = item.isTambahan;
			});
		}

		// Re-map shiftDetails keys to lower snake_case
		const mappedShiftDetails = (result.shiftDetails || []).map((s) => ({
			shift: s.shift,
			jam_masuk: s.jamMasuk,
			jam_pulang: s.jamPulang
		}));

		return NextResponse.json({
			success: true,
			hasSchedule: true,
			schedule: scheduleMap,
			isTambahan: isTambahanMap,
			shiftDetails: mappedShiftDetails
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/jadwal:", error);
		const status = error.message?.includes("Forbidden") ? 403 : 500;
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status });
	}
}
