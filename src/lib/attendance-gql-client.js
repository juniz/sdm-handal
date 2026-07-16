import Cookies from "js-cookie";
import moment from "moment";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";
const GQL_ENDPOINT = `${BACKEND_URL}/graphql`;

// Helper untuk memformat data unfinished attendance ke format yang dikenali oleh page UI
function formatUnfinishedResult(result) {
  if (result && result.hasUnfinished && result.data) {
    const raw = result.data;
    const currentTime = moment().format("YYYY-MM-DD HH:mm:ss");

    // Hitung durasi kerja saat ini
    const currentDuration = moment(currentTime).diff(moment(raw.jamDatang));
    const durationFormatted = moment.utc(currentDuration).format("HH:mm:ss");

    // Hitung time_info & is_overdue & can_auto_checkout
    let expectedCheckout = moment(`${moment(raw.jamDatang).format("YYYY-MM-DD")} ${raw.jamPulang}`);
    if (raw.jamPulang < raw.jamMasuk) {
      expectedCheckout = expectedCheckout.add(1, "day");
    }
    // Langsung overdue setelah jam pulang shift terlewati (tanpa grace period)
    const isOverdue = moment().isAfter(expectedCheckout);

    // format time_info
    let timeInfoFormatted = "";
    if (isOverdue) {
      timeInfoFormatted = "Overdue (Sistem akan auto checkout)";
    } else {
      const diffMs = expectedCheckout.diff(moment());
      if (diffMs > 0) {
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        timeInfoFormatted = `${diffHrs} jam ${diffMins} menit lagi`;
      } else {
        timeInfoFormatted = "Sudah melewati jam pulang";
      }
    }

    result.data = {
      ...raw,
      current_duration: durationFormatted,
      is_overdue: isOverdue,
      can_auto_checkout: isOverdue,
      time_info: {
        formatted: timeInfoFormatted
      },
      status_info: {
        jam_datang_formatted: moment(raw.jamDatang).format("DD/MM/YYYY HH:mm:ss"),
        shift_info: `${raw.shift} (${raw.jamMasuk} - ${raw.jamPulang})`,
        work_date: moment(raw.jamDatang).format("DD MMMM YYYY")
      }
    };
  }
  return result;
}

async function gql(query, variables = {}) {
  const headers = { "Content-Type": "application/json" };

  if (typeof window !== "undefined") {
    let token = Cookies.get("auth_token") || localStorage.getItem("auth_token_backup");

    // Auto session restore: if client token is empty, fetch from /api/auth/session
    if (!token) {
      try {
        console.log("No client token, attempting to restore session from server cookie...");
        // Use a synchronous-like await since gql is async anyway
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.token) {
            token = sessionData.token;
            // Save to client-readable cookie and local storage
            Cookies.set("auth_token", token, {
              expires: 7,
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              path: "/",
            });
            localStorage.setItem("auth_token_backup", token);
            localStorage.setItem("auth_token_timestamp", Date.now().toString());
            console.log("Session successfully restored from server cookie!");
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
        data { idPegawai shift jamDatang status keterlambatan jamMasuk jamPulang }
      }
      locationSettings { isLocationValidationEnabled locationValidationStatus message }
    }
  `);
  if (data?.unfinished) {
    data.unfinished = formatUnfinishedResult(data.unfinished);
  }
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
      data { idPegawai shift jamDatang status keterlambatan jamMasuk jamPulang }
    }}
  `);
  return formatUnfinishedResult(data.unfinishedAttendance);
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

let sdmProfilePromise = null;
export async function fetchSdmProfile() {
  if (!sdmProfilePromise) {
    sdmProfilePromise = gql(`
      query {
        sdmProfile {
          id
          username
          nama
          departemen
          departemen_name
          jabatan
          tmp_lahir
          tgl_lahir
          alamat
          photo
        }
      }
    `).catch(err => {
      sdmProfilePromise = null;
      throw err;
    });
  }
  const data = await sdmProfilePromise;
  return data.sdmProfile;
}

let sdmStatsPromise = null;
export async function fetchSdmAttendanceStats() {
  if (!sdmStatsPromise) {
    sdmStatsPromise = gql(`
      query {
        sdmAttendanceStats {
          daily {
            day
            status
          }
          stats {
            total
            onTime
            late
            leave
          }
        }
      }
    `).catch(err => {
      sdmStatsPromise = null;
      throw err;
    });
  }
  const data = await sdmStatsPromise;
  return data.sdmAttendanceStats;
}

