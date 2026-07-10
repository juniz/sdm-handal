# PRD: Modul Penilaian Kinerja Harian

**Versi:** 4.0 — Final  
**Dibuat:** 26 Juni 2026  
**Status:** Siap Review Developer  
**Aplikasi Induk:** HRIS Monolith (Next.js + MySQL2)

---

## 1. Ringkasan Eksekutif

Modul ini merupakan penambahan fitur pada aplikasi monolith Next.js yang sudah berjalan. Tujuannya adalah menyediakan mekanisme penilaian kinerja harian bagi setiap pegawai **AKTIF** (tidak termasuk TENAGA LUAR dan MITRA) berdasarkan dua komponen:

1. **Daftar kegiatan harian** — to-do list beserta penjabaran pekerjaan yang diselesaikan
2. **Parameter absensi** — status kehadiran yang diresolvasi dari tiga sumber secara berurutan:
   - `pengajuan_cuti` (status `Disetujui`, tanggal masuk dalam range)
   - `pengajuan_izin` (status `Disetujui`, tanggal masuk dalam range)
   - Tabel absensi existing (jika tidak ada cuti/izin aktif)

Hari wajib masuk dihitung **dinamis** dari tabel `jadwal_pegawai` — kolom `h1`–`h31` yang bernilai non-empty. Kolom bernilai `''` (string kosong) adalah hari off/libur dan dikecualikan seluruhnya. Jika hari libur namun pegawai ditugaskan menggantikan rekan, sistem membaca dari tabel `jadwal_tambahan` sebagai **Shift Tambahan (Bonus)**. Shift ini tidak menambah total hari wajib masuk dan **tidak memberikan penalti/alpha** jika diabaikan, namun jika dikerjakan dan di-approve, akan menambah uang jasa secara proporsional.

Skor harian yang disetujui supervisor diakumulasi per bulan. Setiap hari jadwal reguler yang tidak memiliki penilaian `approved` mengurangi nominal jasa secara proporsional terhadap total hari wajib masuk bulan itu. Nominal jasa **bukan** dari `gapok` — dikonfigurasi terpisah oleh HRD.

---

## 2. Latar Belakang & Masalah

### 2.1 Pernyataan Masalah

Absensi, jadwal shift, cuti, dan izin sudah terkelola di sistem, namun belum ada yang menghubungkan seluruh data tersebut ke pencatatan produktivitas harian dan perhitungan jasa secara otomatis. Proses kini manual, rawan subjektivitas dan human error.

### 2.2 Solusi yang Diusulkan

- Pegawai mengisi kegiatan harian (to-do list) pada setiap hari kerja jadwal mereka
- Status kehadiran diresolve otomatis: cek cuti dinas → cek izin → cek absensi → default alpha
- Supervisor **wajib menyetujui** sebelum skor dianggap sah
- Rekap bulanan menghasilkan pengurang jasa berdasarkan gap hari approved vs total hari jadwal

---

## 3. Pengguna (User Personas)

| Persona | Deskripsi | Goals |
|---------|-----------|-------|
| Pegawai AKTIF | Staf yang mengisi laporan harian | Mencatat & membuktikan pekerjaan secara formal |
| Supervisor | Pejabat yang approve penilaian tim | Validasi kelayakan laporan; pantau produktivitas |
| HRD Admin | Operator rekap dan jasa | Angka pengurang jasa otomatis, teraudit, exportable |
| Super Admin | Pengelola konfigurasi sistem | CRUD parameter, override data, buka lock rekap |

---

## 4. Scope & Fitur

### 4.1 Fitur MVP (Versi 1.0)

| # | Fitur | Prioritas |
|---|-------|-----------|
| 1 | Input kegiatan harian (to-do list + penjabaran) | Must Have |
| 2 | Checklist penyelesaian per item dengan timestamp | Must Have |
| 3 | Resolusi status absensi (cuti → izin → absensi → alpha) | Must Have |
| 4 | Integrasi jadwal — hari kerja dari `jadwal_pegawai.hN != ''` | Must Have |
| 5 | Kalkulasi skor harian: (kegiatan × 60%) + (absensi × 40%) | Must Have |
| 6 | Approval supervisor wajib sebelum skor sah | Must Have |
| 7 | Mapping supervisor per departemen/bidang | Must Have |
| 8 | Rekap bulanan + pengurang jasa berbasis jadwal aktual | Must Have |
| 9 | Dashboard riwayat skor pegawai (self-view) | Must Have |
| 10 | Laporan rekap HRD — export | Should Have |
| 11 | Konfigurasi parameter penilaian (bobot & skor kondisi) | Should Have |

### 4.2 Out of Scope

- Pegawai `stts_aktif` TENAGA LUAR dan MITRA tidak dinilai
- Tabel hari libur nasional terpisah (libur = `hN = ''` di jadwal)
- Penggantian sistem payroll existing
- Penilaian KPI jangka panjang

---

## 5. Resolusi Status Absensi (Logika Inti)

Status absensi harian tidak diambil dari satu sumber — diresolvasi secara berurutan:

```
UNTUK tanggal T dan pegawai P:

1. Cek pengajuan_cuti
   WHERE nik = P.nik
     AND tanggal_awal <= T AND tanggal_akhir >= T
     AND status = 'Disetujui'
   → Jika ada: gunakan mapping urgensi cuti ke nilai_kondisi (lihat Tabel Mapping)

2. Cek pengajuan_izin
   WHERE nik = P.nik
     AND tanggal_awal <= T AND tanggal_akhir >= T
     AND status = 'Disetujui'
   → Jika ada: gunakan mapping urgensi izin ke nilai_kondisi (lihat Tabel Mapping)

3. Cek tabel absensi existing
   WHERE pegawai_id / nik = P
     AND tanggal = T
   → Jika ada: tentukan kondisi berdasarkan jam_masuk vs jam_shift jadwal

4. Tidak ada sumber manapun → nilai_kondisi = 'alpha', skor_absensi = 0
```

### Tabel Mapping Urgensi → nilai_kondisi → Skor

