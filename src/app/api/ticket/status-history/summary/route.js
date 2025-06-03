import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

// GET - Ambil ringkasan status history untuk dashboard/statistik
export async function GET(request) {
	try {
		// Ambil data user dari JWT token
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Token tidak valid",
				},
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const dateFrom = searchParams.get("date_from");
		const dateTo = searchParams.get("date_to");
		const changedBy = searchParams.get("changed_by");

		let whereConditions = [];
		let queryParams = [];

		// Filter berdasarkan tanggal
		if (dateFrom) {
			whereConditions.push("DATE(sh.change_date) >= ?");
			queryParams.push(dateFrom);
		}

		if (dateTo) {
			whereConditions.push("DATE(sh.change_date) <= ?");
			queryParams.push(dateTo);
		}

		// Filter berdasarkan user yang melakukan perubahan
		if (changedBy) {
			whereConditions.push("sh.changed_by = ?");
			queryParams.push(changedBy);
		}

		const whereClause =
			whereConditions.length > 0
				? `WHERE ${whereConditions.join(" AND ")}`
				: "";

		// Query untuk statistik perubahan status per hari
		const dailyStatsQuery = `
			SELECT 
				DATE(sh.change_date) as change_date,
				COUNT(*) as total_changes,
				COUNT(DISTINCT sh.ticket_id) as unique_tickets,
				COUNT(DISTINCT sh.changed_by) as unique_users
			FROM status_history_ticket sh
			${whereClause}
			GROUP BY DATE(sh.change_date)
			ORDER BY change_date DESC
			LIMIT 30
		`;

		const dailyStats = await rawQuery(dailyStatsQuery, queryParams);

		// Query untuk top status transitions
		const transitionsQuery = `
			SELECT 
				old_st.status_name as old_status,
				new_st.status_name as new_status,
				COUNT(*) as transition_count,
				CONCAT(
					COALESCE(old_st.status_name, 'Ticket Baru'),
					' → ',
					new_st.status_name
				) as transition_label
			FROM status_history_ticket sh
			LEFT JOIN statuses_ticket old_st ON sh.old_status = old_st.status_id
			LEFT JOIN statuses_ticket new_st ON sh.new_status = new_st.status_id
			${whereClause}
			GROUP BY sh.old_status, sh.new_status
			ORDER BY transition_count DESC
			LIMIT 10
		`;

		const transitions = await rawQuery(transitionsQuery, queryParams);

		// Query untuk top users yang sering mengubah status
		const topUsersQuery = `
			SELECT 
				sh.changed_by,
				p.nama as user_name,
				d.nama as department_name,
				COUNT(*) as total_changes,
				COUNT(DISTINCT sh.ticket_id) as unique_tickets_changed
			FROM status_history_ticket sh
			LEFT JOIN pegawai p ON sh.changed_by = p.nik
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			${whereClause}
			GROUP BY sh.changed_by
			ORDER BY total_changes DESC
			LIMIT 10
		`;

		const topUsers = await rawQuery(topUsersQuery, queryParams);

		// Query untuk recent status changes
		const recentChangesQuery = `
			SELECT 
				sh.status_history_id,
				sh.ticket_id,
				t.no_ticket,
				t.title,
				old_st.status_name as old_status,
				new_st.status_name as new_status,
				sh.changed_by,
				p.nama as changed_by_name,
				sh.change_date,
				CONCAT(
					COALESCE(old_st.status_name, 'Ticket Baru'),
					' → ',
					new_st.status_name
				) as status_change
			FROM status_history_ticket sh
			LEFT JOIN tickets t ON sh.ticket_id = t.ticket_id
			LEFT JOIN statuses_ticket old_st ON sh.old_status = old_st.status_id
			LEFT JOIN statuses_ticket new_st ON sh.new_status = new_st.status_id
			LEFT JOIN pegawai p ON sh.changed_by = p.nik
			${whereClause}
			ORDER BY sh.change_date DESC
			LIMIT 20
		`;

		const recentChanges = await rawQuery(recentChangesQuery, queryParams);

		// Query untuk total statistics
		const totalStatsQuery = `
			SELECT 
				COUNT(*) as total_status_changes,
				COUNT(DISTINCT sh.ticket_id) as total_tickets_with_changes,
				COUNT(DISTINCT sh.changed_by) as total_users_making_changes,
				MIN(sh.change_date) as first_change_date,
				MAX(sh.change_date) as last_change_date
			FROM status_history_ticket sh
			${whereClause}
		`;

		const [totalStats] = await rawQuery(totalStatsQuery, queryParams);

		// Format data
		const formattedDailyStats = dailyStats.map((stat) => ({
			...stat,
			change_date: moment(stat.change_date).format("DD MMM YYYY"),
		}));

		const formattedRecentChanges = recentChanges.map((change) => ({
			...change,
			change_date: moment(change.change_date).format("DD MMM YYYY HH:mm"),
			change_date_relative: moment(change.change_date).fromNow(),
		}));

		const formattedTotalStats = {
			...totalStats,
			first_change_date: totalStats.first_change_date
				? moment(totalStats.first_change_date).format("DD MMM YYYY HH:mm")
				: null,
			last_change_date: totalStats.last_change_date
				? moment(totalStats.last_change_date).format("DD MMM YYYY HH:mm")
				: null,
		};

		return NextResponse.json({
			status: "success",
			data: {
				total_stats: formattedTotalStats,
				daily_stats: formattedDailyStats,
				top_transitions: transitions,
				top_users: topUsers,
				recent_changes: formattedRecentChanges,
			},
		});
	} catch (error) {
		console.error("Error fetching status history summary:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil ringkasan riwayat status",
			},
			{ status: 500 }
		);
	}
}
