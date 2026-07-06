# Desain Spec: Modul Penilaian Kinerja Harian (HRIS Monolith)

**Tanggal:** 26 Juni 2026  
**Status:** Approved  
**Aplikasi Induk:** Next.js + MySQL2 Monolith  

---

## 1. Ringkasan Fitur
Modul ini menambahkan fitur penilaian kinerja harian berbasis to-do list kegiatan pegawai (60% bobot) dan status kehadiran (40% bobot). Skor harian yang disetujui oleh supervisor akan direkap secara bulanan untuk menghitung pengurang jasa (incentive deduction) berdasarkan total hari kerja aktual (dari `jadwal_pegawai`).

---

## 2. Desain Database

### 2.1 Tabel Baru
6 tabel baru akan ditambahkan ke database MySQL:

```sql
-- 1. Parameter Penilaian (Config)
CREATE TABLE `parameter_penilaian` (
  `id`              int NOT NULL AUTO_INCREMENT,
  `kode`            varchar(20) NOT NULL,
  `nama_parameter`  varchar(100) NOT NULL,
  `kategori`        enum('kegiatan','absensi') NOT NULL,
  `bobot_persen`    decimal(5,2) NOT NULL DEFAULT 0.00,
  `nilai_kondisi`     varchar(50) DEFAULT NULL,
  `nilai_skor`      decimal(5,2) DEFAULT NULL,
  `deskripsi`       text DEFAULT NULL,
  `is_aktif`        tinyint(1) NOT NULL DEFAULT 1,
  `created_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_kode` (`kode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Supervisor Mapping (Hierarki)
