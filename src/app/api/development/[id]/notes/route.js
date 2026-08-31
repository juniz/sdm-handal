import { NextResponse } from "next/server";
import {
	addDevelopmentNote,
	fetchDevelopmentRequestDetail,
	getAuthToken,
} from "@/lib/development-gql-client";
import { validateIdParam } from "@/lib/server-component-security";

export async function GET(request, props) {
	const params = await props.params;
	try {
		const id = validateIdParam(params.id);
		const token = await getAuthToken(request);

		const detail = await fetchDevelopmentRequestDetail(id, token);
		if (!detail || !detail.request) {
			return NextResponse.json(
				{ status: "error", error: "Pengajuan tidak ditemukan" },
				{ status: 404 }
			);
		}

		return NextResponse.json({
			status: "success",
			data: detail.notes || [],
		});
	} catch (error) {
		console.error("[API/development/[id]/notes] Error fetching notes:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal mengambil komentar",
			},
			{ status: 500 }
		);
	}
}

export async function POST(request, props) {
	const params = await props.params;
	try {
		const id = validateIdParam(params.id);
		const token = await getAuthToken(request);
		if (!token) {
			return NextResponse.json(
				{ status: "error", error: "Token tidak ditemukan atau tidak valid" },
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { note, note_type, noteType = "comment" } = body;

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

		const createdNote = await addDevelopmentNote(
			id,
			{
				note: note.trim(),
				noteType: note_type ?? noteType ?? "comment",
			},
			token
		);

		return NextResponse.json({
			status: "success",
			message: "Komentar berhasil ditambahkan",
			data: createdNote,
		});
	} catch (error) {
		console.error("[API/development/[id]/notes] Error adding note:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal menambahkan komentar",
			},
			{ status: 500 }
		);
	}
}
