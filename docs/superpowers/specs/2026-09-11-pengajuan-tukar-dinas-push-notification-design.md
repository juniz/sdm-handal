# Pengajuan Tukar Dinas Push Notification Design

## Summary
Add automated OneSignal Web Push notifications to the shift exchange workflow (`pengajuan_tudin`):
1. Upon creation (`POST`), notify the Person-in-Charge (`nik_pj`) that a new shift exchange request requires review.
2. Upon decision (`PUT`), notify the applicant (`pengajuan.nik`) whether the request is "Disetujui" or "Ditolak" (with reason).

## Architecture

### 1. Centralized OneSignal Helper (`src/lib/onesignal.js`)
Create a reusable utility `sendPushNotification`:
- Signature: `sendPushNotification({ targetNiks: string[], title: string, message: string, url?: string })`
- Environment resolution: `ONESIGNAL_REST_API_KEY`, `NEXT_PUBLIC_ONESIGNAL_APP_ID`, `NEXT_PUBLIC_APP_URL`.
- Normalization: Auto-converts relative URL (e.g. `/dashboard/...`) to absolute URL (`https://presensi.itbhayangkara.id/...`).
- Deduplication: Deduplicates `targetNiks`.
- Fault isolation: Failures logged without throwing, ensuring database commits and HTTP responses succeed even if push delivery fails.

### 2. Shift Exchange API Integration (`src/app/api/pengajuan-tukar-dinas/route.js`)

#### A. Submission Notification (`POST`)
- **Trigger**: New record inserted into `pengajuan_tudin` and `nik_pj` is provided.
- **Recipient**: `nik_pj` (array of 1 NIK).
- **Title**: `Pengajuan Tukar Dinas Baru`
- **Message**: `${namaPemohon} mengajukan tukar dinas (${shift1} tgl ${tgl_dinas} ⇄ ${shift2} tgl ${tgl_ganti}). Perlu persetujuan Anda.`
- **URL**: `https://presensi.itbhayangkara.id/dashboard/pengajuan-tukar-dinas`

#### B. Approval / Rejection Notification (`PUT`)
- **Trigger**: Record updated in `pengajuan_tudin` with status `"Disetujui"` or `"Ditolak"`.
- **Query enhancement**: Query `SELECT nik, nik_pj FROM pengajuan_tudin WHERE no_pengajuan = ?` to capture applicant NIK (`pengajuan.nik`), and fetch approver name (`pegawai.nama` where `nik = userNik`).
- **Recipient**: `pengajuan.nik` (applicant).
- **Content**:
  - If `"Disetujui"`:
    - **Title**: `Pengajuan Tukar Dinas Disetujui`
    - **Message**: `Pengajuan tukar dinas Anda (${no_pengajuan}) telah disetujui oleh ${namaPJ}.`
  - If `"Ditolak"`:
    - **Title**: `Pengajuan Tukar Dinas Ditolak`
    - **Message**: `Pengajuan tukar dinas Anda (${no_pengajuan}) ditolak oleh ${namaPJ}. Alasan: ${alasan_ditolak}.`
- **URL**: `https://presensi.itbhayangkara.id/dashboard/pengajuan-tukar-dinas`

## Non-Goals
- Sending notification to replacement employee (`nik_ganti`) during submission (per user selection 1A).
- Blocking database update on OneSignal error.

## Verification Plan
1. Employee submits tukar dinas pointing to a designated PJ -> Confirm PJ receives push notification with correct dates/shifts.
2. PJ clicks notification -> PWA/browser focuses and navigates to `/dashboard/pengajuan-tukar-dinas`.
3. PJ approves request -> Confirm applicant receives "Pengajuan Tukar Dinas Disetujui" push.
4. PJ rejects request -> Confirm applicant receives "Pengajuan Tukar Dinas Ditolak" push with rejection reason.
5. Simulate OneSignal network offline -> Confirm shift exchange record still inserts and updates in database without error.
