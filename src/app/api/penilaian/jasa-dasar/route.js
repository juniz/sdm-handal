import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function fetchGraphQL(query, variables, token) {
	const res = await fetch(GQL_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${token}`,
		},
		body: JSON.stringify({ query, variables }),
	});
	
	if (!res.ok) {
		const text = await res.text();
		throw new Error(text || `HTTP error ${res.status}`);
	}
	
	const json = await res.json();
	if (json.errors) {
		throw new Error(json.errors[0]?.message || "GraphQL Error");
	}
	return json.data;
}

export async function GET() {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const query = `
			query GetJasaDasarList {
				jasaDasarList {
					id
					pegawai_id
					nominal_jasa_dasar
					berlaku_mulai
					berlaku_sampai
					keterangan
					nama_pegawai
					nik_pegawai
					nama_departemen
					departemen_id
				}
			}
		`;

		const data = await fetchGraphQL(query, {}, token);
		return NextResponse.json({
			success: true,
			data: data.jasaDasarList
		});
	} catch (error) {
		console.error("Error in GET /api/penilaian/jasa-dasar:", error);
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
	}
}

export async function POST(request) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();

		if (Array.isArray(body)) {
			const query = `
				mutation ImportJasaDasar($input: [BulkImportJasaDasarInput!]!) {
					importJasaDasar(input: $input)
				}
			`;
			const variables = {
				input: body.map(row => ({
					pegawai_id: Number(row.pegawai_id),
					nominal_jasa_dasar: Number(row.nominal_jasa_dasar),
					berlaku_mulai: row.berlaku_mulai,
					berlaku_sampai: row.berlaku_sampai || null,
					keterangan: row.keterangan || null
				}))
			};
			await fetchGraphQL(query, variables, token);
			return NextResponse.json({
				success: true,
				message: `${body.length} data jasa dasar pegawai berhasil diimport`
			});
		} else {
			const { pegawai_id, nominal_jasa_dasar, berlaku_mulai, berlaku_sampai, keterangan } = body;
			if (!pegawai_id || nominal_jasa_dasar === undefined || !berlaku_mulai) {
				return NextResponse.json({ error: "Pegawai, nominal jasa dasar, dan tanggal mulai berlaku wajib diisi" }, { status: 400 });
			}

			const query = `
				mutation CreateJasaDasar($input: CreateJasaDasarInput!) {
					createJasaDasar(input: $input)
				}
			`;
			const variables = {
				input: {
					pegawai_id: Number(pegawai_id),
					nominal_jasa_dasar: Number(nominal_jasa_dasar),
					berlaku_mulai,
					berlaku_sampai: berlaku_sampai || null,
					keterangan: keterangan || null
				}
			};
			await fetchGraphQL(query, variables, token);
			return NextResponse.json({
				success: true,
				message: "Jasa dasar pegawai berhasil ditambahkan"
			});
		}
	} catch (error) {
		console.error("Error in POST /api/penilaian/jasa-dasar:", error);
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
	}
}

export async function PUT(request) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { id, nominal_jasa_dasar, berlaku_sampai, keterangan } = body;

		if (!id) {
			return NextResponse.json({ error: "ID record jasa dasar diperlukan" }, { status: 400 });
		}

		const query = `
			mutation UpdateJasaDasar($input: UpdateJasaDasarInput!) {
				updateJasaDasar(input: $input)
			}
		`;
		const variables = {
			input: {
				id: Number(id),
				nominal_jasa_dasar: nominal_jasa_dasar !== undefined ? Number(nominal_jasa_dasar) : undefined,
				berlaku_sampai: berlaku_sampai || undefined,
				keterangan: keterangan || undefined
			}
		};
		await fetchGraphQL(query, variables, token);
		return NextResponse.json({
			success: true,
			message: "Jasa dasar pegawai berhasil diperbarui"
		});
	} catch (error) {
		console.error("Error in PUT /api/penilaian/jasa-dasar:", error);
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
	}
}

export async function DELETE(request) {
	try {
		const cookieStore = await cookies();
		const token = cookieStore.get("auth_token")?.value;

		if (!token) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		// Check if it's a bulk delete (JSON array of ids in body)
		let ids = [];
		const contentType = request.headers.get("content-type");
		if (contentType && contentType.includes("application/json")) {
			try {
				const body = await request.json();
				if (body && Array.isArray(body.ids)) {
					ids = body.ids;
				}
			} catch (e) {
				// No valid JSON body
			}
		}

		if (ids.length > 0) {
			const query = `
				mutation DeleteManyJasaDasar($ids: [Int!]!) {
					deleteManyJasaDasar(ids: $ids)
				}
			`;
			await fetchGraphQL(query, { ids }, token);
			return NextResponse.json({
				success: true,
				message: `${ids.length} konfigurasi jasa dasar berhasil dihapus`
			});
		} else {
			const { searchParams } = new URL(request.url);
			const id = searchParams.get("id");

			if (!id) {
				return NextResponse.json({ error: "ID record jasa dasar diperlukan" }, { status: 400 });
			}

			const query = `
				mutation DeleteJasaDasar($id: Int!) {
					deleteJasaDasar(id: $id)
				}
			`;
			const variables = {
				id: Number(id)
			};
			await fetchGraphQL(query, variables, token);
			return NextResponse.json({
				success: true,
				message: "Jasa dasar pegawai berhasil dihapus"
			});
		}
	} catch (error) {
		console.error("Error in DELETE /api/penilaian/jasa-dasar:", error);
		return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
	}
}
