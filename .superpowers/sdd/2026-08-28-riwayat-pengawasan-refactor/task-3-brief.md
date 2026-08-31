# Task 3: Create Modular Components (`sdm`)

## Context & Objective
Create modular, well-styled, and bug-free subcomponents for `riwayat-pengawasan` in directory `/Users/hardiko/Documents/Developer/NEXT/sdm/src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/`.

## Target Files to Create
1. `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditHeader.jsx`
2. `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditSummaryCards.jsx`
3. `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditFilters.jsx`
4. `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditCalendarGrid.jsx`
5. `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditActivityModal.jsx`
6. `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditDetailDrawer.jsx`
7. `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/components/AuditTable.jsx`

## Detailed Specifications per Component

### 1. `AuditHeader.jsx`
- Banner with primary color styling matching app design.
- Displays `ShieldCheck` icon, subtitle, `Periode {month}/{year}`, title "Riwayat Penilaian (Pengawasan / Audit SDM)".
- "Reset Filter" button calling `onReset`.

### 2. `AuditSummaryCards.jsx`
- 4 Executive cards:
  1. Pegawai Terpantau (`summary?.totalEmployees ?? 0`)
  2. Rata-Rata Skor Kinerja (`summary?.avgMonthlyScore` with rating badge)
  3. Status Rekapitulasi (`totalLocked` vs `totalDraft`)
  4. Kepatuhan Supervisor (`compliancePercentage` with progress bar & level label)

### 3. `AuditFilters.jsx`
- Dropdowns: Bulan (`MONTHS`), Tahun (`YEARS`), Departemen (`departemenList`), Status Kerja (`sttsKerjaList`), Search Nama/NIK (`searchNama`).
- Standard styled inputs with Lucide `Search`, `Filter` icons.

### 4. `AuditCalendarGrid.jsx`
- 7 columns (Sen, Sel, Rab, Kam, Jum, Sab, Min).
- Timezone-safe evaluation date matching:
  `const evalDate = typeof e.tanggal === 'string' ? e.tanggal.slice(0, 10) : moment(e.tanggal).format("YYYY-MM-DD");`
- Renders day boxes with status badges:
  - Non-workday: `OFF` (slate)
  - Workday with approved evaluation: `OK` (emerald badge + score)
  - Workday with submitted evaluation: `PENDING` (amber badge + score)
  - Workday with draft/revisi: `DRAF` / `REVISI` (slate/rose badge + score)
  - Workday without evaluation in past/today: `KOSONG` (rose badge)
  - Workday in future without evaluation: `-` (dashed border)
- Indicator dot for `isTambahan` shifts.
- Clicks trigger `onSelectDay(dateStr, evaluation)`.

### 5. `AuditActivityModal.jsx`
- Dialog modal with `selectedDateStr` formatted as `DD MMMM YYYY`.
- Summary badges: Shift, Kondisi Absensi, Skor Absensi, Total Skor Harian.
- List of activities with completion badges (`Selesai` in emerald / `Belum Selesai` in rose with reasons).

### 6. `AuditDetailDrawer.jsx`
- Slide-over drawer with dark header displaying employee NIK, Name, Dept, Status Kerja, and close button.
- Drawer Month / Year dropdown selectors.
- Stats cards showing:
  1. Hari Wajib Kerja (`stats.workDaysCount`)
  2. Disetujui Spv (`stats.approvedDays` - Emerald)
  3. Pending Spv (`stats.pendingDays` - Amber)
  4. Draft / Revisi (`stats.draftOrRevisiDays` - Slate)
  5. Kosong (`stats.kosongDays` - Rose)
  6. Gap Hari (`stats.gapDays` - Rose)
  7. Rata-Rata Nilai (`stats.avgScore` - Sky/Primary)
- Embeds `AuditCalendarGrid`.

### 7. `AuditTable.jsx`
- Table headers:
  1. NIK
  2. Nama Pegawai
  3. Departemen
  4. Status Kerja
  5. Jadwal (Hari Wajib)
  6. Disetujui (OK)
  7. Pending
  8. Draft
  9. Kosong
  10. Gap
  11. Rata-Rata Skor
  12. Status Rekap
  13. Aksi
- Render table rows with badges:
  - `hari_approved`: emerald bold font/badge
  - `hari_pending`: amber badge (`row.hari_pending > 0 ? amber-100 text-amber-800 : text-slate-400`)
  - `hari_draft`: slate badge (`row.hari_draft > 0 ? slate-200 text-slate-700 : text-slate-400`)
  - `hari_kosong`: rose-soft badge (`row.hari_kosong > 0 ? rose-100 text-rose-700 : text-slate-400`)
  - `gap_hari`: rose badge if > 0
  - `status_rekap`: `LOCKED` (emerald) / `DRAFT` (amber)
  - Detail Audit button with `Eye` icon triggering `onOpenDetail(row)`.
- Loading state spinner, empty state illustration, and pagination footer (Prev/Next buttons).

## Report File
Write your report to `/Users/hardiko/Documents/Developer/NEXT/sdm/.superpowers/sdd/2026-08-28-riwayat-pengawasan-refactor/task-3-report.md`.
