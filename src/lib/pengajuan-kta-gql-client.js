import Cookies from "js-cookie";
import moment from "moment-timezone";

moment.tz.setDefault("Asia/Jakarta");

const BACKEND_URL =
	process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

export async function getAuthToken(request = null) {
	let token = null;
	if (request && request.headers) {
		const authHeader =
			request.headers.get("authorization") ||
			request.headers.get("Authorization");
		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7).trim();
		}
	}
	if (!token && typeof window === "undefined") {
		try {
			const { cookies } = await import("next/headers");
			const cookieStore = await cookies();
			token = cookieStore.get("auth_token")?.value;
		} catch {
			// ignore outside request context
		}
	}
	return token;
}

export async function gql(query, variables = {}, customToken = null) {
	const headers = { "Content-Type": "application/json" };
	let token = customToken;

	if (!token && typeof window !== "undefined") {
		token =
			Cookies.get("auth_token") || localStorage.getItem("auth_token_backup");
	}

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const res = await fetch(GQL_ENDPOINT, {
		method: "POST",
		headers,
		credentials: "include",
		body: JSON.stringify({ query, variables }),
	});

	const json = await res.json();
	if (json.errors && json.errors.length > 0) {
		throw new Error(json.errors[0]?.message ?? "GraphQL error");
	}
	return json.data;
}

export function normalizePengajuanKta(item) {
	if (!item) return null;
	return {
		id: item.id,
		no_pengajuan: item.noPengajuan || `#${item.id}`,
		noPengajuan: item.noPengajuan,
		nik: item.nik,
		nama: item.nama,
		jbtn: item.jbtn,
		departemen: item.departemen,
		jenis: item.jenis,
		alasan: item.alasan,
		status: item.status,
		alasan_ditolak: item.alasanDitolak || null,
		alasanDitolak: item.alasanDitolak || null,
		created_at: item.createdAt,
		updated_at: item.updatedAt,
	};
}

export async function fetchPengajuanKtaList(
	filter = {},
	limit = 50,
	offset = 0,
	token = null
) {
	const query = `
		query GetPengajuanKtaList($filter: PengajuanKtaFilterInput, $limit: Int, $offset: Int) {
			pengajuanKtaList(filter: $filter, limit: $limit, offset: $offset) {
				total
				items {
					id
					noPengajuan
					nik
					nama
					jbtn
					departemen
					jenis
					alasan
					status
					alasanDitolak
					createdAt
					updatedAt
				}
			}
		}
	`;

	const formattedFilter = {};
	if (filter.search && filter.search.trim()) {
		formattedFilter.search = filter.search.trim();
	}
	if (filter.jenis && filter.jenis !== "ALL") {
		formattedFilter.jenis = filter.jenis;
	}
	if (filter.status && filter.status !== "ALL") {
		formattedFilter.status = filter.status;
	}

	const data = await gql(
		query,
		{
			filter:
				Object.keys(formattedFilter).length > 0 ? formattedFilter : null,
			limit: Number(limit) || 50,
			offset: Number(offset) || 0,
		},
		token
	);

	return {
		total: data?.pengajuanKtaList?.total || 0,
		items: (data?.pengajuanKtaList?.items || []).map(normalizePengajuanKta),
	};
}

export async function fetchPengajuanKtaDetail(id, token = null) {
	const query = `
		query GetPengajuanKtaDetail($id: Int!) {
			pengajuanKtaDetail(id: $id) {
				id
				noPengajuan
				nik
				nama
				jbtn
				departemen
				jenis
				alasan
				status
				alasanDitolak
				createdAt
				updatedAt
			}
		}
	`;

	const data = await gql(query, { id: parseInt(id, 10) }, token);
	return normalizePengajuanKta(data?.pengajuanKtaDetail);
}

export async function fetchPengajuanKtaStats(year, month, token = null) {
	const query = `
		query GetPengajuanKtaStats($year: Int!, $month: Int!) {
			pengajuanKtaStats(year: $year, month: $month) {
				period {
					year
					month
					monthName
				}
				totalPengajuan
				pendingCount
				disetujuiCount
				prosesCount
				selesaiCount
				ditolakCount
				nextNoPengajuan
			}
		}
	`;

	const data = await gql(
		query,
		{
			year: parseInt(year, 10),
			month: parseInt(month, 10),
		},
		token
	);

	return data?.pengajuanKtaStats;
}

export async function createPengajuanKtaGql(input, token = null) {
	const mutation = `
		mutation CreatePengajuanKta($input: CreatePengajuanKtaInput!) {
			createPengajuanKta(input: $input) {
				id
				noPengajuan
				nik
				nama
				jbtn
				departemen
				jenis
				alasan
				status
				createdAt
				updatedAt
			}
		}
	`;

	const data = await gql(mutation, { input }, token);
	return normalizePengajuanKta(data?.createPengajuanKta);
}

export async function updatePengajuanKtaStatusGql(input, token = null) {
	const mutation = `
		mutation UpdatePengajuanKtaStatus($input: UpdatePengajuanKtaStatusInput!) {
			updatePengajuanKtaStatus(input: $input) {
				id
				noPengajuan
				nik
				nama
				jbtn
				departemen
				jenis
				alasan
				status
				alasanDitolak
				updatedAt
			}
		}
	`;

	const data = await gql(
		mutation,
		{
			input: {
				id: parseInt(input.id, 10),
				status: String(input.status),
				alasanDitolak: input.alasan_ditolak || input.alasanDitolak || undefined,
			},
		},
		token
	);

	return normalizePengajuanKta(data?.updatePengajuanKtaStatus);
}

export async function deletePengajuanKtaGql(id, token = null) {
	const mutation = `
		mutation DeletePengajuanKta($id: Int!) {
			deletePengajuanKta(id: $id)
		}
	`;

	const data = await gql(mutation, { id: parseInt(id, 10) }, token);
	return Boolean(data?.deletePengajuanKta);
}
