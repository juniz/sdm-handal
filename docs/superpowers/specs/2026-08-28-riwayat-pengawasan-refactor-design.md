# Design Document: Riwayat Pengawasan Modularization, Stats Enhancement & Bug Fixes

## 1. Overview
Halaman **Riwayat Penilaian (Pengawasan / Audit SDM)** di `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js` saat ini merupakan komponen monolitik besar (917 baris). Dokumen ini merancang:
1. Penambahan informasi metrik **Kosong, Pending, dan Draft** secara real-time pada tabel daftar penilaian kinerja pegawai dan pada drawer detail audit.
2. Modularisasi dan pemecahan file menjadi komponen-komponen terisolasi berukuran kecil yang mudah dimaintain.
3. Perbaikan bug frontend terkait timezone formatting pada tanggal kalender evaluasi harian, stabilitas debounced search, dan cascade modal cleanup.

---

## 2. Backend Enhancements (`website/backend`)

### 2.1 Repository Subqueries (`rekap-pengawasan.repository.ts`)
Tambahkan subquery agregasi penilaian harian per pegawai untuk status `submitted` (Pending) dan status `draft` / `revisi` (Draft):
```sql
-- count pending evaluations
(
  SELECT COUNT(*)
  FROM penilaian_harian ph
  WHERE ph.pegawai_id = p.id
    AND MONTH(ph.tanggal) = ?
    AND YEAR(ph.tanggal) = ?
    AND ph.status = 'submitted'
) AS count_pending,

-- count draft or revisi evaluations
(
  SELECT COUNT(*)
  FROM penilaian_harian ph
  WHERE ph.pegawai_id = p.id
    AND MONTH(ph.tanggal) = ?
    AND YEAR(ph.tanggal) = ?
    AND (ph.status = 'draft' OR ph.status = 'revisi')
) AS count_draft
```

### 2.2 Calculation Logic (`rekap-pengawasan.service.ts`)
Di dalam `getRekapPengawasan`:
- `hariPending` = `Number(emp.count_pending) || 0`
- `hariDraft` = `Number(emp.count_draft) || 0`
- `hariKosong` = `Math.max(0, gapHari - hariPending - hariDraft)`
- Menambahkan ketiga properti ini ke objek `RekapPengawasanDto`.

### 2.3 GraphQL Schema & DTO (`rekap-pengawasan-types.ts` & `schema.gql`)
Tambahkan field baru pada `RekapPengawasanDto`:
- `hari_pending: number`
- `hari_draft: number`
- `hari_kosong: number`

---

## 3. Frontend API Route (`sdm`)

Perbarui query GraphQL pada `src/app/api/penilaian/rekap-pengawasan/route.js`:
```graphql
query GetRekapPengawasanList(...) {
  rekapPengawasanList(...) {
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
    meta { ... }
    summary { ... }
  }
}
```

---

## 4. Frontend Component Breakdown (`sdm`)

Struktur folder baru di `src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/`:
```
src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/
├── page.js                      # Orchestrator & state management (~150 lines)
└── components/
    ├── AuditHeader.jsx          # Header banner, judul & reset button
    ├── AuditSummaryCards.jsx    # 4 Executive metric cards
    ├── AuditFilters.jsx         # Filter bulan, tahun, dept, status kerja, search
    ├── AuditTable.jsx           # Main data table + status badges + pagination
    ├── AuditDetailDrawer.jsx    # Slide-over audit drawer + period selector + stats
    ├── AuditCalendarGrid.jsx    # 7-column calendar grid with day badges
    └── AuditActivityModal.jsx   # Day evaluation activity detail modal
```

### Komponen & Tanggung Jawab:

1. **`AuditHeader.jsx`**:
   - Menampilkan judul, icon `ShieldCheck`, breadcrumb/periode aktif, dan tombol `Reset Filter`.

2. **`AuditSummaryCards.jsx`**:
   - Menampilkan 4 kartu eksekutif: Pegawai Terpantau, Rata-Rata Skor Kinerja, Status Rekapitulasi (Locked/Draft), dan Kepatuhan Supervisor.

3. **`AuditFilters.jsx`**:
   - Filter dropdown: Bulan, Tahun, Departemen (dari `/api/departemen`), Status Kerja (dari `/api/stts-kerja`), dan Search input nama/NIK.

4. **`AuditTable.jsx`**:
   - Menampilkan tabel dengan kolom:
     1. **NIK**
     2. **Nama Pegawai**
     3. **Departemen**
     4. **Status Kerja**
     5. **Jadwal** (`total_hari_jadwal`)
     6. **Disetujui** (`hari_approved` - badge emerald)
     7. **Pending** (`hari_pending` - badge amber)
     8. **Draft** (`hari_draft` - badge slate)
     9. **Kosong** (`hari_kosong` - badge rose-soft)
     10. **Gap** (`gap_hari` - badge rose-bold)
     11. **Rata Skor** (`rata_skor_total`)
     12. **Status Rekap** (`LOCKED` / `DRAFT`)
     13. **Aksi** (Tombol `Detail Audit`)
   - Loading skeleton / spinner, empty state, pagination controls.

5. **`AuditDetailDrawer.jsx`**:
   - Slide-over panel yang menampilkan profil pegawai, pemilih bulan/tahun khusus drawer, kartu ringkasan status pegawai (Wajib Kerja, Disetujui, Pending, Draft, Kosong, Gap Hari, Rata Skor), dan memuat `AuditCalendarGrid`.

6. **`AuditCalendarGrid.jsx`**:
   - Render grid kalender 7-hari (Sen-Min).
   - Menampilkan shift harian, badge `OK`, `PENDING`, `DRAF`, `REVISI`, `KOSONG`, `OFF`, `-` (future), penanda shift tambahan, serta trigger klik untuk membuka modal kegiatan.

7. **`AuditActivityModal.jsx`**:
   - Modal popup rincian harian (Shift, Kondisi Absensi, Skor Absensi, Skor Total, dan daftar Kegiatan Harian beserta status selesai/belum).

---

## 5. Bug Fixes & Improvements

1. **Timezone & Date Parsing Mismatch**:
   - Format tanggal dari API database terkadang mengandung ISO string `YYYY-MM-DDT00:00:00.000Z`. Gunakan normalisasi `(typeof e.tanggal === 'string' ? e.tanggal.slice(0, 10) : moment(e.tanggal).format("YYYY-MM-DD"))` untuk mencocokkan cell kalender secara akurat tanpa pergeseran hari.
2. **Drawer & Modal Cleanup**:
   - Saat drawer ditutup, state modal aktivitas direset otomatis agar tidak tertinggal di background.
3. **Debounced Search**:
   - Implementasi debounced search yang rapi tanpa memicu redundant network query berulang saat pengetikan cepat.

---

## 6. Verification Plan

1. **Backend Verification**:
   - Query GraphQL `rekapPengawasanList` mengembalikan data dengan nilai `hari_pending`, `hari_draft`, dan `hari_kosong` yang valid.
2. **Frontend UI Verification**:
   - Tabel menampilkan kolom Disetujui, Pending, Draft, Kosong, Gap dengan tepat.
   - Drawer menampilkan ringkasan metrik dan grid kalender dengan badge status yang sesuai.
   - Mengklik tanggal pada kalender membuka modal rincian kegiatan dengan benar.
   - Filter departemen, status kerja, bulan, tahun, dan pencarian berfungsi responsif.
