# Task 2: Frontend API Route Update (`sdm`)

## Context & Objective
Update the Next.js API route `src/app/api/penilaian/rekap-pengawasan/route.js` in `/Users/hardiko/Documents/Developer/NEXT/sdm` to request the new fields (`hari_pending`, `hari_draft`, `hari_kosong`) from GraphQL `rekapPengawasanList` query and pass them to the client.

## Target File
- `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/api/penilaian/rekap-pengawasan/route.js`

## Implementation Steps
In `GetRekapPengawasanList` GraphQL query (around line 78-95), add:
```graphql
hari_pending
hari_draft
hari_kosong
```
so the query returns:
```graphql
data {
  id
  pegawai_id
  nik
  nama
  nama_departemen
  stts_kerja
  bulan
  tahun
  total_hari_jadwal
  hari_approved
  hari_approved_bonus
  hari_pending
  hari_draft
  hari_kosong
  gap_hari
  rata_skor_total
  status_rekap
}
```

## Report File
Write your report to `/Users/hardiko/Documents/Developer/NEXT/sdm/.superpowers/sdd/2026-08-28-riwayat-pengawasan-refactor/task-2-report.md`.
