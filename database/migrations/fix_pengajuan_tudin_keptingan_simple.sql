-- =============================================
-- Migration: Fix kolom keptingan di pengajuan_tudin
-- Versi Sederhana - Langsung tambah kolom jika belum ada
-- =============================================

-- Pastikan tabel pengajuan_tudin ada dengan struktur lengkap
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

-- Tambahkan kolom keptingan jika belum ada (untuk tabel yang sudah ada)
-- Script ini akan error jika kolom sudah ada, tapi itu tidak masalah
-- Kita bisa ignore error tersebut

-- Cek dan tambahkan kolom keptingan jika belum ada
ALTER TABLE `pengajuan_tudin` 
ADD COLUMN IF NOT EXISTS `keptingan` varchar(100) NOT NULL DEFAULT '' COMMENT 'Kepentingan/alasan tukar dinas' AFTER `nik_pj`;

-- Jika kolom kepentingan (dengan e) ada, rename ke keptingan
-- Note: MariaDB/MySQL tidak support IF EXISTS untuk ALTER TABLE CHANGE COLUMN
-- Jadi kita perlu cek manual atau gunakan stored procedure

-- Alternatif: Jika ada kolom kepentingan, copy data ke keptingan lalu hapus kepentingan
-- (Hanya jalankan jika kolom kepentingan ada dan keptingan belum ada)

-- UPDATE pengajuan_tudin SET keptingan = kepentingan WHERE kepentingan IS NOT NULL AND (keptingan IS NULL OR keptingan = '');
-- ALTER TABLE pengajuan_tudin DROP COLUMN kepentingan;

-- Verifikasi struktur tabel
DESCRIBE pengajuan_tudin;

