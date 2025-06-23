import { NextResponse } from "next/server";
import moment from "moment-timezone";
import { getUser } from "@/lib/auth";
import { getPengajuanStats } from "@/lib/pengajuan-kta-helper";
import { rawQuery } from "@/lib/db-helper";

// Set timezone ke Jakarta
moment.tz.setDefault("Asia/Jakarta");

// GET - Statistik pengajuan KTA
export async function GET(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const userId = user.id;

		// Ambil data user untuk cek department
		const userData = await rawQuery(
			`
			SELECT p.departemen, d.nama as departemen_name 
			FROM pegawai p
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE p.id = ?
		`,
			[userId]
		);

		if (userData.length === 0) {
			return NextResponse.json(
				{ message: "Data pegawai tidak ditemukan" },
				{ status: 404 }
			);
		}

		const userDepartment = userData[0].departemen;
		const userDepartmentName = userData[0].departemen_name;

		// Cek apakah user dari IT atau HRD
		const isITorHRD =
			userDepartment === "IT" ||
			userDepartment === "HRD" ||
			userDepartmentName?.toLowerCase().includes("it") ||
			userDepartmentName?.toLowerCase().includes("teknologi") ||
			userDepartmentName?.toLowerCase().includes("hrd") ||
			userDepartmentName?.toLowerCase().includes("human resource");

		// Hanya IT/HRD yang bisa akses statistik
		if (!isITorHRD) {
			return NextResponse.json(
				{ message: "Tidak memiliki akses untuk melihat statistik" },
				{ status: 403 }
			);
		}

		const { searchParams } = new URL(request.url);
		const year = searchParams.get("year") || moment().format("YYYY");
		const month = searchParams.get("month") || moment().format("MM");

		// Ambil statistik untuk bulan yang diminta
		const currentStats = await getPengajuanStats(
			parseInt(year),
			parseInt(month)
		);

		// Ambil statistik total per status
		const statusStats = await rawQuery(
			`
			SELECT 
				status,
				COUNT(*) as count
			FROM pengajuan_kta 
			WHERE no_pengajuan LIKE ?
			GROUP BY status
		`,
			[`KTA-${year}-${month}-%`]
		);

		// Ambil statistik bulanan untuk tahun ini
		const monthlyStats = await rawQuery(
			`
			SELECT 
				MONTH(created_at) as month,
				COUNT(*) as total,
				COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
				COUNT(CASE WHEN status = 'disetujui' THEN 1 END) as disetujui,
				COUNT(CASE WHEN status = 'ditolak' THEN 1 END) as ditolak,
				COUNT(CASE WHEN status = 'selesai' THEN 1 END) as selesai
			FROM pengajuan_kta 
			WHERE YEAR(created_at) = ?
			GROUP BY MONTH(created_at)
			ORDER BY month
		`,
			[year]
		);

		return NextResponse.json({
			status: 200,
			message: "Statistik pengajuan KTA berhasil diambil",
			data: {
				period: {
					year: parseInt(year),
					month: parseInt(month),
					month_name: moment(`${year}-${month}`, "YYYY-MM").format("MMMM YYYY"),
				},
				current_month: currentStats,
				status_breakdown: statusStats.reduce((acc, item) => {
					acc[item.status] = item.count;
					return acc;
				}, {}),
				monthly_stats: monthlyStats,
				next_number: (currentStats.last_sequence || 0) + 1,
				next_no_pengajuan: `KTA-${year}-${month}-${(
					(currentStats.last_sequence || 0) + 1
				)
					.toString()
					.padStart(4, "0")}`,
			},
		});
	} catch (error) {
		console.error("Error fetching pengajuan stats:", error);
		return NextResponse.json(
			{ message: "Terjadi kesalahan saat mengambil statistik pengajuan KTA" },
			{ status: 500 }
		);
	}
}
