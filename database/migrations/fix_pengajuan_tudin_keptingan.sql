-- =============================================
-- Migration: Fix kolom keptingan di pengajuan_tudin
-- =============================================
-- Deskripsi: Memastikan kolom keptingan ada di tabel pengajuan_tudin
-- Tanggal: 2024

-- Cek apakah kolom keptingan sudah ada, jika belum tambahkan
-- Jika kolom kepentingan ada tapi keptingan tidak, rename kepentingan ke keptingan
-- Jika kedua kolom tidak ada, tambahkan keptingan

-- 1. Cek apakah tabel pengajuan_tudin ada
-- Jika tidak ada, buat tabel lengkap
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
  `keptingan` varchar(100) NOT NULL COMMENT 'Kepentingan/alasan tukar dinas',
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

-- 2. Jika kolom kepentingan ada tapi keptingan tidak ada, rename kepentingan ke keptingan
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pengajuan_tudin' 
    AND COLUMN_NAME = 'kepentingan'
);

SET @keptingan_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pengajuan_tudin' 
    AND COLUMN_NAME = 'keptingan'
);

-- Jika kepentingan ada tapi keptingan tidak ada, rename
SET @sql = IF(
    @col_exists > 0 AND @keptingan_exists = 0,
    'ALTER TABLE pengajuan_tudin CHANGE COLUMN kepentingan keptingan VARCHAR(100) NOT NULL COMMENT ''Kepentingan/alasan tukar dinas'';',
    'SELECT ''Kolom kepentingan tidak ada atau keptingan sudah ada'' AS message;'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Jika kedua kolom tidak ada, tambahkan keptingan
SET @keptingan_exists_after = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pengajuan_tudin' 
    AND COLUMN_NAME = 'keptingan'
);

SET @sql2 = IF(
    @keptingan_exists_after = 0,
    'ALTER TABLE pengajuan_tudin ADD COLUMN keptingan VARCHAR(100) NOT NULL COMMENT ''Kepentingan/alasan tukar dinas'' AFTER nik_pj;',
    'SELECT ''Kolom keptingan sudah ada'' AS message;'
);
PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- 4. Jika kolom kepentingan masih ada setelah rename, hapus (untuk menghindari duplikasi)
SET @kepentingan_exists_after = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pengajuan_tudin' 
    AND COLUMN_NAME = 'kepentingan'
);

SET @keptingan_final = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'pengajuan_tudin' 
    AND COLUMN_NAME = 'keptingan'
);

SET @sql3 = IF(
    @kepentingan_exists_after > 0 AND @keptingan_final > 0,
    'ALTER TABLE pengajuan_tudin DROP COLUMN kepentingan;',
    'SELECT ''Tidak perlu menghapus kolom kepentingan'' AS message;'
);
PREPARE stmt3 FROM @sql3;
EXECUTE stmt3;
DEALLOCATE PREPARE stmt3;

-- Verifikasi struktur tabel
DESCRIBE pengajuan_tudin;

