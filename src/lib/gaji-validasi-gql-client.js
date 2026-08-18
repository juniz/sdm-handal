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

export async function fetchMyGajiValidasiList({
  periodeTahun,
  periodeBulan,
  jenis,
} = {}) {
  const data = await gql(
    `
    query GetMyGajiValidasiList($periodeTahun: Int, $periodeBulan: Int, $jenis: String) {
      myGajiValidasiList(periodeTahun: $periodeTahun, periodeBulan: $periodeBulan, jenis: $jenis) {
        id
        nik
        namaPegawai
        periodeTahun
        periodeBulan
        jenis
        nominal
        gapok
        jasaDasar
        isValidated
        validasiId
        tandaTangan
        catatan
        signedAt
      }
    }
  `,
    { periodeTahun, periodeBulan, jenis }
  );

  return data.myGajiValidasiList;
}

export async function mutationSignGaji({ gajiId, tandaTangan, catatan }) {
  const data = await gql(
    `
    mutation SignGaji($input: SignGajiInput!) {
      signGaji(input: $input)
    }
  `,
    {
      input: {
        gajiId,
        tandaTangan,
        catatan,
      },
    }
  );

  return data.signGaji;
}
