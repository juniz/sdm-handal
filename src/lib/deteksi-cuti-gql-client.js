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

export async function fetchDeteksiCutiGql(filter = {}) {
  const query = `
    query GetDeteksiCuti($filter: DeteksiCutiFilterInput) {
      deteksiCuti(filter: $filter) {
        summary {
          total_cuti_shift
          approved_100
          perlu_bypass
        }
        items {
          pegawai_id
          pegawai_nama
          nik
          departemen
          departemen_nama
          no_pengajuan
          urgensi
          nilai_kondisi
          tanggal
          shift
          status_bypass
          penilaian_id
          penilaian_status
          skor_total
          sumber_absensi
          ref_cuti_no
        }
      }
    }
  `;

  const data = await gql(query, { filter });
  return data.deteksiCuti;
}

export async function executeBypassCutiGql(items = []) {
  const mutation = `
    mutation BypassCuti($input: BypassCutiInput!) {
      bypassCuti(input: $input) {
        success
        message
        processedCount
      }
    }
  `;

  const data = await gql(mutation, { input: { items } });
  return data.bypassCuti;
}

export async function executeBypassManualGql(input = {}) {
  const mutation = `
    mutation BypassManualPegawai($input: BypassManualPegawaiInput!) {
      bypassManualPegawai(input: $input) {
        success
        message
        processedCount
        processedDates
      }
    }
  `;

  const data = await gql(mutation, { input });
  return data.bypassManualPegawai;
}
