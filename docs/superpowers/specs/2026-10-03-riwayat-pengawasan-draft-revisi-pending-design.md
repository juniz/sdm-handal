# Design Document: Riwayat Pengawasan Filter & Detil Evaluasi (Draft, Revisi, Pending)

## 1. Overview
Halaman **Riwayat Penilaian (Pengawasan / Audit SDM)** (`/dashboard/penilaian-kinerja/riwayat-pengawasan`) memfasilitasi pengawasan pemenuhan penilaian harian pegawai.
Fitur baru menambahkan:
1. Pemisahan metrik dan kolom evaluasi `Revisi` dari `Draft`.
2. Filter cepat (status filter pills) pada daftar pegawai untuk menyaring pegawai dengan status evaluasi:
   - `Semua Pegawai` (`ALL`)
   - `Perlu Audit (Gap > 0)` (`ANOMALI`)
   - `Ada Pending` (`PENDING`)
   - `Ada Revisi` (`REVISI`)
   - `Ada Draft` (`DRAFT`)
   - `Belum Selesai (Draft/Revisi/Pending)` (`UNFINISHED`)
3. Tampilan tab terdedikasi di drawer detail pegawai (`AuditDetailDrawer`) untuk melihat seluruh daftar tanggal evaluasi berstatus Pending, Revisi, atau Draft, lengkap dengan akses inspeksi/tindakan langsung ke modal `AuditActivityModal`.

---

## 2. Backend Architecture (`website/backend`)

### 2.1 Repository Subquery (`src/sdm/repositories/rekap-pengawasan.repository.ts`)
Pisahkan subquery penghitungan hari per status:
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

-- count revisi evaluations
(
  SELECT COUNT(*)
  FROM penilaian_harian ph
  WHERE ph.pegawai_id = p.id
    AND MONTH(ph.tanggal) = ?
    AND YEAR(ph.tanggal) = ?
    AND ph.status = 'revisi'
) AS count_revisi,

-- count draft evaluations
(
  SELECT COUNT(*)
  FROM penilaian_harian ph
  WHERE ph.pegawai_id = p.id
    AND MONTH(ph.tanggal) = ?
    AND YEAR(ph.tanggal) = ?
    AND ph.status = 'draft'
) AS count_draft
```

### 2.2 DTO & Schema Types (`src/sdm/dto/rekap-pengawasan-types.ts` & `schema.gql`)
Tambahkan field `hari_revisi` pada `RekapPengawasanDto`:
```typescript
@ObjectType()
export class RekapPengawasanDto {
  // ... existing fields ...
  @Field(() => Int, { description: 'Hari evaluasi menunggu persetujuan (submitted)' })
  hari_pending: number;

  @Field(() => Int, { description: 'Hari evaluasi berstatus revisi' })
  hari_revisi: number;

