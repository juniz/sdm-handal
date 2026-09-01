import { NextResponse } from "next/server";
import moment from "moment-timezone";
import {
	fetchPengajuanKtaStats,
	getAuthToken,
} from "@/lib/pengajuan-kta-gql-client";

// Set timezone ke Jakarta
moment.tz.setDefault("Asia/Jakarta");

// GET - Statistik pengajuan KTA via NestJS GraphQL
export async function GET(request) {
	try {
		const token = await getAuthToken(request);
		const { searchParams } = new URL(request.url);
		const year = searchParams.get("year") || moment().format("YYYY");
		const month = searchParams.get("month") || moment().format("MM");

		const stats = await fetchPengajuanKtaStats(
			parseInt(year, 10),
			parseInt(month, 10),
			token
		);

		return NextResponse.json({
			status: 200,
			message: "Statistik pengajuan KTA berhasil diambil",
			data: stats,
		});
	} catch (error) {
		console.error("[API/pengajuan-kta/stats] Error fetching stats:", error);
		return NextResponse.json(
			{ message: error.message || "Gagal mengambil statistik pengajuan KTA" },
			{ status: error.message?.includes("Forbidden") ? 403 : 500 }
		);
	}
}