**Dari `pengajuan_cuti.urgensi`:**

| urgensi (enum cuti) | nilai_kondisi | Skor Default |
|---------------------|---------------|-------------|
| Sakit | sakit | 70 |
| Tahunan | cuti_tahunan | 80 |
| Melahirkan | cuti_melahirkan | 100 |
| Ibadah Keagamaan | cuti_ibadah | 90 |
| Istimewa | cuti_istimewa | 85 |
| Karena Alasan Penting | cuti_penting | 75 |
| Di luar tanggungan negara | cuti_luar_tanggungan | 60 |
| Tahunan ke luar negeri | cuti_luar_negeri | 80 |
| Keterangan Lainnya | cuti_lainnya | 60 |

**Dari `pengajuan_izin.urgensi`:**

| urgensi (enum izin) | nilai_kondisi | Skor Default |
|---------------------|---------------|-------------|
| Perjalanan Dinas | izin_dinas | 100 |
| Dinas Dalam Kota | izin_dinas_dalam | 100 |
| Dinas Luar Kota | izin_dinas_luar | 100 |
| Lain-lain | izin_lainnya | 65 |

**Dari absensi existing:**

| Kondisi kehadiran | nilai_kondisi | Skor Default |
|-------------------|---------------|-------------|
| Hadir, tepat waktu | tepat_waktu | 100 |
| Hadir, terlambat 1–14 menit | terlambat_ringan | 75 |
| Hadir, terlambat 15–30 menit | terlambat_sedang | 50 |
| Hadir, terlambat > 30 menit | terlambat_berat | 25 |
| Tidak hadir, tanpa keterangan | alpha | 0 |

> Semua skor di atas adalah **default yang dapat dikonfigurasi** melalui tabel `parameter_penilaian`. Admin bisa ubah tanpa deployment ulang.

---

## 6. Persyaratan Fungsional

### 6.1 Integrasi Jadwal

**FR-001:** Sistem menentukan hari kerja dari `jadwal_pegawai`  
**Acceptance Criteria:**
- [ ] Query kolom `h{tanggal}` dari baris `jadwal_pegawai` milik pegawai bulan tersebut
- [ ] Jika nilai `= ''` → hari off; form penilaian tidak ditampilkan, tidak dihitung dalam rekap
- [ ] Jika nilai `!= ''` → hari kerja; tampilkan form dan nama shift di header
- [ ] Jika tidak ada record `jadwal_pegawai` untuk bulan itu → warning ke HRD; hari tidak dihitung

### 6.2 Input Kegiatan Harian

**FR-002:** Pegawai menambah, mengedit, menghapus item kegiatan selama status `draft`  
**Acceptance Criteria:**
- [ ] Hanya aktif jika hari itu adalah hari kerja per jadwal
- [ ] Minimal 1, maksimal 20 item; judul wajib (maks 200 karakter), penjabaran opsional (text)
- [ ] Status `submitted` / `approved` → form readonly untuk pegawai
- [ ] Tidak bisa input untuk tanggal masa depan
- [ ] Hanya pegawai `stts_aktif = 'AKTIF'`

**FR-003:** Tandai item selesai  
**Acceptance Criteria:**
- [ ] Toggle checklist per item; simpan `selesai_at` otomatis
- [ ] Persentase selesai tampil realtime
- [ ] Setelah `submitted` → checklist readonly
- [ ] Jika status kegiatan adalah 'belum' (belum selesai), pegawai dapat menyertakan alasan pekerjaan belum diselesaikan pada field `alasan_belum_selesai` (opsional)

### 6.3 Resolusi Status Absensi

**FR-004:** Sistem meresolusi status absensi secara berurutan  
**Acceptance Criteria:**
- [ ] Prioritas: `pengajuan_cuti` (Disetujui) → `pengajuan_izin` (Disetujui) → absensi existing → alpha
- [ ] Join ke `pengajuan_cuti` via `pegawai.nik` (bukan id), filter `tanggal_awal <= T AND tanggal_akhir >= T AND status = 'Disetujui'`
- [ ] Join ke `pengajuan_izin` via `pegawai.nik`, filter sama
- [ ] Mapping urgensi → `nilai_kondisi` dilakukan di application layer sesuai Tabel Mapping di Bagian 5
- [ ] Hasil resolusi ditampilkan di form penilaian sebagai informasi (tidak bisa diubah pegawai)
- [ ] Sumber resolusi dicatat di kolom `sumber_absensi` pada `penilaian_harian`
- [ ] Jika hasil resolusi absensi (`nilai_kondisi`) berstatus terlambat (`terlambat_ringan`, `terlambat_sedang`, `terlambat_berat`), pegawai wajib menyertakan alasan keterlambatan pada kolom `alasan_terlambat` sebelum dikirim

### 6.4 Kalkulasi Skor Harian

**FR-005:** Sistem menghitung skor saat pegawai submit  
**Acceptance Criteria:**
- [ ] `skor_kegiatan = (item_selesai / total_item) × 100`; jika tidak ada item → 0
- [ ] `skor_absensi` = `nilai_skor` dari `parameter_penilaian` sesuai `nilai_kondisi` hasil resolusi
- [ ] `skor_total = (skor_kegiatan × bobot_kegiatan%) + (skor_absensi × bobot_absensi%)`
- [ ] Bobot diambil dari `parameter_penilaian`, tidak hardcode

### 6.5 Approval Supervisor (Wajib)

**FR-006:** Penilaian tidak sah sampai supervisor approve
**Acceptance Criteria:**
[ ] Setelah submit → status `submitted`; belum masuk rekap
[ ] Supervisor melihat queue pending dari `supervisor_mapping` (departemen/bidang-nya atau mapping personal)
[ ] **Sistem secara otomatis mengecualikan (exclude) supervisor dari queue penilaian timnya sendiri (mencegah self-assessment)**
[ ] **Sistem mendukung hierarki penilaian berjenjang (personal mapping) di mana atasan dari seorang supervisor dapat dikonfigurasi untuk menilai supervisor tersebut**
[ ] Supervisor bisa: approve (→ `approved`) atau kembalikan dengan catatan (→ `revisi`)
[ ] Jika dikembalikan → pegawai bisa edit dan submit ulang
[ ] Supervisor tidak bisa ubah angka skor secara langsung
[ ] Hanya status `approved` masuk rekap bulanan

