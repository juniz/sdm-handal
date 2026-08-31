import { NextResponse } from "next/server";
import {
	getAuthToken,
	fetchTicketMasterData,
} from "@/lib/ticket-assignment-gql-client";

export async function GET(request) {
	try {
		const token = await getAuthToken(request);
		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type");

		const masterData = await fetchTicketMasterData(token);

		if (type) {
			let data = [];
			switch (type) {
				case "categories":
					data = masterData.categories;
					break;
				case "priorities":
					data = masterData.priorities;
					break;
				case "statuses":
					data = masterData.statuses;
					break;
				case "departments":
					data = masterData.departments;
					break;
				default:
					return NextResponse.json(
						{
							status: "error",
							error: "Tipe data tidak valid",
						},
						{ status: 400 }
					);
			}

			return NextResponse.json({
				status: "success",
				data,
			});
		}

		return NextResponse.json({
			status: "success",
			data: masterData,
		});
	} catch (error) {
		console.error("Error fetching master data:", error);
		return NextResponse.json(
			{
				status: "error",
				error: error.message || "Gagal mengambil data master",
			},
			{ status: 500 }
		);
	}
}
