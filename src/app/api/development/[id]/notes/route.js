import { NextResponse } from "next/server";
import { createConnection } from "@/lib/db";
import { getUser } from "@/lib/auth";

export async function GET(request, { params }) {
	try {
		const { id } = params;

		const connection = await createConnection();

		// Get notes/comments for the request
		const [notesResult] = await connection.execute(
			`
			SELECT 
				dn.note_id,
				dn.note,
				dn.note_type,
				dn.created_by,
				p.nama as created_by_name,
				dn.created_date
			FROM development_notes dn
			LEFT JOIN pegawai p ON dn.created_by = p.nik
			WHERE dn.request_id = ?
			ORDER BY dn.created_date DESC
		`,
			[id]
		);

		await connection.end();

		// Helper function to format date safely
		const formatDate = (dateValue) => {
			if (!dateValue) return null;
			try {
				const date = new Date(dateValue);
				if (isNaN(date.getTime())) return null;
				return date.toLocaleString("id-ID", {
					year: "numeric",
					month: "long",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					timeZone: "Asia/Jakarta",
				});
			} catch (error) {
				console.error("Error formatting date:", error);
				return null;
			}
		};

		// Format dates
		const formattedNotes = notesResult.map((note) => ({
			...note,
			created_date: formatDate(note.created_date),
		}));

		return NextResponse.json({
			status: "success",
			data: formattedNotes,
		});
	} catch (error) {
		console.error("Error fetching notes:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil komentar",
			},
			{ status: 500 }
		);
	}
}

export async function POST(request, { params }) {
	try {
		const { id } = params;
		const body = await request.json();
		const { note, note_type = "comment" } = body;

		// Get user info from token
		const currentUser = await getUser();
		if (!currentUser) {
			return NextResponse.json(
				{ status: "error", error: "Token tidak ditemukan atau tidak valid" },
				{ status: 401 }
			);
		}

		// Validation
		if (!note || !note.trim()) {
			return NextResponse.json(
				{
					status: "error",
					error: "Komentar tidak boleh kosong",
				},
				{ status: 400 }
			);
		}

		if (note.length > 5000) {
			return NextResponse.json(
				{
					status: "error",
					error: "Komentar maksimal 5000 karakter",
				},
				{ status: 400 }
			);
		}

		// Validate note_type
		const validNoteTypes = [
			"comment",
			"feedback",
			"approval",
			"rejection",
			"clarification",
			"update",
		];
		if (!validNoteTypes.includes(note_type)) {
			return NextResponse.json(
				{
					status: "error",
					error: "Jenis komentar tidak valid",
				},
				{ status: 400 }
			);
		}

		// Safe date formatter (local to POST)
		const safeFormatDate = (dateValue) => {
			if (!dateValue) return null;
			try {
				const date = new Date(dateValue);
				if (isNaN(date.getTime())) return null;
				return date.toLocaleString("id-ID", {
					year: "numeric",
					month: "long",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					timeZone: "Asia/Jakarta",
				});
			} catch (error) {
				console.error("Error formatting date:", error);
				return null;
			}
		};

		const connection = await createConnection();

		// Ensure created_by always has a valid NIK
		let createdByNik = currentUser?.nik ?? null;
		if (!createdByNik) {
			const [
				nikRows,
			] = await connection.execute(
				"SELECT nik FROM pegawai WHERE id = ? OR nik = ? LIMIT 1",
				[currentUser?.id ?? null, currentUser?.username ?? null]
			);
			if (nikRows && nikRows.length > 0) {
				createdByNik = nikRows[0].nik;
			}
		}

		if (!createdByNik) {
			await connection.end();
			return NextResponse.json(
				{
					status: "error",
					error: "Data pengguna tidak valid (NIK tidak ditemukan)",
				},
				{ status: 400 }
			);
		}

		// Check if request exists
		const [
			requestResult,
		] = await connection.execute(
			"SELECT request_id FROM development_requests WHERE request_id = ?",
			[id]
		);

		if (requestResult.length === 0) {
			await connection.end();
			return NextResponse.json(
				{ status: "error", error: "Pengajuan tidak ditemukan" },
				{ status: 404 }
			);
		}

		// Insert new note
		const insertQuery = `
			INSERT INTO development_notes (request_id, note, note_type, created_by)
			VALUES (?, ?, ?, ?)
		`;

		const [result] = await connection.execute(insertQuery, [
			id,
			note.trim(),
			note_type,
			createdByNik,
		]);

		// Get the newly created note with user info
		const [newNoteResult] = await connection.execute(
			`
			SELECT 
				dn.note_id,
				dn.note,
				dn.note_type,
				dn.created_by,
				p.nama as created_by_name,
				dn.created_date
			FROM development_notes dn
			LEFT JOIN pegawai p ON dn.created_by = p.nik
			WHERE dn.note_id = ?
		`,
			[result.insertId]
		);

		await connection.end();

		const newNote = newNoteResult[0];
		const formattedNote = {
			...newNote,
			created_date: safeFormatDate(newNote.created_date),
		};

		return NextResponse.json({
			status: "success",
			message: "Komentar berhasil ditambahkan",
			data: formattedNote,
		});
	} catch (error) {
		console.error("Error adding note:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal menambahkan komentar",
			},
			{ status: 500 }
		);
	}
}
