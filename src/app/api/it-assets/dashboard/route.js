import { NextResponse } from "next/server";
import { select, rawQuery } from "@/lib/db-helper";

export async function GET(request) {
	try {
		// Dapatkan statistik total berdasarkan status
		const queries = `
            SELECT 
                COUNT(*) as totalAssets,
                SUM(CASE WHEN status = 'Tersedia' THEN 1 ELSE 0 END) as available,
                SUM(CASE WHEN status = 'Dipinjam' THEN 1 ELSE 0 END) as borrowed,
                SUM(CASE WHEN status = 'Diperbaiki' THEN 1 ELSE 0 END) as maintenance,
                SUM(CASE WHEN status = 'Rusak' THEN 1 ELSE 0 END) as broken
            FROM it_assets
			WHERE status != 'Dihapus/Afkir';
        `;
		
		const assetsData = await rawQuery(queries);
		
		let stats = {
			totalAssets: 0,
			available: 0,
			borrowed: 0,
			maintenance: 0,
			broken: 0,
            overdueLoans: 0,
			warrantyExpiring: 0
		};

		if (assetsData && assetsData.length > 0) {
            stats = {
                ...stats,
                totalAssets: Number(assetsData[0].totalAssets) || 0,
                available: Number(assetsData[0].available) || 0,
                borrowed: Number(assetsData[0].borrowed) || 0,
                maintenance: Number(assetsData[0].maintenance) || 0,
                broken: Number(assetsData[0].broken) || 0,
            };
		}

		// Karena tabelnya belum jalan (menunggu db setup user), kita kembalikan stats dulu.
		return NextResponse.json(stats);
	} catch (error) {
		console.error("Dashboard IT Assets API Error:", error);
		// Return 500 but still gives default values in case tables don't exist yet
		return NextResponse.json(
			{
                totalAssets: 0,
                available: 0,
                borrowed: 0,
                maintenance: 0,
                broken: 0,
                overdueLoans: 0,
                warrantyExpiring: 0
            },
			{ status: 500 }
		);
	}
}