### 6.6 Rekap Bulanan & Pengurang Jasa

**FR-007:** Rekap dinamis berbasis total hari jadwal aktual  
**Acceptance Criteria:**
- [ ] `total_hari_jadwal` = COUNT(`hN != ''`) dari `jadwal_pegawai` bulan tersebut
- [ ] `hari_approved` = COUNT `penilaian_harian` status `approved` bulan tersebut
- [ ] `gap_hari = GREATEST(0, total_hari_jadwal - hari_approved)`
- [ ] `pengurang_jasa = (gap_hari / total_hari_jadwal) × nominal_jasa_dasar`
- [ ] `nominal_jasa_final = nominal_jasa_dasar - pengurang_jasa`
- [ ] Jika `total_hari_jadwal = 0` → skip, tampilkan warning
- [ ] Rekap bisa di-lock (draft → final); final hanya bisa dibuka Super Admin

---

## 7. Persyaratan Non-Fungsional

| Kategori | Requirement | Target |
|----------|-------------|--------|
| Performance | Load halaman penilaian | < 2 detik |
| Security | Pegawai hanya akses data diri sendiri | WHERE via session |
| Security | Supervisor hanya akses tim-nya | Filter via `supervisor_mapping` |
| Data Integrity | Satu penilaian per pegawai per hari | UNIQUE KEY |
| Data Integrity | Penilaian hanya untuk hari jadwal non-empty | Validasi di API layer |
| Audit | Siapa approve, kapan, sumber absensi | Kolom di `penilaian_harian` |

---

## 8. Arsitektur API Routes

```
/api/penilaian
  ├── GET  /jadwal?pegawai_id=&bulan=&tahun=        → Ambil jadwal shift + hari kerja
  ├── GET  /absensi-status?pegawai_id=&tanggal=     → Resolve status absensi hari itu
  ├── GET  /harian?tanggal=&pegawai_id=             → Ambil penilaian + kegiatan
  ├── POST /harian                                   → Buat penilaian baru (draft)
  ├── PUT  /harian/:id                               → Update kegiatan / checklist
  ├── POST /harian/:id/submit                        → Ubah ke submitted
  ├── POST /harian/:id/approve                       → Supervisor approve
  ├── POST /harian/:id/revisi                        → Supervisor kembalikan
  ├── GET  /rekap?bulan=&tahun=                     → Generate rekap bulanan
  ├── POST /rekap/:id/lock                           → Lock rekap final
  ├── GET  /supervisor/pending?supervisor_id=        → Queue approval supervisor
  └── GET  /parameter                                → Ambil konfigurasi bobot & skor
```

---

## 9. Desain Database

### 9.1 Tabel `penilaian_harian`

```sql
CREATE TABLE `penilaian_harian` (
  `id`                int NOT NULL AUTO_INCREMENT,
  `pegawai_id`        int NOT NULL,
  `tanggal`           date NOT NULL,
  `shift_jadwal`      varchar(20) DEFAULT NULL
                      COMMENT 'Snapshot nilai hN dari jadwal_pegawai, misal: Pagi, Siang, Malam',
  `sumber_absensi`    enum('cuti','izin','absensi','alpha') NOT NULL DEFAULT 'alpha'
                      COMMENT 'Sumber data yang digunakan saat resolusi status kehadiran',
  `ref_cuti_no`       varchar(17) DEFAULT NULL
                      COMMENT 'no_pengajuan dari pengajuan_cuti jika sumber=cuti',
  `ref_izin_no`       varchar(17) DEFAULT NULL
                      COMMENT 'no_pengajuan dari pengajuan_izin jika sumber=izin',
  `nilai_kondisi`     varchar(30) DEFAULT NULL
                      COMMENT 'Kondisi kehadiran hasil resolusi, misal: tepat_waktu, izin_dinas, sakit',
  `skor_kegiatan`     decimal(5,2) DEFAULT 0.00
                      COMMENT 'Nilai 0-100 dari produktivitas kegiatan (sebelum ditimbang bobot)',
  `skor_absensi`      decimal(5,2) DEFAULT 0.00
                      COMMENT 'Nilai 0-100 dari kondisi kehadiran (sebelum ditimbang bobot)',
  `skor_total`        decimal(5,2) DEFAULT 0.00
                      COMMENT 'Gabungan: (skor_kegiatan × bobot_kegiatan%) + (skor_absensi × bobot_absensi%)',
  `status`            enum('draft','submitted','approved','revisi') NOT NULL DEFAULT 'draft',
  `catatan_supervisor` text DEFAULT NULL,
  `alasan_terlambat`  text DEFAULT NULL
                      COMMENT 'Alasan yang diisi oleh pegawai apabila datang terlambat',
  `dibuat_oleh`       int NOT NULL
                      COMMENT 'FK pegawai.id — pegawai yang input',
  `approved_by`       int DEFAULT NULL
                      COMMENT 'FK pegawai.id — supervisor yang approve',
  `approved_at`       timestamp NULL DEFAULT NULL,
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pegawai_tanggal` (`pegawai_id`, `tanggal`),
  KEY `idx_tanggal` (`tanggal`),
  KEY `idx_status` (`status`),
  KEY `idx_pegawai_status` (`pegawai_id`, `status`),
  KEY `idx_approved_by` (`approved_by`),
  CONSTRAINT `fk_ph_pegawai`
    FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_ph_approved_by`
    FOREIGN KEY (`approved_by`) REFERENCES `pegawai` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Satu record per pegawai per hari kerja jadwal';
```

### 9.2 Tabel `kegiatan_harian`

