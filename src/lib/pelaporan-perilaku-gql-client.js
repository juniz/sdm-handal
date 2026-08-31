import Cookies from "js-cookie";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function gql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };

  if (typeof window !== "undefined") {
    let token =
      Cookies.get("auth_token") || localStorage.getItem("auth_token_backup");

    // Auto session restore
    if (!token) {
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.token) {
            token = sessionData.token;
            Cookies.set("auth_token", token, {
              expires: 7,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
            localStorage.setItem("auth_token_backup", token);
            localStorage.setItem("auth_token_timestamp", Date.now().toString());
          }
        }
      } catch (err) {
        console.error("Failed to auto-restore session:", err);
      }
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers,
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    const msg = json.errors[0]?.message ?? "GraphQL error";
    throw new Error(msg);
  }
  return json.data;
}

export async function fetchMyPelaporanPerilaku({ limit = 50, offset = 0 } = {}) {
  const query = `
    query GetMyPelaporanPerilaku($limit: Int, $offset: Int) {
      myPelaporanPerilaku(limit: $limit, offset: $offset) {
        total
        items {
          id
          tanggal
          namaPelaku
          nikPelaku
          unitKerja
          jenisPerilaku
          tingkatUrgensi
          korban
          nikKorban
          kronologi
          buktiLampiran
          pelapor
          nikPelapor
          status
          tingkatKerahasiaan
          catatanTindakLanjut
          createdAt
          updatedAt
        }
      }
    }
  `;
  const data = await gql(query, { limit, offset });
  return data?.myPelaporanPerilaku ?? { items: [], total: 0 };
}

export async function fetchAdminPelaporanPerilaku({
  filter = {},
  limit = 50,
  offset = 0,
} = {}) {
  const query = `
    query GetAdminPelaporanPerilaku($filter: PelaporanPerilakuFilterInput, $limit: Int, $offset: Int) {
      adminPelaporanPerilaku(filter: $filter, limit: $limit, offset: $offset) {
        total
        stats {
          total
          menungguReview
          sedangDiinvestigasi
          selesai
          ditolak
        }
        items {
          id
          tanggal
          namaPelaku
          nikPelaku
          unitKerja
          jenisPerilaku
          tingkatUrgensi
          korban
          nikKorban
          kronologi
          buktiLampiran
          pelapor
          nikPelapor
          status
          tingkatKerahasiaan
          catatanTindakLanjut
          createdAt
          updatedAt
        }
      }
    }
  `;
  const data = await gql(query, { filter, limit, offset });
  return (
    data?.adminPelaporanPerilaku ?? {
      items: [],
      total: 0,
      stats: {
        total: 0,
        menungguReview: 0,
        sedangDiinvestigasi: 0,
        selesai: 0,
        ditolak: 0,
      },
    }
  );
}

export async function fetchPelaporanPerilakuDetail(id) {
  const query = `
    query GetPelaporanPerilakuDetail($id: Int!) {
      pelaporanPerilakuDetail(id: $id) {
        id
        tanggal
        namaPelaku
        nikPelaku
        unitKerja
        jenisPerilaku
        tingkatUrgensi
        korban
        nikKorban
        kronologi
        buktiLampiran
        pelapor
        nikPelapor
        status
        tingkatKerahasiaan
        catatanTindakLanjut
        createdAt
        updatedAt
      }
    }
  `;
  const data = await gql(query, { id: parseInt(id, 10) });
  return data?.pelaporanPerilakuDetail ?? null;
}

export async function createPelaporanPerilakuMutation(input) {
  const mutation = `
    mutation CreatePelaporanPerilaku($input: CreatePelaporanPerilakuInput!) {
      createPelaporanPerilaku(input: $input) {
        id
        tanggal
        namaPelaku
        nikPelaku
        unitKerja
        jenisPerilaku
        tingkatUrgensi
        korban
        nikKorban
        kronologi
        buktiLampiran
        pelapor
        nikPelapor
        status
        tingkatKerahasiaan
        createdAt
      }
    }
  `;
  const data = await gql(mutation, { input });
  return data?.createPelaporanPerilaku;
}

export async function updateStatusPelaporanPerilakuMutation(input) {
  const mutation = `
    mutation UpdateStatusPelaporanPerilaku($input: UpdateStatusPelaporanPerilakuInput!) {
      updateStatusPelaporanPerilaku(input: $input) {
        id
        status
        catatanTindakLanjut
        updatedAt
      }
    }
  `;
  const data = await gql(mutation, { input });
  return data?.updateStatusPelaporanPerilaku;
}
