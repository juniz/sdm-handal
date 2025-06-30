-- Database Migration: Pengajuan Tukar Dinas
-- File: database_migration_pengajuan_tukar_dinas.sql
-- Created: 2024

-- Membuat tabel pengajuan_tudin (tukar dinas)
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
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_pengajuan_tudin_nik` FOREIGN KEY (`nik`) REFERENCES `pegawai` (`nik`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pengajuan_tudin_nik_ganti` FOREIGN KEY (`nik_ganti`) REFERENCES `pegawai` (`nik`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_pengajuan_tudin_nik_pj` FOREIGN KEY (`nik_pj`) REFERENCES `pegawai` (`nik`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Membuat view untuk laporan pengajuan tukar dinas
CREATE VIEW `view_pengajuan_tukar_dinas` AS
SELECT 
    pt.id,
    pt.no_pengajuan,
    pt.tanggal,
    pt.nik,
    p1.nama as nama_pemohon,
    p1.departemen as departemen_pemohon,
    d1.nama as nama_departemen_pemohon,
    pt.tgl_dinas,
    pt.shift1,
    pt.nik_ganti,
    p2.nama as nama_pengganti,
    p2.departemen as departemen_pengganti,
    d2.nama as nama_departemen_pengganti,
    pt.tgl_ganti,
    pt.shift2,
    pt.nik_pj,
    p3.nama as nama_pj,
    pt.keptingan,
    pt.status,
    pt.alasan_ditolak,
    pt.created_at,
    pt.updated_at
FROM pengajuan_tudin pt
LEFT JOIN pegawai p1 ON pt.nik = p1.nik
LEFT JOIN departemen d1 ON p1.departemen = d1.dep_id
LEFT JOIN pegawai p2 ON pt.nik_ganti = p2.nik
LEFT JOIN departemen d2 ON p2.departemen = d2.dep_id
LEFT JOIN pegawai p3 ON pt.nik_pj = p3.nik
ORDER BY pt.created_at DESC;

-- Membuat view untuk statistik pengajuan tukar dinas
CREATE VIEW `view_stats_pengajuan_tukar_dinas` AS
SELECT 
    COUNT(*) as total_pengajuan,
    COUNT(CASE WHEN status = 'Proses Pengajuan' THEN 1 END) as proses_pengajuan,
    COUNT(CASE WHEN status = 'Disetujui' THEN 1 END) as disetujui,
    COUNT(CASE WHEN status = 'Ditolak' THEN 1 END) as ditolak,
    COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as pengajuan_hari_ini,
    COUNT(CASE WHEN YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1) THEN 1 END) as pengajuan_minggu_ini,
    COUNT(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN 1 END) as pengajuan_bulan_ini
FROM pengajuan_tudin;

-- Membuat view untuk pengajuan tukar dinas per departemen
CREATE VIEW `view_pengajuan_tukar_dinas_per_departemen` AS
SELECT 
    d.dep_id,
    d.nama as nama_departemen,
    COUNT(*) as total_pengajuan,
    COUNT(CASE WHEN pt.status = 'Proses Pengajuan' THEN 1 END) as proses_pengajuan,
    COUNT(CASE WHEN pt.status = 'Disetujui' THEN 1 END) as disetujui,
    COUNT(CASE WHEN pt.status = 'Ditolak' THEN 1 END) as ditolak
FROM pengajuan_tudin pt
LEFT JOIN pegawai p ON pt.nik = p.nik
LEFT JOIN departemen d ON p.departemen = d.dep_id
GROUP BY d.dep_id, d.nama
ORDER BY total_pengajuan DESC;

-- Insert data sample (opsional, untuk testing)
-- INSERT INTO pengajuan_tudin (no_pengajuan, tanggal, nik, tgl_dinas, shift1, nik_ganti, tgl_ganti, shift2, nik_pj, keptingan, status) VALUES
-- ('TD-2024-01-0001', '2024-01-15', '12345', '2024-01-20', 'Pagi', '67890', '2024-01-22', 'Siang', '11111', 'Keperluan keluarga', 'Proses Pengajuan'),
-- ('TD-2024-01-0002', '2024-01-16', '67890', '2024-01-25', 'Malam', '12345', '2024-01-27', 'Pagi', NULL, 'Keperluan pribadi', 'Disetujui');

-- Membuat trigger untuk auto-update timestamp
DELIMITER $$
CREATE TRIGGER `tr_pengajuan_tudin_updated_at` 
BEFORE UPDATE ON `pengajuan_tudin` 
FOR EACH ROW 
BEGIN
    SET NEW.updated_at = CURRENT_TIMESTAMP;
END$$
DELIMITER ;

-- Membuat stored procedure untuk laporan bulanan
DELIMITER $$
CREATE PROCEDURE `sp_laporan_pengajuan_tukar_dinas_bulanan`(
    IN p_bulan INT,
    IN p_tahun INT
)
BEGIN
    SELECT 
        pt.no_pengajuan,
        pt.tanggal,
        p1.nama as nama_pemohon,
        d1.nama as departemen_pemohon,
        pt.tgl_dinas,
        pt.shift1,
        p2.nama as nama_pengganti,
        pt.tgl_ganti,
        pt.shift2,
        pt.keptingan,
        pt.status,
        pt.alasan_ditolak,
        pt.created_at
    FROM pengajuan_tudin pt
    LEFT JOIN pegawai p1 ON pt.nik = p1.nik
    LEFT JOIN departemen d1 ON p1.departemen = d1.dep_id
    LEFT JOIN pegawai p2 ON pt.nik_ganti = p2.nik
    WHERE MONTH(pt.created_at) = p_bulan 
    AND YEAR(pt.created_at) = p_tahun
    ORDER BY pt.created_at DESC;
END$$
DELIMITER ;

-- Membuat stored procedure untuk statistik per departemen
DELIMITER $$
CREATE PROCEDURE `sp_stats_pengajuan_tukar_dinas_departemen`(
    IN p_departemen VARCHAR(10)
)
BEGIN
    SELECT 
        COUNT(*) as total_pengajuan,
        COUNT(CASE WHEN status = 'Proses Pengajuan' THEN 1 END) as proses_pengajuan,
        COUNT(CASE WHEN status = 'Disetujui' THEN 1 END) as disetujui,
        COUNT(CASE WHEN status = 'Ditolak' THEN 1 END) as ditolak,
        AVG(CASE WHEN status = 'Disetujui' THEN 1 WHEN status = 'Ditolak' THEN 0 END) * 100 as persentase_approval
    FROM pengajuan_tudin pt
    LEFT JOIN pegawai p ON pt.nik = p.nik
    WHERE p.departemen = p_departemen;
END$$
DELIMITER ;

-- Membuat index untuk optimasi query
CREATE INDEX `idx_pengajuan_tudin_tanggal_status` ON `pengajuan_tudin` (`tanggal`, `status`);
CREATE INDEX `idx_pengajuan_tudin_created_at` ON `pengajuan_tudin` (`created_at`);
CREATE INDEX `idx_pengajuan_tudin_tgl_dinas` ON `pengajuan_tudin` (`tgl_dinas`);
CREATE INDEX `idx_pengajuan_tudin_tgl_ganti` ON `pengajuan_tudin` (`tgl_ganti`);

-- Membuat function untuk generate nomor pengajuan (jika diperlukan di database level)
DELIMITER $$
CREATE FUNCTION `fn_generate_no_pengajuan_tukar_dinas`() 
RETURNS VARCHAR(20) 
READS SQL DATA 
DETERMINISTIC
BEGIN
    DECLARE next_number INT DEFAULT 1;
    DECLARE tahun VARCHAR(4);
    DECLARE bulan VARCHAR(2);
    DECLARE no_pengajuan VARCHAR(20);
    
    SET tahun = YEAR(CURDATE());
    SET bulan = LPAD(MONTH(CURDATE()), 2, '0');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(no_pengajuan, 12, 4) AS UNSIGNED)), 0) + 1
    INTO next_number
    FROM pengajuan_tudin 
    WHERE no_pengajuan LIKE CONCAT('TD-', tahun, '-', bulan, '-%');
    
    SET no_pengajuan = CONCAT('TD-', tahun, '-', bulan, '-', LPAD(next_number, 4, '0'));
    
    RETURN no_pengajuan;
END$$
DELIMITER ;

-- Menambahkan komentar pada tabel
ALTER TABLE `pengajuan_tudin` COMMENT = 'Tabel untuk menyimpan data pengajuan tukar dinas/shift pegawai';

-- Menampilkan struktur tabel yang telah dibuat
DESCRIBE pengajuan_tudin;

-- Menampilkan view yang telah dibuat
SHOW CREATE VIEW view_pengajuan_tukar_dinas;

-- Query untuk testing
-- SELECT * FROM view_pengajuan_tukar_dinas LIMIT 10;
-- SELECT * FROM view_stats_pengajuan_tukar_dinas;
-- SELECT * FROM view_pengajuan_tukar_dinas_per_departemen;

-- Contoh penggunaan stored procedure
-- CALL sp_laporan_pengajuan_tukar_dinas_bulanan(1, 2024);
-- CALL sp_stats_pengajuan_tukar_dinas_departemen('IT');

-- Contoh penggunaan function
-- SELECT fn_generate_no_pengajuan_tukar_dinas() as nomor_pengajuan_baru; 