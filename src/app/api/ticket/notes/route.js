import { NextResponse } from "next/server";
import { rawQuery } from "@/lib/db-helper";
import { getUser } from "@/lib/auth";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

// GET - Ambil notes berdasarkan ticket_id
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
		const ticketId = searchParams.get("ticket_id");

		// Validasi input
		if (!ticketId) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket ID harus diisi",
				},
				{ status: 400 }
			);
		}

		// Cek apakah user memiliki akses ke ticket ini
		const ticketAccess = await rawQuery(
			`SELECT t.ticket_id, t.user_id, 
			 CASE 
				WHEN t.user_id = ? THEN 'owner'
				WHEN p.departemen = 'IT' THEN 'it_staff'
				ELSE 'no_access'
			 END as access_level
			 FROM tickets t
			 LEFT JOIN pegawai p ON p.nik = ?
			 WHERE t.ticket_id = ?`,
			[user.username, user.username, ticketId]
		);

		if (ticketAccess.length === 0) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket tidak ditemukan",
				},
				{ status: 404 }
			);
		}

		if (ticketAccess[0].access_level === "no_access") {
			return NextResponse.json(
				{
					status: "error",
					error: "Anda tidak memiliki akses untuk melihat notes ticket ini",
				},
				{ status: 403 }
			);
		}

		// Query untuk mengambil notes dengan informasi pembuat
		const notesQuery = `
			SELECT 
				tn.note_id,
				tn.note,
				tn.note_type,
				tn.created_date,
				tn.created_by,
				p.nama as created_by_name
			FROM ticket_notes tn
			LEFT JOIN pegawai p ON tn.created_by = p.nik
			WHERE tn.ticket_id = ?
			ORDER BY tn.created_date ASC
		`;

		const notes = await rawQuery(notesQuery, [ticketId]);

		// Format tanggal dan kategorisasi notes
		const formattedNotes = notes.map((note) => ({
			...note,
			created_date: moment(note.created_date).format("DD MMMM YYYY HH:mm"),
			created_date_relative: moment(note.created_date).fromNow(),
		}));

		// Kelompokkan notes berdasarkan tipe
		const groupedNotes = {
			status_update: formattedNotes.filter(
				(note) => note.note_type === "status_update"
			),
			feedback: formattedNotes.filter((note) => note.note_type === "feedback"),
			general: formattedNotes.filter((note) => note.note_type === "general"),
			assignment: formattedNotes.filter(
				(note) => note.note_type === "assignment"
			),
			resolution: formattedNotes.filter(
				(note) => note.note_type === "resolution"
			),
		};

		return NextResponse.json({
			status: "success",
			data: {
				notes: formattedNotes,
				grouped_notes: groupedNotes,
				total: formattedNotes.length,
				access_level: ticketAccess[0].access_level,
			},
		});
	} catch (error) {
		console.error("Error fetching ticket notes:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil notes ticket",
			},
			{ status: 500 }
		);
	}
}
