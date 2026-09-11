# Penilaian Harian & Supervisor Approval Push Notification Design

## Summary
Integrate OneSignal Web Push notifications into employee daily performance assessment workflow (`penilaian_harian`):
1. **Submit**: Notify supervisor when employee submits daily assessment (`action: submit`).
2. **Approve**: Notify employee when supervisor approves assessment (`action: approve`).
3. **Revisi**: Notify employee when supervisor requests revision (`action: revisi` / `admin_revisi`) with direct URL to the assessment date editor.

## Architecture & Integration Point
File: `src/app/api/penilaian/harian/[id]/route.js`
Uses: `sendPushNotification` from `@/lib/onesignal`

### 1. Submit Action Notification
- **Trigger**: `action === "submit"` and `newStatus === "submitted"` (skips auto-approved cuti / dinas luar kota).
- **Recipient**: Direct supervisor mapped via `getSupervisorIdForEmployee(harian.pegawai_id)`.
  - Resolve `supervisor.nik` from table `pegawai` where `id = authorizedSupervisorId`.
- **Payload**:
  - Title: `Penilaian Harian Menunggu Persetujuan`
  - Message: `${namaPegawai} telah mengirim penilaian harian tanggal ${tanggalFormatted}. Menunggu persetujuan Anda.`
  - URL: `https://presensi.itbhayangkara.id/dashboard/penilaian-kinerja/approval`

### 2. Approve Action Notification
- **Trigger**: `action === "approve"`.
- **Recipient**: Employee (`harian.pegawai_id`).
  - Resolve `pegawai.nik` from table `pegawai` where `id = harian.pegawai_id`.
  - Resolve supervisor name from `loggedInUser` or table `pegawai` where `id = loggedInUser.id`.
- **Payload**:
  - Title: `Penilaian Harian Disetujui`
  - Message: `Penilaian harian Anda tanggal ${tanggalFormatted} telah disetujui oleh ${namaSupervisor}.`
  - URL: `https://presensi.itbhayangkara.id/dashboard/penilaian-kinerja/riwayat`

### 3. Revisi Action Notification
- **Trigger**: `action === "revisi"` or `action === "admin_revisi"`.
- **Recipient**: Employee (`harian.pegawai_id`).
  - Resolve `pegawai.nik` from table `pegawai` where `id = harian.pegawai_id`.
  - Resolve supervisor name from `loggedInUser` or table `pegawai` where `id = loggedInUser.id`.
- **Payload**:
  - Title: `Penilaian Harian Perlu Revisi`
  - Message: `Penilaian harian Anda tanggal ${tanggalFormatted} dikembalikan untuk direvisi oleh ${namaSupervisor}. Catatan: ${catatan_supervisor}.`
  - URL: `https://presensi.itbhayangkara.id/dashboard/penilaian-kinerja/input?date=${moment(harian.tanggal).format("YYYY-MM-DD")}`

### 4. Non-Blocking & Fault Isolation
All push notifications dispatched asynchronously with `.catch()` error logging. Failures never abort database transaction or modify HTTP 200 responses.

## Verification Plan
1. Employee submits assessment -> Confirm supervisor receives push with link to `/dashboard/penilaian-kinerja/approval`.
2. Supervisor approves -> Confirm employee receives push with link to `/dashboard/penilaian-kinerja/riwayat`.
3. Supervisor requests revision with note -> Confirm employee receives push with link to `/dashboard/penilaian-kinerja/input?date=YYYY-MM-DD`.
4. Test auto-approved cuti/dinas luar -> Confirm no push sent to supervisor.
