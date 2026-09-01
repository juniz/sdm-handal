import { NextResponse } from "next/server";
import {
	fetchPengajuanKtaList,
	createPengajuanKtaGql,
	updatePengajuanKtaStatusGql,
	deletePengajuanKtaGql,
	getAuthToken,
} from "@/lib/pengajuan-kta-gql-client";

// GET - Ambil data pengajuan KTA via NestJS GraphQL
export async function GET(request) {
	try {
		const token = await getAuthToken(request);
		const { searchParams } = new URL(request.url);

		const filter = {
			search: searchParams.get("search") || "",
			jenis: searchParams.get("jenis") || "ALL",
			status: searchParams.get("status") || "ALL",
		};

		const limit = parseInt(searchParams.get("limit") || "100", 10);
		const offset = parseInt(searchParams.get("offset") || "0", 10);

		const result = await fetchPengajuanKtaList(filter, limit, offset, token);

		return NextResponse.json({
			status: 200,
			message: "Data pengajuan KTA berhasil diambil",
			data: result.items || [],
			total: result.total || 0,
		});
	} catch (error) {
		console.error("[API/pengajuan-kta] Error fetching data:", error);
		return NextResponse.json(
			{ message: error.message || "Gagal mengambil data pengajuan KTA" },
			{ status: error.message?.includes("Unauthorized") ? 401 : 500 }
		);
	}
}

// POST - Buat pengajuan KTA baru via NestJS GraphQL
export async function POST(request) {
	try {
		const token = await getAuthToken(request);
		const body = await request.json();
		const { jenis, alasan } = body;

		if (!jenis || !alasan) {
			return NextResponse.json(
				{ message: "Jenis dan alasan pengajuan harus diisi" },
				{ status: 400 }
			);
		}

		if (alasan.trim().length < 10) {
			return NextResponse.json(
				{ message: "Alasan pengajuan minimal 10 karakter" },
				{ status: 400 }
			);
		}

		const created = await createPengajuanKtaGql(
			{
				jenis,
				alasan: alasan.trim(),
			},
			token
		);

		return NextResponse.json({
			status: 201,
			message: "Pengajuan KTA berhasil disubmit",
			data: created,
		});
	} catch (error) {
		console.error("[API/pengajuan-kta] Error creating request:", error);
		return NextResponse.json(
			{ message: error.message || "Gagal submit pengajuan KTA" },
			{ status: error.message?.includes("Unauthorized") ? 401 : 400 }
		);
	}
}

// PUT - Update status pengajuan via NestJS GraphQL
export async function PUT(request) {
	try {
		const token = await getAuthToken(request);
		const body = await request.json();
		const { id, status, alasan_ditolak, alasanDitolak } = body;

		if (!id || !status) {
			return NextResponse.json(
				{ message: "ID dan status harus diisi" },
				{ status: 400 }
			);
		}

		const updated = await updatePengajuanKtaStatusGql(
			{
				id: parseInt(id, 10),
				status,
				alasanDitolak: alasan_ditolak || alasanDitolak || undefined,
			},
			token
		);

		return NextResponse.json({
			status: 200,
			message: "Status pengajuan KTA berhasil diupdate",
			data: updated,
		});
	} catch (error) {
		console.error("[API/pengajuan-kta] Error updating status:", error);
		return NextResponse.json(
			{ message: error.message || "Gagal update status" },
			{ status: error.message?.includes("Forbidden") ? 403 : 400 }
		);
	}
}

// DELETE - Hapus pengajuan KTA via NestJS GraphQL
export async function DELETE(request) {
	try {
		const token = await getAuthToken(request);
		const body = await request.json();
		const { id } = body;

		if (!id) {
			return NextResponse.json(
				{ message: "ID pengajuan harus diisi" },
				{ status: 400 }
			);
		}

		const success = await deletePengajuanKtaGql(id, token);

		return NextResponse.json({
			status: 200,
			message: "Pengajuan KTA berhasil dihapus",
			success,
		});
	} catch (error) {
		console.error("[API/pengajuan-kta] Error deleting pengajuan:", error);
		return NextResponse.json(
			{ message: error.message || "Gagal menghapus pengajuan" },
			{ status: error.message?.includes("Forbidden") ? 403 : 400 }
		);
	}
}
