-- =============================================
-- Migration: Fix kolom keptingan di pengajuan_tudin
-- Versi Manual - Jalankan satu per satu
-- =============================================

-- STEP 1: Pastikan tabel pengajuan_tudin ada
CREATE TABLE IF NOT EXISTS `pengajuan_tudin` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `no_pengajuan` varchar(20) NOT NULL COMMENT 'Format: TD-YYYY-MM-NNNN',
  `tanggal` date NOT NULL COMMENT 'Tanggal pengajuan',
  `nik` varchar(20) NOT NULL COMMENT 'NIK pemohon',
  `tgl_dinas` date NOT NULL COMMENT 'Tanggal dinas yang akan ditukar',
  `shift1` enum('Pagi','Siang','Malam') NOT NULL COMMENT 'Shift pemohon',
  `nik_ganti` varchar(20) NOT NULL COMMENT 'NIK pegawai pengganti',
  `tgl_ganti` date NOT NULL COMMENT 'Tanggal dinas pengganti',
  `shift2` enum('Pagi','Siang','Malam') NOT NULL COMMENT 'Shift pengganti',
  `nik_pj` varchar(20) DEFAULT NULL COMMENT 'NIK penanggung jawab (opsional)',
  `keptingan` varchar(100) NOT NULL DEFAULT '' COMMENT 'Kepentingan/alasan tukar dinas',
  `status` enum('Proses Pengajuan','Disetujui','Ditolak') NOT NULL DEFAULT 'Proses Pengajuan',
  `alasan_ditolak` text DEFAULT NULL COMMENT 'Alasan penolakan jika ditolak',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `no_pengajuan` (`no_pengajuan`),
  KEY `idx_nik` (`nik`),
  KEY `idx_nik_ganti` (`nik_ganti`),
  KEY `idx_nik_pj` (`nik_pj`),
  KEY `idx_tanggal` (`tanggal`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- STEP 2: Cek apakah kolom keptingan sudah ada
-- Jalankan query ini untuk melihat struktur tabel:
-- DESCRIBE pengajuan_tudin;

-- STEP 3A: Jika kolom keptingan BELUM ada, jalankan ini:
ALTER TABLE `pengajuan_tudin` 
ADD COLUMN `keptingan` varchar(100) NOT NULL DEFAULT '' COMMENT 'Kepentingan/alasan tukar dinas' AFTER `nik_pj`;

-- STEP 3B: Jika kolom kepentingan (dengan 'e') ada tapi keptingan tidak ada:
-- 1. Copy data dari kepentingan ke keptingan (jika ada data)
-- UPDATE pengajuan_tudin SET keptingan = kepentingan WHERE kepentingan IS NOT NULL AND kepentingan != '';
-- 2. Tambahkan kolom keptingan jika belum ada
-- ALTER TABLE `pengajuan_tudin` ADD COLUMN `keptingan` varchar(100) NOT NULL DEFAULT '' COMMENT 'Kepentingan/alasan tukar dinas' AFTER `nik_pj`;
-- 3. Hapus kolom kepentingan setelah data sudah di-copy
-- ALTER TABLE `pengajuan_tudin` DROP COLUMN `kepentingan`;

-- STEP 4: Verifikasi struktur tabel
DESCRIBE pengajuan_tudin;

-- STEP 5: Cek apakah ada data yang perlu di-update
-- SELECT id, kepentingan, keptingan FROM pengajuan_tudin WHERE kepentingan IS NOT NULL AND (keptingan IS NULL OR keptingan = '');