  @Field(() => Int, { description: 'Hari evaluasi berstatus draft' })
  hari_draft: number;
  // ...
}
```

Perbarui query `rekapPengawasanList` di resolver:
- Argumen baru: `statusFilter?: string` (opsional: `'ALL'`, `'ANOMALI'`, `'PENDING'`, `'REVISI'`, `'DRAFT'`, `'UNFINISHED'`).
- Pertahankan `onlyAnomali?: boolean` untuk kompatibilitas ke belakang (jika `statusFilter` tidak diberikan dan `onlyAnomali === true`, maka berlaku seperti `'ANOMALI'`).

### 2.3 Service Computation (`src/sdm/rekap-pengawasan.service.ts`)
1. Ekstraksi nilai:
   ```typescript
   const hariPending = Number(emp.count_pending) || 0;
   const hariRevisi = Number(emp.count_revisi) || 0;
   const hariDraft = Number(emp.count_draft) || 0;
   ```
2. Perhitungan `hariKosong`:
   ```typescript
   hariKosong = Math.max(0, gapHari - hariPending - hariRevisi - hariDraft);
   ```
3. Penyaringan berdasarkan `statusFilter`:
   ```typescript
   let targetRows = allCalculatedRows;
   const effectiveFilter = statusFilter || (onlyAnomali ? 'ANOMALI' : 'ALL');

   switch (effectiveFilter.toUpperCase()) {
     case 'ANOMALI':
       targetRows = allCalculatedRows.filter((r) => r.gap_hari > 0);
       break;
     case 'PENDING':
       targetRows = allCalculatedRows.filter((r) => r.hari_pending > 0);
       break;
     case 'REVISI':
       targetRows = allCalculatedRows.filter((r) => r.hari_revisi > 0);
       break;
     case 'DRAFT':
       targetRows = allCalculatedRows.filter((r) => r.hari_draft > 0);
       break;
     case 'UNFINISHED':
       targetRows = allCalculatedRows.filter(
         (r) => (r.hari_pending + r.hari_revisi + r.hari_draft) > 0
       );
       break;
     default:
       targetRows = allCalculatedRows;
   }
   ```
4. Penambahan sorting field `hari_revisi`.

---

## 3. Frontend Architecture (`sdm`)

### 3.1 Next.js API Proxy (`src/app/api/penilaian/rekap-pengawasan/route.js`)
Terima parameter query `status_filter` dari URL search params, lalu teruskan ke backend GraphQL query `rekapPengawasanList(..., statusFilter: $statusFilter)`.
Minta field `hari_revisi` dalam GraphQL query selection set.

### 3.2 Main Page Controller (`src/app/dashboard/penilaian-kinerja/riwayat-pengawasan/page.js`)
1. State filter: ganti `onlyAnomali` menjadi `statusFilter` (default: `'ALL'`).
2. Sediakan parameter `status_filter: statusFilter` saat memanggil `/api/penilaian/rekap-pengawasan`.
3. Perbarui `handleResetFilters`, ekspor CSV (`handleExportCsv`), dan cetak PDF (`handlePrintReport`) agar menyertakan kolom `Revisi`.

### 3.3 Filter UI (`AuditFilters.jsx`)
Ganti tombol anomali dua status dengan pill group:
- `Semua` (`ALL`)
- `Perlu Audit (Gap > 0)` (`ANOMALI`)
- `Ada Pending` (`PENDING`)
- `Ada Revisi` (`REVISI`)
- `Ada Draft` (`DRAFT`)
- `Belum Selesai` (`UNFINISHED`)

### 3.4 Table Component (`AuditTable.jsx`)
1. Kolom Header Desktop:
   - `NIK` | `Nama Pegawai` | `Departemen` | `Status Kerja` | `Wajib` | `Disetujui` | `Pending` | `Revisi` | `Draft` | `Kosong` | `Gap Hari` | `Rata Skor` | `Rekap`
2. Sortable field `hari_revisi`.
3. Tampilan Mobile:
   - Tampilkan badge oranye untuk `Revisi: {hariRevisi}` di samping Pending dan Draft.
   - Pilihan sort menu mobile menyertakan `Revisi`.

### 3.5 Detail Drawer Action Tab (`AuditDetailDrawer.jsx`)
1. Di bawah informasi ringkasan statistik drawer, tambahkan segmented tab navigation:
   - **Kalender Evaluasi**: Tampilan kalender grid (`AuditCalendarGrid`).
   - **Daftar Perlu Tindakan ({count})**:
     - Menghitung jumlah evaluasi yang berstatus `submitted` (Pending), `revisi` (Revisi), dan `draft` (Draft).
     - Menampilkan daftar kartu urut tanggal:
       - Tanggal (misal: "12 Oktober 2026"), Hari, Shift kerja.
       - Badge status warna kontras (`PENDING` kuning, `REVISI` oranye, `DRAFT` abu/slate).
       - Skor & catatan (jika ada).
       - Tombol aksi cepat: "Inspeksi / Tindak" yang memanggil `onSelectDay` untuk membuka `AuditActivityModal`.

---

## 4. Testing & Verification

1. **Backend Tests**:
   - Jalankan `npm test src/sdm/repositories/rekap-pengawasan.repository.spec.ts` di `website/backend`.
   - Update unit test untuk memastikan query memisahkan `count_revisi` dan `count_draft`.
2. **Frontend Linter & Build Check**:
   - Jalankan check lint/syntax pada file frontend yang dimodifikasi.
3. **End-to-End Verification**:
   - Buka filter status `PENDING`, `REVISI`, `DRAFT`, dan `UNFINISHED`, pastikan baris pegawai tersaring akurat.
   - Buka drawer detail salah satu pegawai, buka tab "Perlu Tindakan", klik salah satu item evaluasi dan pastikan `AuditActivityModal` terbuka dengan data tanggal dan status yang tepat.
