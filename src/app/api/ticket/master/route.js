import { NextResponse } from "next/server";
import { select } from "@/lib/db-helper";

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const type = searchParams.get("type");

		if (type) {
			// Jika diminta data spesifik
			let data = [];

			switch (type) {
				case "categories":
					data = await select({
						table: "categories_ticket",
						orderBy: "category_name",
						order: "ASC",
					});
					break;

				case "priorities":
					data = await select({
						table: "priorities_ticket",
						orderBy: "priority_level",
						order: "ASC",
					});
					break;

				case "statuses":
					data = await select({
						table: "statuses_ticket",
						orderBy: "status_id",
						order: "ASC",
					});
					break;

				case "departments":
					data = await select({
						table: "departemen",
						fields: ["dep_id", "nama"],
						orderBy: "nama",
						order: "ASC",
					});
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

		// Jika tidak ada type, return semua data master
		const [categories, priorities, statuses, departments] = await Promise.all([
			select({
				table: "categories_ticket",
				orderBy: "category_name",
				order: "ASC",
			}),
			select({
				table: "priorities_ticket",
				orderBy: "priority_level",
				order: "ASC",
			}),
			select({
				table: "statuses_ticket",
				orderBy: "status_id",
				order: "ASC",
			}),
			select({
				table: "departemen",
				fields: ["dep_id", "nama"],
				orderBy: "nama",
				order: "ASC",
			}),
		]);

		return NextResponse.json({
			status: "success",
			data: {
				categories,
				priorities,
				statuses,
				departments,
			},
		});
	} catch (error) {
		console.error("Error fetching master data:", error);
		return NextResponse.json(
			{
				status: "error",
				error: "Gagal mengambil data master",
			},
			{ status: 500 }
		);
	}
}
