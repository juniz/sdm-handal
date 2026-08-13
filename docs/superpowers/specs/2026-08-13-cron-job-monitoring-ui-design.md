# Technical Design: Cron Job Monitoring UI for SDM Frontend

**Date**: 2026-08-13  
**Status**: Approved  
**Module**: SDM Frontend Dashboard (`src/app/dashboard/monitoring/page.js`)

---

## 1. Context & Objectives

The backend now exposes `/api/v1/monitor/cron-jobs` (GET status) and `/api/v1/monitor/cron-jobs/:name/trigger` (POST manual trigger). The SDM frontend Server Monitoring dashboard ([`src/app/dashboard/monitoring/page.js`](file:///Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/monitoring/page.js)) needs a user interface for administrators to view scheduled cron jobs, inspect execution statuses/logs/durations, and manually trigger job executions on demand.

---

## 2. Component Design & Layout

### 2.1 Cron Job Monitoring Card Component
A dedicated `<Card>` added to the Server Monitoring page containing:
1. **Header Section**:
   - Icon: `CalendarDays` (or `Clock`) from `lucide-react`.
   - Title: `"Pemantauan & Control Cron Job Backend"`.
   - Action: Small refresh button to reload cron statuses.

2. **Cron Jobs Table**:
   - **Column 1: Nama & Deskripsi**: Displays job name (e.g. `AutoApprovalCronService`) and human-readable description.
   - **Column 2: Jadwal (Cron Expression)**: Monospaced cron expression (e.g. `0 5 0 * * *`).
   - **Column 3: Status Terakhir**: Badge with color coding:
     - `SUCCESS` -> Green badge (`bg-emerald-100 text-emerald-800`)
     - `FAILED` -> Red badge (`bg-rose-100 text-rose-800`)
     - `RUNNING` -> Amber badge with pulse (`bg-amber-100 text-amber-800 animate-pulse`)
     - `NEVER_RUN` -> Slate badge (`bg-slate-100 text-slate-600`)
   - **Column 4: Eksekusi Terakhir & Durasi**: Formatted timestamp (local time) and duration in milliseconds (e.g. `1,420 ms`).
   - **Column 5: Eksekusi Berikutnya**: Perkiraan waktu next run timestamp.
   - **Column 6: Aksi**: Button `"Jalankan Manual"` with play/refresh icon. Disables and shows spinner while triggering.

3. **Expandable Detail Row**:
   - Clicking a row toggles expandable view showing `lastResultSummary` or `lastError` trace in a monospaced code box (`bg-slate-900 text-slate-200`).

---

## 3. Frontend Integration & API Flow

1. **State Hooks in `MonitoringPage`**:
   - `cronJobs`: Array of cron job status objects fetched from API.
   - `triggeringJob`: String containing name of job currently being manually triggered (for button loading states).
   - `expandedCronIdx`: Index of currently expanded row for detail logs.

2. **API Fetch Function**:
   - `fetchCronJobs()`: Fetches `GET ${BACKEND_URL}/api/v1/monitor/cron-jobs` with Authorization bearer token.
   - Called inside `fetchData()` on initial page load and on manual refresh.

3. **Manual Trigger Action**:
   - `handleTriggerCron(name)`: Sends `POST ${BACKEND_URL}/api/v1/monitor/cron-jobs/${encodeURIComponent(name)}/trigger`.
   - Shows feedback alert/toast upon completion or error.
   - Calls `fetchCronJobs()` immediately to reflect updated running status.

---

## 4. Verification & Testing Plan

- Verify page renders correctly in Next.js dev server without console errors or hydration mismatches.
- Verify GET request successfully populates table with registered cron jobs (`AutoApprovalCronService`, `LogRotationService`).
- Verify manual trigger button calls POST endpoint and refreshes status in UI.
