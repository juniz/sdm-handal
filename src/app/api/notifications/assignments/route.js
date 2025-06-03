import { NextResponse } from "next/server";
import { rawQuery, update } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

// GET - Ambil notifikasi assignment untuk user yang sedang login
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
		const limit = parseInt(searchParams.get("limit")) || 10;
		const unreadOnly = searchParams.get("unread_only") === "true";

		// Query untuk mengambil notifikasi assignment
		let whereClause = "WHERE ta.assigned_to = ?";
		let queryParams = [user.username];

		if (unreadOnly) {
			whereClause += " AND ta.is_read = FALSE";
		}

		const notificationsQuery = `
			SELECT 
				ta.assignment_id,
				ta.ticket_id,
				ta.assigned_date,
				ta.is_read,
				t.no_ticket,
				t.title,
				t.description,
				t.submission_date,
				p.nama as requester_name,
				d.nama as requester_department,
				c.category_name,
				pr.priority_name,
				pr.priority_level,
				s.status_name as current_status,
				assigned_by_pegawai.nama as assigned_by_name
			FROM assignments_ticket ta
			JOIN tickets t ON ta.ticket_id = t.ticket_id
			LEFT JOIN pegawai p ON t.user_id = p.nik
			LEFT JOIN departemen d ON t.departement_id = d.dep_id
			LEFT JOIN categories_ticket c ON t.category_id = c.category_id
			LEFT JOIN priorities_ticket pr ON t.priority_id = pr.priority_id
			LEFT JOIN statuses_ticket s ON t.current_status_id = s.status_id
			LEFT JOIN pegawai assigned_by_pegawai ON ta.assigned_by = assigned_by_pegawai.nik
			${whereClause}
			AND ta.released_date IS NULL
			ORDER BY ta.assigned_date DESC
			LIMIT ?
		`;

		queryParams.push(limit);

		const notifications = await rawQuery(notificationsQuery, queryParams);

		// Format tanggal dan tambahkan informasi tambahan
		const formattedNotifications = notifications.map((notification) => ({
			...notification,
			assigned_date: moment(notification.assigned_date).format(
				"DD MMMM YYYY HH:mm"
			),
			submission_date: moment(notification.submission_date).format(
				"DD MMMM YYYY HH:mm"
			),
			time_ago: moment(notification.assigned_date).fromNow(),
			is_urgent: notification.priority_level >= 4, // High/Critical priority
		}));

		// Hitung total unread
		const unreadCountQuery = `
			SELECT COUNT(*) as unread_count
			FROM assignments_ticket ta
			WHERE ta.assigned_to = ? AND ta.is_read = FALSE AND ta.released_date IS NULL
		`;

		const [{ unread_count }] = await rawQuery(unreadCountQuery, [
			user.username,
		]);

		return NextResponse.json({
			status: "success",
			data: {
				notifications: formattedNotifications,
				unread_count: parseInt(unread_count),
			},
		});
	} catch (error) {
		console.error("Error fetching assignment notifications:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil notifikasi assignment",
			},
			{ status: 500 }
		);
	}
}

// PUT - Mark notification as read
export async function PUT(request) {
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

		const body = await request.json();
		const { assignment_id, mark_all = false } = body;

		if (mark_all) {
			// Mark all notifications as read for this user
			await rawQuery(
				"UPDATE assignments_ticket SET is_read = TRUE WHERE assigned_to = ? AND released_date IS NULL",
				[user.username]
			);
		} else if (assignment_id) {
			// Mark specific notification as read
			await update({
				table: "assignments_ticket",
				data: { is_read: true },
				where: {
					assignment_id: assignment_id,
					assigned_to: user.username,
				},
			});
		} else {
			return NextResponse.json(
				{
					status: "error",
					error: "Assignment ID atau mark_all parameter harus diisi",
				},
				{ status: 400 }
			);
		}

		return NextResponse.json({
			status: "success",
			message: "Notifikasi berhasil ditandai sebagai sudah dibaca",
		});
	} catch (error) {
		console.error("Error marking notification as read:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal menandai notifikasi sebagai sudah dibaca",
			},
			{ status: 500 }
		);
	}
}