CREATE TABLE `supervisor_mapping` (
  `id`              int NOT NULL AUTO_INCREMENT,
  `tipe_relasi`     enum('unit','personal') NOT NULL DEFAULT 'unit',
  `pegawai_id`      int DEFAULT NULL,
  `supervisor_id`   int NOT NULL,
  `tipe_unit`       enum('departemen','bidang') DEFAULT NULL,
  `kode_unit`       varchar(30) DEFAULT NULL,
  `is_aktif`        tinyint(1) NOT NULL DEFAULT 1,
  `berlaku_mulai`   date NOT NULL,
  `berlaku_sampai`  date DEFAULT NULL,
  `dibuat_oleh`     int DEFAULT NULL,
  `created_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mapping_active` (`tipe_relasi`, `pegawai_id`, `tipe_unit`, `kode_unit`, `supervisor_id`, `berlaku_mulai`),
  KEY `idx_supervisor` (`supervisor_id`),
  KEY `idx_pegawai` (`pegawai_id`),
  KEY `idx_unit` (`tipe_unit`, `kode_unit`),
  CONSTRAINT `fk_sm_supervisor` FOREIGN KEY (`supervisor_id`) REFERENCES `pegawai` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Penilaian Harian
CREATE TABLE `penilaian_harian` (
  `id`                int NOT NULL AUTO_INCREMENT,
  `pegawai_id`        int NOT NULL,
  `tanggal`           date NOT NULL,
  `shift_jadwal`      varchar(20) DEFAULT NULL,
  `sumber_absensi`    enum('cuti','izin','absensi','alpha') NOT NULL DEFAULT 'alpha',
  `ref_cuti_no`       varchar(17) DEFAULT NULL,
  `ref_izin_no`       varchar(17) DEFAULT NULL,
  `nilai_kondisi`     varchar(30) DEFAULT NULL,
  `skor_kegiatan`     decimal(5,2) DEFAULT 0.00,
  `skor_absensi`      decimal(5,2) DEFAULT 0.00,
  `skor_total`        decimal(5,2) DEFAULT 0.00,
  `status`            enum('draft','submitted','approved','revisi') NOT NULL DEFAULT 'draft',
  `catatan_supervisor` text DEFAULT NULL,
  `dibuat_oleh`       int NOT NULL,
  `approved_by`       int DEFAULT NULL,
  `approved_at`       timestamp NULL DEFAULT NULL,
  `created_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_pegawai_tanggal` (`pegawai_id`, `tanggal`),
  KEY `idx_tanggal` (`tanggal`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_ph_pegawai` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_ph_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `pegawai` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Kegiatan Harian (Todo-list)
CREATE TABLE `kegiatan_harian` (
  `id`              int NOT NULL AUTO_INCREMENT,
  `penilaian_id`    int NOT NULL,
  `judul_kegiatan`  varchar(200) NOT NULL,
  `penjabaran`      text DEFAULT NULL,
  `status_selesai`  enum('belum','selesai') NOT NULL DEFAULT 'belum',
  `urutan`          tinyint unsigned NOT NULL DEFAULT 1,
  `selesai_at`      timestamp NULL DEFAULT NULL,
  `created_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`      timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_penilaian_id` (`penilaian_id`),
  CONSTRAINT `fk_kh_penilaian` FOREIGN KEY (`penilaian_id`) REFERENCES `penilaian_harian` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Jasa Dasar Pegawai (Incentive base)
CREATE TABLE `jasa_dasar_pegawai` (
  `id`                  int NOT NULL AUTO_INCREMENT,
  `pegawai_id`          int NOT NULL,
  `berlaku_mulai`       date NOT NULL,
  `berlaku_sampai`      date DEFAULT NULL,
  `nominal_jasa_dasar`  decimal(15,2) NOT NULL,
  `keterangan`          varchar(100) DEFAULT NULL,
  `dibuat_oleh`         int DEFAULT NULL,
  `created_at`          timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pegawai_berlaku` (`pegawai_id`, `berlaku_mulai`),
  CONSTRAINT `fk_jdp_pegawai` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Rekap Bulanan
CREATE TABLE `rekap_bulanan` (
  `id`                    int NOT NULL AUTO_INCREMENT,
  `pegawai_id`            int NOT NULL,
  `bulan`                 tinyint unsigned NOT NULL,
  `tahun`                 smallint unsigned NOT NULL,
  `total_hari_jadwal`     tinyint unsigned NOT NULL DEFAULT 0,
  `hari_approved`         tinyint unsigned NOT NULL DEFAULT 0,
  `gap_hari`              tinyint unsigned NOT NULL DEFAULT 0,
  `rata_skor_total`       decimal(5,2) DEFAULT 0.00,
  `nominal_jasa_dasar`    decimal(15,2) NOT NULL DEFAULT 0.00,
  `pengurang_jasa`        decimal(15,2) DEFAULT 0.00,
  `nominal_jasa_final`    decimal(15,2) DEFAULT 0.00,
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
  CONSTRAINT `fk_rb_pegawai` FOREIGN KEY (`pegawai_id`) REFERENCES `pegawai` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2.2 Whitelist `src/lib/db-helper.js`
Tambahkan nama tabel baru ke konstanta `ALLOWED_TABLES` di helper agar aman dari query injection filter.

---

## 3. Arsitektur API Routes (Next.js App Router)
Lokasi API: `/src/app/api/penilaian/`

*   `GET /api/penilaian/jadwal?bulan=&tahun=&pegawai_id=`
    *   Mengambil kolom `h1`–`h31` dari `jadwal_pegawai` untuk menentukan hari kerja aktual.
*   `GET /api/penilaian/absensi-status?tanggal=&pegawai_id=`
    *   Meresolusi status absensi harian pegawai berdasarkan logika sekuensial:
        1.  `pengajuan_cuti` (Disetujui, tanggal cuti beririsan) $\rightarrow$ ambil parameter cuti.
        2.  `pengajuan_izin` (Disetujui, tanggal izin beririsan) $\rightarrow$ ambil parameter izin.
        3.  `temporary_presensi` / `rekap_presensi` (tanggal beririsan) $\rightarrow$ ambil `status` string (misal: 'Hadir' $\rightarrow$ 'tepat_waktu').
        4.  Tidak ada data $\rightarrow$ status `'alpha'`.
*   `GET /api/penilaian/harian?tanggal=&pegawai_id=`
    *   Mengembalikan entri harian beserta to-do list-nya.
*   `POST /api/penilaian/harian`
    *   Membuat entri draft penilaian harian baru.
*   `PUT /api/penilaian/harian/[id]`
    *   CRUD item `kegiatan_harian` (maksimal 20 item).
*   `POST /api/penilaian/harian/[id]/submit`
    *   Mengunci entri pegawai dan menghitung skor otomatis:
        *   Skor kegiatan = `(selesai / total) * 100`
        *   Skor absensi = diambil dari `parameter_penilaian` untuk `nilai_kondisi` yang teresolusi.
        *   Skor total = `(skor_kegiatan * 60%) + (skor_absensi * 40%)`
*   `GET /api/penilaian/supervisor/pending`
    *   Queue approval untuk supervisor. Memfilter agar supervisor **tidak** bisa meng-approve penilaian dirinya sendiri.
*   `POST /api/penilaian/harian/[id]/approve`
    *   Supervisor meng-approve penilaian (status `approved`).
*   `POST /api/penilaian/harian/[id]/revisi`
    *   Supervisor menolak penilaian dan mengembalikan status ke `revisi` beserta catatan.

---

## 4. Desain Antarmuka Pengguna & Routing
Mengikuti **Approach A: Separate Route-Based Structure** dengan Azure Blue style.

*   `/dashboard/penilaian-kinerja/input` — Form harian pegawai.
*   `/dashboard/penilaian-kinerja/riwayat` — Riwayat performa harian per bulan milik pegawai.
*   `/dashboard/penilaian-kinerja/approval` — Queue approval untuk atasan.
*   `/dashboard/penilaian-kinerja/rekap` — Laporan rekapitulasi bulanan dan pengurang jasa (Hanya IT).
*   `/dashboard/penilaian-kinerja/jasa-dasar` — Pengaturan jasa acuan per pegawai (Hanya IT).
*   `/dashboard/penilaian-kinerja/mapping` — CRUD atasan langsung & unit mapping (Hanya IT).
*   `/dashboard/penilaian-kinerja/parameter` — CRUD bobot & nilai absensi (Hanya IT).

### Otorisasi Sidebar (`src/app/dashboard/layout.js`)
*   Pegawai AKTIF melihat: `input`, `riwayat`.
*   Supervisor melihat: `approval` (di-query via API check `/api/penilaian/is-supervisor` di layout render).
*   Departemen IT (Admin Sementara) melihat: `rekap`, `jasa-dasar`, `mapping`, `parameter`.

---

## 5. Mitigasi Edge Case & Keamanan
1.  **No Self-Assessment:** Supervisor dikecualikan dari tim penilaiannya sendiri (`p.id != sm.supervisor_id` di query approval).
2.  **Hierarchical Priority:** Relasi personal di `supervisor_mapping` memiliki prioritas lebih tinggi daripada relasi unit (departemen/bidang).
3.  **Tanggal Masa Depan:** API dan UI akan memblokir pembuatan / submit penilaian untuk tanggal mendatang.
4.  **Edit Protection:** Transaksi di-update hanya jika status entri saat ini adalah `'draft'` atau `'revisi'`.
5.  **Dukungan SQL Injection Guard:** Memasukkan whitelist 6 tabel baru ke `ALLOWED_TABLES` di `db-helper.js`.
