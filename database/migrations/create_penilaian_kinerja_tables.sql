-- 1. Parameter Penilaian (Config)
CREATE TABLE IF NOT EXISTS `parameter_penilaian` (
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

-- Seed Default Data untuk Parameter Penilaian
INSERT INTO `parameter_penilaian`
  (`kode`, `nama_parameter`, `kategori`, `bobot_persen`, `nilai_kondisi`, `nilai_skor`, `deskripsi`)
VALUES
  ('KGT_PRODUKTIF',      'Produktivitas kegiatan',       'kegiatan', 60.00, NULL,                  NULL,   'Bobot skor kegiatan. Nilai = (item selesai / total item) × 100'),
  ('ABN_TEPAT',          'Hadir tepat waktu',             'absensi',  40.00, 'tepat_waktu',         100.00, 'Masuk sebelum atau tepat jam kerja shift'),
  ('ABN_TLB15',          'Terlambat < 15 menit',          'absensi',  40.00, 'terlambat_ringan',     75.00, 'Terlambat 1–14 menit dari jam shift'),
  ('ABN_TLB30',          'Terlambat 15–30 menit',         'absensi',  40.00, 'terlambat_sedang',     50.00, 'Terlambat 15–30 menit dari jam shift'),
  ('ABN_TLB60',          'Terlambat > 30 menit',          'absensi',  40.00, 'terlambat_berat',      25.00, 'Terlambat lebih dari 30 menit dari jam shift'),
  ('ABN_ALPHA',          'Alpha / tanpa keterangan',      'absensi',  40.00, 'alpha',                 0.00, 'Tidak hadir tanpa keterangan apapun'),
  ('CUT_SAKIT',          'Sakit (surat dokter)',           'absensi',  40.00, 'sakit',                70.00, 'Cuti sakit dengan surat keterangan dokter'),
  ('CUT_TAHUNAN',        'Cuti tahunan',                  'absensi',  40.00, 'cuti_tahunan',          80.00, 'Cuti tahunan yang disetujui'),
  ('CUT_MELAHIRKAN',     'Cuti melahirkan',               'absensi',  40.00, 'cuti_melahirkan',      100.00, 'Hak cuti melahirkan — tidak mengurangi penilaian'),
  ('CUT_IBADAH',         'Cuti ibadah keagamaan',         'absensi',  40.00, 'cuti_ibadah',           90.00, 'Cuti untuk ibadah keagamaan yang disetujui'),
  ('CUT_ISTIMEWA',       'Cuti istimewa',                 'absensi',  40.00, 'cuti_istimewa',          85.00, 'Cuti istimewa yang disetujui atasan'),
  ('CUT_PENTING',        'Cuti alasan penting',           'absensi',  40.00, 'cuti_penting',           75.00, 'Cuti karena alasan penting yang disetujui'),
  ('CUT_LUAR_TNG',       'Cuti luar tanggungan negara',   'absensi',  40.00, 'cuti_luar_tanggungan',  60.00, 'Cuti di luar tanggungan negara'),
  ('CUT_LN',             'Cuti tahunan luar negeri',      'absensi',  40.00, 'cuti_luar_negeri',       80.00, 'Cuti tahunan ke luar negeri'),
  ('CUT_LAINNYA',        'Cuti keterangan lainnya',       'absensi',  40.00, 'cuti_lainnya',           60.00, 'Cuti dengan keterangan lain yang disetujui'),
  ('IZN_DINAS',          'Perjalanan dinas',              'absensi',  40.00, 'izin_dinas',            100.00, 'Perjalanan dinas resmi yang disetujui — tidak mengurangi penilaian'),
  ('IZN_DINAS_DLM',      'Dinas dalam kota',              'absensi',  40.00, 'izin_dinas_dalam',      100.00, 'Dinas dalam kota resmi yang disetujui'),
  ('IZN_DINAS_LR',       'Dinas luar kota',               'absensi',  40.00, 'izin_dinas_luar',       100.00, 'Dinas luar kota resmi yang disetujui'),
  ('IZN_LAINNYA',        'Izin lain-lain',                'absensi',  40.00, 'izin_lainnya',           65.00, 'Izin lain-lain yang disetujui atasan')
ON DUPLICATE KEY UPDATE
  `nama_parameter` = VALUES(`nama_parameter`),
  `kategori` = VALUES(`kategori`),
  `bobot_persen` = VALUES(`bobot_persen`),
  `nilai_kondisi` = VALUES(`nilai_kondisi`),
  `nilai_skor` = VALUES(`nilai_skor`),
  `deskripsi` = VALUES(`deskripsi`);

-- 2. Supervisor Mapping (Hierarki)
CREATE TABLE IF NOT EXISTS `supervisor_mapping` (
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
CREATE TABLE IF NOT EXISTS `penilaian_harian` (
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
  `is_tambahan`       tinyint(1) NOT NULL DEFAULT 0,
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
CREATE TABLE IF NOT EXISTS `kegiatan_harian` (
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
CREATE TABLE IF NOT EXISTS `jasa_dasar_pegawai` (
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
CREATE TABLE IF NOT EXISTS `rekap_bulanan` (
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
