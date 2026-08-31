import { NextResponse } from "next/server";
import {
	getAuthToken,
	fetchTicketAssignments,
	assignTicketGql,
	releaseTicketAssignmentGql,
	updateTicketStatusGql,
} from "@/lib/ticket-assignment-gql-client";

export async function GET(request) {
	try {
		const token = await getAuthToken(request);
		if (!token) {
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Token tidak valid",
				},
				{ status: 401 }
			);
		}

		const { searchParams } = new URL(request.url);
		const status = searchParams.get("status");
		const priority = searchParams.get("priority");
		const category = searchParams.get("category");
		const category_id = searchParams.get("category_id");
		const assigned_to = searchParams.get("assigned_to");
		const search = searchParams.get("search");
		const start_date = searchParams.get("start_date");
		const end_date = searchParams.get("end_date");
		const department_id = searchParams.get("department_id");
		const page = parseInt(searchParams.get("page"), 10) || 1;
		const limit = parseInt(searchParams.get("limit"), 10) || 10;
		const offset = (page - 1) * limit;

		const filter = {};
		if (status) filter.status = status;
		if (priority) filter.priority = priority;
		if (category) filter.category = category;
		if (category_id) filter.categoryId = parseInt(category_id, 10);
		if (assigned_to) filter.assignedTo = assigned_to;
		if (department_id) filter.departmentId = department_id;
		if (start_date) filter.startDate = start_date;
		if (end_date) filter.endDate = end_date;
		if (search) filter.search = search;

		const { total, items } = await fetchTicketAssignments(
			filter,
			limit,
			offset,
			token
		);

		return NextResponse.json({
			status: "success",
			data: items,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		console.error("Error fetching assigned tickets:", error);
		const status =
			error.message?.includes("Forbidden") ||
			error.message?.includes("Akses ditolak")
				? 403
				: error.message?.includes("Unauthorized")
					? 401
					: 500;
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal mengambil data ticket",
			},
			{ status }
		);
	}
}

export async function POST(request) {
	try {
		const token = await getAuthToken(request);
		if (!token) {
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Token tidak valid",
				},
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { ticket_id, assigned_to } = body;

		if (!ticket_id || !assigned_to) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket ID dan Assigned To harus diisi",
				},
				{ status: 400 }
			);
		}

		await assignTicketGql(
			{
				ticketId: parseInt(ticket_id, 10),
				assignedTo: String(assigned_to),
			},
			token
		);

		return NextResponse.json({
			status: "success",
			message: "Ticket berhasil ditugaskan",
		});
	} catch (error) {
		console.error("Error assigning ticket:", error);
		const status =
			error.message?.includes("Forbidden") ||
			error.message?.includes("Akses ditolak")
				? 403
				: error.message?.includes("Unauthorized")
					? 401
					: error.message?.includes("tidak ditemukan")
						? 404
						: 500;
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal menugaskan ticket",
			},
			{ status }
		);
	}
}

export async function PUT(request) {
	try {
		const token = await getAuthToken(request);
		if (!token) {
			return NextResponse.json(
				{
					status: "error",
					error: "Unauthorized - Token tidak valid",
				},
				{ status: 401 }
			);
		}

		const body = await request.json();
		const { ticket_id, status, notes, action } = body;

		if (action === "release") {
			if (!ticket_id) {
				return NextResponse.json(
					{
						status: "error",
						error: "Ticket ID harus diisi",
					},
					{ status: 400 }
				);
			}

			await releaseTicketAssignmentGql(parseInt(ticket_id, 10), token);

			return NextResponse.json({
				status: "success",
				message: "Assignment berhasil dilepas",
			});
		}

		if (!ticket_id || !status) {
			return NextResponse.json(
				{
					status: "error",
					error: "Ticket ID dan Status harus diisi",
				},
				{ status: 400 }
			);
		}

		await updateTicketStatusGql(
			{
				ticketId: parseInt(ticket_id, 10),
				status,
				notes: notes || undefined,
			},
			token
		);

		return NextResponse.json({
			status: "success",
			message: `Status ticket berhasil diubah ke ${status}`,
		});
	} catch (error) {
		console.error("Error updating ticket status:", error);
		const status =
			error.message?.includes("Forbidden") ||
			error.message?.includes("Akses ditolak")
				? 403
				: error.message?.includes("Unauthorized")
					? 401
					: error.message?.includes("tidak ditemukan")
						? 404
						: 500;
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal mengupdate status ticket",
			},
			{ status }
		);
	}
}