```sql
CREATE TABLE `kegiatan_harian` (
  `id`              int NOT NULL AUTO_INCREMENT,
  `penilaian_id`    int NOT NULL,
  `judul_kegiatan`  varchar(200) NOT NULL,
  `penjabaran`      text DEFAULT NULL
                    COMMENT 'Narasi detail pekerjaan yang dilakukan pada hari itu',
  `prioritas`       enum('tinggi','sedang','rendah') NOT NULL DEFAULT 'sedang',
  `status_selesai`  enum('belum','selesai') NOT NULL DEFAULT 'belum',
  `alasan_belum_selesai` text DEFAULT NULL
                    COMMENT 'Keterangan alasan apabila pekerjaan tersebut belum dapat diselesaikan',
  `urutan`          tinyint unsigned NOT NULL DEFAULT 1,
  `selesai_at`      timestamp NULL DEFAULT NULL
                    COMMENT 'Otomatis diisi saat item dicentang selesai',
  `created_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_penilaian_id` (`penilaian_id`),
  KEY `idx_urutan` (`penilaian_id`, `urutan`),
  CONSTRAINT `fk_kh_penilaian`
    FOREIGN KEY (`penilaian_id`) REFERENCES `penilaian_harian` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Item to-do list per entri penilaian harian';
```

### 9.3 Tabel `parameter_penilaian`

```sql
CREATE TABLE `parameter_penilaian` (
  `id`              int NOT NULL AUTO_INCREMENT,
  `kode`            varchar(20) NOT NULL,
  `nama_parameter`  varchar(100) NOT NULL,
  `kategori`        enum('kegiatan','absensi') NOT NULL,
  `bobot_persen`    decimal(5,2) NOT NULL DEFAULT 0.00
                    COMMENT 'Bobot tertimbang: kegiatan=60, absensi=40. Total dua kategori = 100',
  `nilai_kondisi`   varchar(50) DEFAULT NULL
                    COMMENT 'Kode kondisi hasil resolusi absensi. NULL untuk kategori kegiatan',
  `nilai_skor`      decimal(5,2) DEFAULT NULL
                    COMMENT 'Skor 0-100 untuk kondisi ini. NULL untuk kategori kegiatan',
  `deskripsi`       text DEFAULT NULL,
  `is_aktif`        tinyint(1) NOT NULL DEFAULT 1,
  `created_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kode` (`kode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Konfigurasi bobot dan skor per kondisi penilaian — dapat diubah admin tanpa deploy ulang';
```

**Data awal (seed) lengkap — mencakup seluruh kondisi cuti, izin, dan absensi:**

```sql
INSERT INTO `parameter_penilaian`
  (`kode`, `nama_parameter`, `kategori`, `bobot_persen`, `nilai_kondisi`, `nilai_skor`, `deskripsi`)
VALUES
-- Kegiatan (1 baris, skor dihitung dari % item selesai)
  ('KGT_PRODUKTIF',      'Produktivitas kegiatan',       'kegiatan', 60.00, NULL,                  NULL,   'Bobot skor kegiatan. Nilai = (item selesai / total item) × 100'),

-- Absensi — dari tabel absensi existing
  ('ABN_TEPAT',          'Hadir tepat waktu',             'absensi',  40.00, 'tepat_waktu',         100.00, 'Masuk sebelum atau tepat jam kerja shift'),
  ('ABN_TLB15',          'Terlambat < 15 menit',          'absensi',  40.00, 'terlambat_ringan',     75.00, 'Terlambat 1–14 menit dari jam shift'),
  ('ABN_TLB30',          'Terlambat 15–30 menit',         'absensi',  40.00, 'terlambat_sedang',     50.00, 'Terlambat 15–30 menit dari jam shift'),
  ('ABN_TLB60',          'Terlambat > 30 menit',          'absensi',  40.00, 'terlambat_berat',      25.00, 'Terlambat lebih dari 30 menit dari jam shift'),
  ('ABN_ALPHA',          'Alpha / tanpa keterangan',      'absensi',  40.00, 'alpha',                 0.00, 'Tidak hadir tanpa keterangan apapun'),

-- Cuti — dari pengajuan_cuti (Disetujui)
  ('CUT_SAKIT',          'Sakit (surat dokter)',           'absensi',  40.00, 'sakit',                70.00, 'Cuti sakit dengan surat keterangan dokter'),
  ('CUT_TAHUNAN',        'Cuti tahunan',                  'absensi',  40.00, 'cuti_tahunan',          80.00, 'Cuti tahunan yang disetujui'),
  ('CUT_MELAHIRKAN',     'Cuti melahirkan',               'absensi',  40.00, 'cuti_melahirkan',      100.00, 'Hak cuti melahirkan — tidak mengurangi penilaian'),
  ('CUT_IBADAH',         'Cuti ibadah keagamaan',         'absensi',  40.00, 'cuti_ibadah',           90.00, 'Cuti untuk ibadah keagamaan yang disetujui'),
  ('CUT_ISTIMEWA',       'Cuti istimewa',                 'absensi',  40.00, 'cuti_istimewa',          85.00, 'Cuti istimewa yang disetujui atasan'),
  ('CUT_PENTING',        'Cuti alasan penting',           'absensi',  40.00, 'cuti_penting',           75.00, 'Cuti karena alasan penting yang disetujui'),
  ('CUT_LUAR_TNG',       'Cuti luar tanggungan negara',   'absensi',  40.00, 'cuti_luar_tanggungan',  60.00, 'Cuti di luar tanggungan negara'),
  ('CUT_LN',             'Cuti tahunan luar negeri',      'absensi',  40.00, 'cuti_luar_negeri',       80.00, 'Cuti tahunan ke luar negeri'),
  ('CUT_LAINNYA',        'Cuti keterangan lainnya',       'absensi',  40.00, 'cuti_lainnya',           60.00, 'Cuti dengan keterangan lain yang disetujui'),

