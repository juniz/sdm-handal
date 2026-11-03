import Cookies from "js-cookie";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function gql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };

  if (typeof window !== "undefined") {
    let token =
      Cookies.get("auth_token") || localStorage.getItem("auth_token_backup");

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
          }
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
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

export async function fetchGapokList({
  page = 1,
  limit = 10,
  search = "",
  depId = "all",
  unsetOnly = false,
} = {}) {
  const query = `
    query GetGapokPegawaiList(
      $page: Int
      $limit: Int
      $search: String
      $depId: String
      $unsetOnly: Boolean
    ) {
      gapokPegawaiList(
        page: $page
        limit: $limit
        search: $search
        depId: $depId
        unsetOnly: $unsetOnly
      ) {
        items {
          id
          nik
          nama
          departemen
          nama_departemen
          jbtn
          gapok
        }
        meta {
          page
          limit
          total
          totalPages
          unset_total
        }
      }
    }
  `;

  const data = await gql(query, {
    page,
    limit,
    search: search || undefined,
    depId: depId === "all" ? undefined : depId,
    unsetOnly,
  });

  return data.gapokPegawaiList;
}

export async function mutationUpdateGapok({ nik, gapok }) {
  const query = `
    mutation UpdateGapokPegawai($input: UpdateGapokInput!) {
      updateGapokPegawai(input: $input)
    }
  `;
  const data = await gql(query, {
    input: { nik, gapok: parseFloat(gapok) },
  });
  return data.updateGapokPegawai;
}

export async function mutationImportGapok(items) {
  const query = `
    mutation ImportGapokPegawai($input: [BulkImportGapokItemInput!]!) {
      importGapokPegawai(input: $input) {
        success_count
        error_count
        errors
      }
    }
  `;
  const data = await gql(query, { input: items });
  return data.importGapokPegawai;
}

export async function mutationGenerateGaji({ periodeBulan, periodeTahun }) {
  const query = `
    mutation GenerateGajiPeriode($input: GenerateGajiInput!) {
      generateGajiPeriode(input: $input)
    }
  `;
  const data = await gql(query, {
    input: {
      periode_bulan: parseInt(periodeBulan, 10),
      periode_tahun: parseInt(periodeTahun, 10),
    },
  });
  return data.generateGajiPeriode;
}
