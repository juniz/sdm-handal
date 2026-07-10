import Cookies from "js-cookie";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

async function gql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };

  if (typeof window !== "undefined") {
    const token = Cookies.get("auth_token") || localStorage.getItem("auth_token_backup");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(GQL_ENDPOINT, {
    method: "POST",
    headers,
    credentials: "include", // Send auth_token cookie cross-origin if permitted
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    const msg = json.errors[0]?.message ?? "GraphQL error";
    throw new Error(msg);
  }
  return json.data;
}

// ─── Batched initial load (replaces 5 sequential fetches) ───────────────────

export async function fetchAttendanceInitialData() {
  const data = await gql(`
    query InitialLoad {
      shift: attendanceShift { shiftToday }
      today: attendanceToday {
        data { idPegawai shift jamDatang status keterlambatan photo }
        jamPulang
      }
      completed: attendanceCompleted {
        idPegawai shift jamDatang jamPulang durasi status keterlambatan photo
      }
      status: attendanceStatus { hasCheckedIn hasCheckedOut isCompleted }
      unfinished: unfinishedAttendance {
        hasUnfinished
        data { idPegawai shift jamDatang status keterlambatan }
      }
      locationSettings { isLocationValidationEnabled locationValidationStatus message }
    }
  `);
  return data;
}

// ─── Individual queries (for post-mutation refresh) ─────────────────────────

export async function fetchTodayAttendance() {
  const data = await gql(`
    query { attendanceToday {
      data { idPegawai shift jamDatang status keterlambatan photo }
      jamPulang
    }}
  `);
  return data.attendanceToday;
}

export async function fetchAttendanceStatus() {
  const data = await gql(`
    query { attendanceStatus { hasCheckedIn hasCheckedOut isCompleted } }
  `);
  return data.attendanceStatus;
}

export async function fetchCompletedAttendance() {
  const data = await gql(`
    query { attendanceCompleted {
      idPegawai shift jamDatang jamPulang durasi status keterlambatan photo
    }}
  `);
  return data.attendanceCompleted;
}

export async function fetchUnfinishedAttendance() {
  const data = await gql(`
    query { unfinishedAttendance {
      hasUnfinished
      data { idPegawai shift jamDatang status keterlambatan }
    }}
  `);
  return data.unfinishedAttendance;
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function mutationCheckIn({
  photo,
  timestamp,
  latitude,
  longitude,
  securityData,
}) {
  const data = await gql(
    `
    mutation CheckIn($input: CheckInInput!) {
      checkIn(input: $input) {
        success message error status keterlambatan
        shiftInfo { shift jamMasuk jamPulang }
      }
    }
  `,
    {
      input: {
        photo,
        timestamp,
        latitude: String(latitude),
        longitude: String(longitude),
        isCheckingOut: false,
        securityData,
      },
    }
  );
  return data.checkIn;
}

export async function mutationCheckOut({
  timestamp,
  latitude,
  longitude,
  securityData,
}) {
  const data = await gql(
    `
    mutation CheckOut($input: CheckInInput!) {
      checkOut(input: $input) { success message error }
    }
  `,
    {
      input: {
        photo: null,
        timestamp,
        latitude: String(latitude),
        longitude: String(longitude),
        isCheckingOut: true,
        securityData,
      },
    }
  );
  return data.checkOut;
}

export async function mutationAutoCheckout() {
  const data = await gql(`
    mutation { autoCheckout { success message error } }
  `);
  return data.autoCheckout;
}
