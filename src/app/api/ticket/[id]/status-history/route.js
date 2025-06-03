import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

// GET - Ambil status history ticket berdasarkan ID
export async function GET(request, { params }) {
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

		const ticketId = params.id;

		if (!ticketId) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket ID harus diisi",
				},
				{ status: 400 }
			);
		}

		// Cek apakah ticket ada
		const ticketExists = await rawQuery(
			"SELECT ticket_id FROM tickets WHERE ticket_id = ?",
			[ticketId]
		);

		if (ticketExists.length === 0) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket tidak ditemukan",
				},
				{ status: 404 }
			);
		}

		// Query untuk mengambil status history dengan informasi status dan user
		const historyQuery = `
			SELECT 
				sh.status_history_id,
				sh.ticket_id,
				sh.old_status,
				sh.new_status,
				sh.changed_by,
				sh.change_date,
				old_st.status_name as old_status_name,
				new_st.status_name as new_status_name,
				p.nama as changed_by_name,
				d.nama as changed_by_department
			FROM status_history_ticket sh
			LEFT JOIN statuses_ticket old_st ON sh.old_status = old_st.status_id
			LEFT JOIN statuses_ticket new_st ON sh.new_status = new_st.status_id
			LEFT JOIN pegawai p ON sh.changed_by = p.nik
			LEFT JOIN departemen d ON p.departemen = d.dep_id
			WHERE sh.ticket_id = ?
			ORDER BY sh.change_date ASC
		`;

		const history = await rawQuery(historyQuery, [ticketId]);

		// Format tanggal dan data
		const formattedHistory = history.map((record) => ({
			...record,
			change_date: moment(record.change_date).format("DD MMMM YYYY HH:mm:ss"),
			change_date_relative: moment(record.change_date).fromNow(),
			old_status_display: record.old_status_name || "Ticket Baru",
			new_status_display: record.new_status_name || "Unknown",
			status_change: record.old_status_name
				? `${record.old_status_name} → ${record.new_status_name}`
				: `Ticket Dibuat → ${record.new_status_name}`,
		}));

		// Get ticket info untuk context
		const ticketInfo = await rawQuery(
			`
			SELECT 
				t.no_ticket,
				t.title,
				s.status_name as current_status
			FROM tickets t
			LEFT JOIN statuses_ticket s ON t.current_status_id = s.status_id
			WHERE t.ticket_id = ?
		`,
			[ticketId]
		);

		return NextResponse.json({
			status: "success",
			data: {
				ticket_info: ticketInfo[0] || null,
				history: formattedHistory,
				total_changes: formattedHistory.length,
			},
		});
	} catch (error) {
		console.error("Error fetching ticket status history:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil riwayat status ticket",
			},
			{ status: 500 }
		);
	}
}
