import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { rawQuery } from "@/lib/db-helper";

export async function POST(request) {
	try {
		const user = await getUser();
		if (!user) {
			return NextResponse.json(
				{ status: "error", error: "Unauthorized" },
				{ status: 401 }
			);
		}

		// Check authorization
		let userDept = user.departemen || "";
		let userJabatan = user.jabatan || "";

		if (user.id) {
			try {
				const rows = await rawQuery(
					"SELECT departemen, jbtn as jabatan FROM pegawai WHERE id = ?",
					[user.id]
				);
				if (rows && rows.length > 0) {
					if (rows[0].departemen) userDept = rows[0].departemen;
					if (rows[0].jabatan) userJabatan = rows[0].jabatan;
				}
			} catch (err) {
				console.warn("Could not query pegawai for authorization:", err);
			}
		}

		const envIT = process.env.NEXT_PUBLIC_DEPARTMENT_IT;
		const envSPI = process.env.NEXT_PUBLIC_DEPARTMENT_SPI;

		const isAuthorized = Boolean(
			(envIT && (userDept === envIT || user.departemen === envIT)) ||
			(envSPI && (userDept === envSPI || user.departemen === envSPI)) ||
			userDept === "IT" ||
			userDept === "SPI" ||
			userJabatan === "Direktur" ||
			user.departemen === "IT" ||
			user.departemen === "SPI" ||
			user.jabatan === "Direktur"
		);

		if (!isAuthorized) {
			return NextResponse.json(
				{ status: "error", error: "Forbidden: Akses ditolak" },
				{ status: 403 }
			);
		}

		let body;
		try {
			body = await request.json();
		} catch {
			return NextResponse.json(
				{ status: "error", error: "Format request tidak valid" },
				{ status: 400 }
			);
		}

		const target_type = body?.target_type;
		const external_id =
			typeof body?.external_id === "string"
				? body.external_id.trim()
				: body?.external_id
				? String(body.external_id).trim()
				: "";
		const title = typeof body?.title === "string" ? body.title.trim() : "";
		const message =
			typeof body?.message === "string" ? body.message.trim() : "";
		const url =
			typeof body?.url === "string" && body.url.trim()
				? body.url.trim()
				: undefined;

		if (
			target_type !== "single" &&
			target_type !== "all" &&
			target_type !== "department"
		) {
			return NextResponse.json(
				{
					status: "error",
					error: "target_type harus 'single', 'department', atau 'all'",
				},
				{ status: 400 }
			);
		}

		if (!title) {
			return NextResponse.json(
				{ status: "error", error: "Judul notifikasi wajib diisi" },
				{ status: 400 }
			);
		}

		if (!message) {
			return NextResponse.json(
				{ status: "error", error: "Pesan notifikasi wajib diisi" },
				{ status: 400 }
			);
		}

		if (target_type === "single" && !external_id) {
			return NextResponse.json(
				{
					status: "error",
					error: "external_id wajib diisi untuk target single",
				},
				{ status: 400 }
			);
		}

		const appId =
			process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID ||
			"2f714dce-3685-47a3-9a02-4350d1186f71";
		const apiKey = process.env.ONESIGNAL_REST_API_KEY;

		if (!apiKey) {
			return NextResponse.json(
				{
					status: "error",
					error: "OneSignal REST API key is not configured",
				},
				{ status: 500 }
			);
		}

		const payload = {
			app_id: appId,
			target_channel: "push",
			headings: { en: title, id: title },
			contents: { en: message, id: message },
		};

		if (url) {
			payload.url = url;
		}

		if (target_type === "all") {
			payload.included_segments = ["Subscribed Users"];
		} else if (target_type === "department") {
			let targetNiks = Array.isArray(body?.external_ids)
				? body.external_ids.map(String).filter(Boolean)
				: [];

			if (targetNiks.length === 0 && body?.department) {
				const rows = await rawQuery(
					"SELECT p.nik FROM pegawai p WHERE p.departemen = ? AND p.stts_aktif = 'AKTIF'",
					[body.department]
				);
				targetNiks = rows.map((r) => String(r.nik)).filter(Boolean);
			}

			if (targetNiks.length === 0) {
				return NextResponse.json(
					{
						status: "error",
						error: "Tidak ada pegawai aktif ditemukan untuk unit/departemen yang dipilih",
					},
					{ status: 400 }
				);
			}

			payload.include_aliases = {
				external_id: targetNiks,
			};
		} else {
			payload.include_aliases = {
				external_id: [external_id],
			};
		}

		const osResponse = await fetch("https://api.onesignal.com/notifications", {
			method: "POST",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				Authorization: `Key ${apiKey}`,
			},
			body: JSON.stringify(payload),
		});

		const result = await osResponse.json();

		if (!osResponse.ok || (result.errors && !result.id)) {
			return NextResponse.json(
				{
					status: "error",
					error: result.errors || "Failed to send notification",
				},
				{ status: 400 }
			);
		}

		return NextResponse.json(
			{
				status: "success",
				message: "Push notification berhasil dikirim",
				data: result,
			},
			{ status: 200 }
		);
	} catch (error) {
		console.error("Error sending push notification:", error);
		return NextResponse.json(
			{ status: "error", error: error.message || "Internal server error" },
			{ status: 500 }
		);
	}
}