-- Izin — dari pengajuan_izin (Disetujui)
  ('IZN_DINAS',          'Perjalanan dinas',              'absensi',  40.00, 'izin_dinas',            100.00, 'Perjalanan dinas resmi yang disetujui — tidak mengurangi penilaian'),
  ('IZN_DINAS_DLM',      'Dinas dalam kota',              'absensi',  40.00, 'izin_dinas_dalam',      100.00, 'Dinas dalam kota resmi yang disetujui'),
  ('IZN_DINAS_LR',       'Dinas luar kota',               'absensi',  40.00, 'izin_dinas_luar',       100.00, 'Dinas luar kota resmi yang disetujui'),
  ('IZN_LAINNYA',        'Izin lain-lain',                'absensi',  40.00, 'izin_lainnya',           65.00, 'Izin lain-lain yang disetujui atasan'),

-- Tambahan Bonus
  ('JASA_SHIFT_TAMBAHAN', 'Nominal Bonus Shift Tambahan', 'uang_jasa', 0.00, NULL,                  50000.00, 'Nominal bonus harian uang jasa untuk penilaian dari shift tambahan');
```

### 9.4 Tabel `supervisor_mapping`

```sql
CREATE TABLE `supervisor_mapping` (
  `id`              int NOT NULL AUTO_INCREMENT,
  `tipe_relasi`     enum('unit','personal') NOT NULL DEFAULT 'unit'
                    COMMENT 'unit: mapping massal berbasis departemen/bidang. personal: mapping hierarki atasan langsung (1-on-1)',
  `pegawai_id`      int DEFAULT NULL
                    COMMENT 'FK pegawai.id (WAJIB jika tipe_relasi=personal). ID pegawai yang dinilai secara personal.',
  `supervisor_id`   int NOT NULL
                    COMMENT 'FK pegawai.id — Atasan yang melakukan penilaian (Evaluator)',
  `tipe_unit`       enum('departemen','bidang') DEFAULT NULL
                    COMMENT 'WAJIB jika tipe_relasi=unit',
  `kode_unit`       varchar(30) DEFAULT NULL
                    COMMENT 'WAJIB jika tipe_relasi=unit. Nilai departemen atau bidang',
  `is_aktif`        tinyint(1) NOT NULL DEFAULT 1
                    COMMENT '0 = nonaktif tapi histori tetap tersimpan',
  `berlaku_mulai`   date NOT NULL
                    COMMENT 'Tanggal mulai mapping ini berlaku',
  `berlaku_sampai`  date DEFAULT NULL
                    COMMENT 'NULL = masih aktif sampai sekarang',
  `dibuat_oleh`     int DEFAULT NULL
                    COMMENT 'FK pegawai.id — admin yang membuat mapping ini',
  `created_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mapping_active` (`tipe_relasi`, `pegawai_id`, `tipe_unit`, `kode_unit`, `supervisor_id`, `berlaku_mulai`),
  KEY `idx_supervisor` (`supervisor_id`),
  KEY `idx_pegawai` (`pegawai_id`),
  KEY `idx_unit` (`tipe_unit`, `kode_unit`),
  CONSTRAINT `fk_sm_supervisor`
    FOREIGN KEY (`supervisor_id`) REFERENCES `pegawai` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Mapping hierarki penilaian: mendukung mapping massal (unit) dan hierarki atasan (personal)';
```

**Penjelasan Tipe Relasi:**

1. **`unit`**: Supervisor menilai semua pegawai dalam satu departemen/bidang secara massal. (Contoh: Kepala Unit IT menilai semua staff IT).
2. **`personal`**: Supervisor menilai 1 pegawai tertentu secara spesifik berdasarkan hierarki struktur organisasi. (Contoh: Kaur SIM RM menilai Kepala Unit IT).

**Contoh Data `supervisor_mapping`:**
```sql
-- 1. Kepala Unit IT (id=10) menilai SEMUA pegawai di Departemen IT (kode: IT__)
INSERT INTO supervisor_mapping (tipe_relasi, tipe_unit, kode_unit, supervisor_id, berlaku_mulai)
VALUES ('unit', 'departemen', 'IT__', 10, '2026-01-01');

-- 2. Kaur SIM RM (id=20) menilai Kepala Unit IT (id=10) secara personal (Hierarki)
INSERT INTO supervisor_mapping (tipe_relasi, pegawai_id, supervisor_id, berlaku_mulai)
VALUES ('personal', 10, 20, '2026-01-01');

-- 3. Direktur RS (id=30) menilai Kaur SIM RM (id=20) secara personal
INSERT INTO supervisor_mapping (tipe_relasi, pegawai_id, supervisor_id, berlaku_mulai)
VALUES ('personal', 20, 30, '2026-01-01');

Query 1: Ambil Queue Penilaian untuk Supervisor (Mengecualikan Diri Sendiri)
Digunakan saat Supervisor membuka menu "Penilaian Tim".

SELECT p.id, p.nama, p.departemen
FROM pegawai p
JOIN supervisor_mapping sm
  ON (
    -- Kondisi 1: Mapping Personal (Hierarki)
    (sm.tipe_relasi = 'personal' AND sm.pegawai_id = p.id)
    OR
    -- Kondisi 2: Mapping Unit (Departemen/Bidang)
    (sm.tipe_relasi = 'unit' AND (
       (sm.tipe_unit = 'departemen' AND p.departemen = sm.kode_unit) OR
       (sm.tipe_unit = 'bidang' AND p.bidang = sm.kode_unit)
    ))
  )
WHERE sm.supervisor_id = ? -- ID Supervisor yang login
  AND sm.is_aktif = 1
  AND sm.berlaku_mulai <= CURDATE()
  AND (sm.berlaku_sampai IS NULL OR sm.berlaku_sampai >= CURDATE())
  AND p.stts_aktif = 'AKTIF'
  AND p.id != sm.supervisor_id; -- ⚠️ PENTING: Exclude diri sendiri (No Self-Assessment)


Query 2: Mencari "Siapa Atasan Penilai Saya?"
Digunakan saat Pegawai submit penilaian untuk menentukan approved_by. Aturan: Personal mapping selalu diprioritaskan di atas Unit mapping.

SELECT sm.supervisor_id
FROM supervisor_mapping sm
WHERE sm.is_aktif = 1
  AND sm.berlaku_mulai <= CURDATE()
  AND (sm.berlaku_sampai IS NULL OR sm.berlaku_sampai >= CURDATE())
  AND (
    -- Cek Personal Mapping (Prioritas Utama)
    (sm.tipe_relasi = 'personal' AND sm.pegawai_id = ?) 
    OR
    -- Cek Unit Mapping (Fallback)
    (sm.tipe_relasi = 'unit' AND (
       (sm.tipe_unit = 'departemen' AND ? = sm.kode_unit) OR 
       (sm.tipe_unit = 'bidang' AND ? = sm.kode_unit)       
    ))
  )
ORDER BY FIELD(sm.tipe_relasi, 'personal', 'unit') ASC 
LIMIT 1;


### 9.5 Tabel `rekap_bulanan`

```sql
CREATE TABLE `rekap_bulanan` (
  `id`                    int NOT NULL AUTO_INCREMENT,
  `pegawai_id`            int NOT NULL,
  `bulan`                 tinyint unsigned NOT NULL COMMENT '1–12',
  `tahun`                 smallint unsigned NOT NULL,
  `total_hari_jadwal`     tinyint unsigned NOT NULL DEFAULT 0
                          COMMENT 'COUNT(hN != empty) dari jadwal_pegawai bulan ini',
  `hari_approved`         tinyint unsigned NOT NULL DEFAULT 0
                          COMMENT 'COUNT penilaian_harian status=approved bulan ini',
  `gap_hari`              tinyint unsigned NOT NULL DEFAULT 0
                          COMMENT 'GREATEST(0, total_hari_jadwal - hari_approved)',
  `rata_skor_total`       decimal(5,2) DEFAULT 0.00
                          COMMENT 'AVG(skor_total) dari semua hari approved — referensi kinerja',
  `nominal_jasa_dasar`    decimal(15,2) NOT NULL DEFAULT 0.00
                          COMMENT 'Dari jasa_dasar_pegawai berlaku bulan ini',
  `pengurang_jasa`        decimal(15,2) DEFAULT 0.00
                          COMMENT '(gap_hari / total_hari_jadwal) × nominal_jasa_dasar',
  `nominal_jasa_final`    decimal(15,2) DEFAULT 0.00
                          COMMENT 'nominal_jasa_dasar - pengurang_jasa',
  `status_rekap`          enum('draft','final') NOT NULL DEFAULT 'draft',
  `catatan`               text DEFAULT NULL,
  `generated_by`          int DEFAULT NULL,
  `generated_at`          timestamp NULL DEFAULT NULL,
  `locked_by`             int DEFAULT NULL,
  `locked_at`             timestamp NULL DEFAULT NULL,
  `created_at`            timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`            timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pegawai_bulan_tahun` (`pegawai_id`, `bulan`, `tahun`),
  KEY `idx_bulan_tahun` (`bulan`, `tahun`),
  KEY `idx_status_rekap` (`status_rekap`),
  CONSTRAINT `fk_rb_pegawai`
    FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9.6 Tabel `jasa_dasar_pegawai`

```sql
CREATE TABLE `jasa_dasar_pegawai` (
  `id`                  int NOT NULL AUTO_INCREMENT,
  `pegawai_id`          int NOT NULL,
  `berlaku_mulai`       date NOT NULL,
  `berlaku_sampai`      date DEFAULT NULL COMMENT 'NULL = berlaku sampai ada record lebih baru',
  `nominal_jasa_dasar`  decimal(15,2) NOT NULL COMMENT 'Bukan dari gapok, dikonfigurasi HRD',
  `keterangan`          varchar(100) DEFAULT NULL,
  `dibuat_oleh`         int DEFAULT NULL,
  `created_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pegawai_berlaku` (`pegawai_id`, `berlaku_mulai`),
  CONSTRAINT `fk_jdp_pegawai`
    FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 9.7 Tabel `master_kegiatan_kerja`

```sql
CREATE TABLE `master_kegiatan_kerja` (
  `id`             int NOT NULL AUTO_INCREMENT,
  `dep_id`         char(4) DEFAULT NULL COMMENT 'NULL = kegiatan global/umum untuk semua unit',
  `nama_kegiatan`  varchar(200) NOT NULL,
  `deskripsi`      text DEFAULT NULL,
  `prioritas`      enum('tinggi','sedang','rendah') NOT NULL DEFAULT 'sedang',
  `is_aktif`       tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 = aktif, 0 = nonaktif',
  `created_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dep_id` (`dep_id`),
  CONSTRAINT `fk_mkk_departemen`
    FOREIGN KEY (`dep_id`) REFERENCES `departemen` (`dep_id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Template nama kegiatan kerja per unit';
```

---

## 10. Formula Kalkulasi Lengkap

### 10.1 Baca Jadwal Hari Ini

```javascript
// API: GET /api/penilaian/jadwal
let isTambahan = false;
let row = await db.query(
  `SELECT h${tanggal} AS shift FROM jadwal_pegawai
   WHERE id = ? AND tahun = ? AND bulan = ?`,
  [pegawaiId, tahun, bulan]
);
let shift = row[0]?.shift ?? '';

// Fallback cek jadwal tambahan
if (shift === '') {
  row = await db.query(
    `SELECT h${tanggal} AS shift FROM jadwal_tambahan
     WHERE id = ? AND tahun = ? AND bulan = ?`,
    [pegawaiId, tahun, bulan]
  );
  shift = row[0]?.shift ?? '';
  if (shift !== '') isTambahan = true;
}

const isHariKerja = shift !== '';
// Jika !isHariKerja → return { hariKerja: false }, form tidak tampil
// Jika isHariKerja → return { hariKerja: true, shift, isTambahan }
```

### 10.2 Resolusi Status Absensi

```javascript
// API: GET /api/penilaian/absensi-status
async function resolveAbsensi(nikPegawai, pegawaiId, tanggal) {

  // Prioritas 1: Cuti disetujui
  const cuti = await db.query(`
    SELECT urgensi FROM pengajuan_cuti
    WHERE nik = ? AND status = 'Disetujui'
      AND tanggal_awal <= ? AND tanggal_akhir >= ?
    LIMIT 1`, [nikPegawai, tanggal, tanggal]);

  if (cuti.length > 0) {
    return {
      sumber: 'cuti',
      nilai_kondisi: mapCutiToKondisi(cuti[0].urgensi), // lihat Tabel Mapping
      ref_no: cuti[0].no_pengajuan
    };
  }

  // Prioritas 2: Izin disetujui
  const izin = await db.query(`
    SELECT urgensi, no_pengajuan FROM pengajuan_izin
    WHERE nik = ? AND status = 'Disetujui'
      AND tanggal_awal <= ? AND tanggal_akhir >= ?
    LIMIT 1`, [nikPegawai, tanggal, tanggal]);

  if (izin.length > 0) {
    return {
      sumber: 'izin',
      nilai_kondisi: mapIzinToKondisi(izin[0].urgensi),
      ref_no: izin[0].no_pengajuan
    };
  }

  // Prioritas 3: Absensi existing
  const absen = await db.query(`
    SELECT jam_masuk FROM absensi  -- sesuaikan nama tabel & kolom
    WHERE pegawai_id = ? AND tanggal = ?
    LIMIT 1`, [pegawaiId, tanggal]);

  if (absen.length > 0) {
    return {
      sumber: 'absensi',
      nilai_kondisi: hitungKeterlambatan(absen[0].jam_masuk, shiftJamMulai)
    };
  }

  // Default: alpha
  return { sumber: 'alpha', nilai_kondisi: 'alpha' };
}
```

### 10.3 Skor Harian

```
skor_kegiatan = (SUM(Bobot Kegiatan Selesai) / SUM(Bobot Semua Kegiatan)) × 100   → 0 jika tidak ada item
                -- Bobot diperoleh secara dinamis dari parameter_penilaian:
                -- Tinggi  = KGT_BOBOT_TINGGI (default 3.00)
                -- Sedang  = KGT_BOBOT_SEDANG (default 2.00)
                -- Rendah  = KGT_BOBOT_RENDAH (default 1.00)

skor_absensi  = nilai_skor dari parameter_penilaian
                WHERE nilai_kondisi = hasil_resolusi AND is_aktif = 1

skor_total    = (skor_kegiatan × bobot_kegiatan / 100)
              + (skor_absensi  × bobot_absensi  / 100)
              -- bobot diambil dari parameter_penilaian.bobot_persen
```

### 10.4 Rekap Bulanan

```javascript
// Application layer — hitung total hari jadwal
const jadwal = await db.query(
  `SELECT * FROM jadwal_pegawai WHERE id = ? AND tahun = ? AND bulan = ?`,
  [pegawaiId, tahun, bulan]
);
const row = jadwal[0];
let totalHariJadwal = 0; // Hari Wajib Masuk dari jadwal_pegawai
for (let i = 1; i <= 31; i++) {
  if (row?.[`h${i}`] && row[`h${i}`] !== '') totalHariJadwal++;
}

// Hitung hari approved reguler vs bonus
const stats = await db.query(`
  SELECT 
    SUM(CASE WHEN is_tambahan = 0 THEN 1 ELSE 0 END) AS hari_approved_reguler,
    SUM(CASE WHEN is_tambahan = 1 THEN 1 ELSE 0 END) AS hari_approved_bonus
  FROM penilaian_harian
  WHERE pegawai_id = ?
    AND MONTH(tanggal) = ? AND YEAR(tanggal) = ?
    AND status = 'approved'`, [pegawaiId, bulan, tahun]);

const hari_approved_reguler = stats[0].hari_approved_reguler || 0;
const hari_approved_bonus = stats[0].hari_approved_bonus || 0;

// Kalkulasi Reguler
const gap_hari = Math.max(0, totalHariJadwal - hari_approved_reguler);
const pengurang = totalHariJadwal > 0
  ? (gap_hari / totalHariJadwal) * nominal_jasa_dasar
  : 0;
const jasa_reguler = nominal_jasa_dasar - pengurang;

// Tambahan Bonus
const nominal_tambahan = parameter_JASA_SHIFT_TAMBAHAN;
const jasa_bonus = hari_approved_bonus * nominal_tambahan;

const jasa_final = jasa_reguler + jasa_bonus;
```

### 10.5 Contoh Perhitungan

| Item | Nilai |
|------|-------|
| Jadwal hN non-empty (dari `jadwal_pegawai`) | 26 hari |
| Hari penilaian approved (Reguler) | 22 hari |
| Hari penilaian approved (Shift Tambahan) | 2 hari |
| Gap hari reguler | 4 hari |
| Nominal jasa dasar | Rp 3.000.000 |
| Pengurang Reguler | (4/26) × 3.000.000 = **Rp 461.538** |
| Subtotal Reguler | **Rp 2.538.462** |
| Rate Bonus Tambahan | Rp 50.000 |
| Total Bonus Tambahan | 2 × 50.000 = **Rp 100.000** |
| Nominal jasa final | **Rp 2.638.462** |

---

## 11. Keamanan & Otorisasi

| Role | Akses |
|------|-------|
| Pegawai | Hanya data diri sendiri; hanya hari kerja jadwal |
| Supervisor | Hanya pegawai di unit dari `supervisor_mapping` (tipe unit) atau yang di-mapping secara personal (tipe personal) yang aktif, **kecuali dirinya sendiri** |
| HRD Admin | Semua pegawai AKTIF; generate/lock rekap; CRUD `jasa_dasar_pegawai` |
| Super Admin | CRUD `parameter_penilaian`, CRUD `supervisor_mapping`, CRUD `master_kegiatan_kerja`, buka lock rekap |

---

## 12. Struktur Menu / Navigasi

```
Sidebar Aplikasi
└── Penilaian Kinerja
    ├── Penilaian Saya Hari Ini       ← Pegawai AKTIF
    ├── Riwayat Penilaian Saya        ← Pegawai AKTIF
    ├── Penilaian Tim (Approval)      ← Supervisor
    ├── Rekap Kinerja Bulanan         ← HRD Admin
    ├── Jasa Dasar Pegawai            ← HRD Admin
    ├── Mapping Supervisor            ← Super Admin
    ├── Parameter Penilaian           ← Super Admin
    └── Master Kegiatan Kerja         ← Super Admin / IT
```

---

## 13. Timeline & Milestones

| Fase | Deliverable | Estimasi |
|------|-------------|---------|
| Fase 1 — DB | 6 tabel baru, seed `parameter_penilaian`, seed `supervisor_mapping` awal | [TBD] |
| Fase 2 — API Core | Routes jadwal, resolusi absensi, penilaian CRUD, kalkulasi skor | [TBD] |
| Fase 3 — UI Pegawai | Halaman penilaian harian + to-do list | [TBD] |
| Fase 4 — UI Supervisor | Queue approval, detail review, approve/kembalikan | [TBD] |
| Fase 5 — UI HRD | Rekap bulanan, jasa dasar, export Excel, lock | [TBD] |
| Fase 6 — UAT | Testing end-to-end, validasi formula jasa, go-live | [TBD] |

---

## 14. Risiko & Mitigasi

| Risiko | Prob. | Dampak | Mitigasi |
|--------|-------|--------|----------|
| Nama/struktur tabel absensi existing belum dikonfirmasi | Tinggi | Tinggi | Audit tabel absensi sebelum Fase 2; buat view adapter `v_absensi_harian` |
| Pegawai tidak punya record di `jadwal_pegawai` | Sedang | Tinggi | Warning ke HRD saat generate rekap; skip pegawai tanpa jadwal |
| Cuti/izin di `Proses Pengajuan` belum diproses saat penilaian | Sedang | Sedang | Hanya status `Disetujui` yang diperhitungkan; status lain jatuh ke absensi/alpha |
| Supervisor lupa/terlambat approve | Tinggi | Tinggi | Badge pending di menu; (v2) notifikasi push/email |
| Kolom `h29`–`h31` terisi untuk bulan pendek | Rendah | Rendah | Validasi di app layer: skip jika tanggal tidak valid untuk bulan itu |
| Satu pegawai punya cuti dan izin aktif bersamaan | Rendah | Sedang | Prioritas cuti > izin sesuai logika resolusi; catat sumber di `sumber_absensi` |
| Top-level executive (misal: Direktur) tidak memiliki atasan di dalam sistem sehingga tidak bisa dinilai | Rendah | Sedang | Biarkan `supervisor_id` kosong/null untuk level tertinggi, atau buat role khusus "Yayasan/Pengawas" di luar sistem HRIS ini. Penilaian dilakukan manual/offline. |

---

## 15. Pertanyaan Terbuka — Tersisa (1 Item)

- [ ] **Nama tabel dan struktur kolom absensi existing** — khususnya: nama tabel, kolom pegawai (id atau nik?), kolom tanggal, dan kolom jam masuk. Diperlukan sebelum Fase 2 untuk membuat view adapter.

---

## Appendix A — Ringkasan Semua Tabel

| Tabel | Fungsi | Tabel Induk |
|-------|--------|-------------|
| `penilaian_harian` | Record penilaian per pegawai per hari | `pegawai.id` |
| `kegiatan_harian` | Item to-do list per penilaian | `penilaian_harian.id` |
| `parameter_penilaian` | Bobot dan skor per kondisi — configurable | — |
| supervisor_mapping | **Mapping supervisor ke departemen/bidang (unit) atau hierarki atasan langsung (personal)** | pegawai.id |
| `rekap_bulanan` | Akumulasi bulanan dan nominal jasa | `pegawai.id` |
| `jasa_dasar_pegawai` | Riwayat nilai jasa dasar per pegawai | `pegawai.id` |

**Tabel yang TIDAK dibuat (sudah ada atau tidak diperlukan):**

| Tabel | Alasan |
|-------|--------|
| `hari_libur` | Libur = `hN = ''` di `jadwal_pegawai` |
| Tabel absensi | Sudah ada di sistem; diakses via resolusi absensi |
| Tabel cuti/izin | `pengajuan_cuti` dan `pengajuan_izin` sudah ada |

## Appendix B — Relasi Tabel Existing yang Digunakan

| Tabel Existing | Join Key | Digunakan untuk |
|----------------|----------|----------------|
| `pegawai` | `id` / `nik` | Identitas pegawai; gate `stts_aktif` |
| `jadwal_pegawai` | `id` (= `pegawai.id`) | Tentukan hari kerja dan shift |
| `pengajuan_cuti` | `nik` (= `pegawai.nik`) | Resolusi status absensi prioritas 1 |
| `pengajuan_izin` | `nik` (= `pegawai.nik`) | Resolusi status absensi prioritas 2 |
| Tabel absensi | TBD | Resolusi status absensi prioritas 3 |

## Appendix C — Glossary

| Term | Definisi |
|------|----------|
| Hari kerja jadwal | Tanggal dimana `hN != ''` di `jadwal_pegawai` pegawai tersebut |
| Resolusi absensi | Proses bertahap: cek cuti → izin → absensi → alpha |
| nilai_kondisi | Kode string yang menentukan skor absensi dari `parameter_penilaian` |
| sumber_absensi | Enum yang mencatat dari mana status absensi diresolvasi |
| Total hari jadwal | COUNT(`hN != ''`) per pegawai per bulan — denominator pengurang jasa |
| Gap hari | `GREATEST(0, total_hari_jadwal - hari_approved)` |
| Pengurang jasa | `(gap_hari / total_hari_jadwal) × nominal_jasa_dasar` |
| Nominal jasa dasar | Nilai jasa acuan HRD — bukan dari `gapok` |
| Nominal jasa final | `nominal_jasa_dasar - pengurang_jasa` |
