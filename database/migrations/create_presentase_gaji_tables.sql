-- =============================================
-- Migration: Tabel Persentase Gaji Pegawai
-- =============================================
-- Deskripsi: Struktur berjenjang untuk distribusi gaji/jasa
-- Alur: Total Jasa -> Kategori -> Unit/Departemen -> Pegawai

-- Tabel presentase_kategori
-- Menyimpan kategori utama pembagian jasa (Pelayanan, Staff, dll)
CREATE TABLE IF NOT EXISTS `presentase_kategori` (
  `id_kategori` int(11) NOT NULL AUTO_INCREMENT,
  `nama_kategori` varchar(50) NOT NULL COMMENT 'Contoh: Pelayanan, Staff',
  `presentase_dari_total` decimal(5,2) NOT NULL CHECK (`presentase_dari_total` between 0.00 and 100.00),
  `keterangan` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_kategori`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Tabel presentase_unit
-- Menyimpan persentase per unit/departemen dari kategori
CREATE TABLE IF NOT EXISTS `presentase_unit` (
  `id_unit` int(11) NOT NULL AUTO_INCREMENT,
  `id_kategori` int(11) NOT NULL,
  `dep_id` char(4) NOT NULL COMMENT 'Mengacu ke departemen.dep_id',
  `presentase_dari_kategori` decimal(5,2) NOT NULL CHECK (`presentase_dari_kategori` between 0.00 and 100.00),
  `keterangan` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_unit`),
  KEY `id_kategori` (`id_kategori`),
  KEY `dep_id` (`dep_id`),
  CONSTRAINT `presentase_unit_ibfk_1` FOREIGN KEY (`id_kategori`) REFERENCES `presentase_kategori` (`id_kategori`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `presentase_unit_ibfk_2` FOREIGN KEY (`dep_id`) REFERENCES `departemen` (`dep_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Tabel presentase_pegawai
-- Menyimpan alokasi persentase per pegawai dari unit
CREATE TABLE IF NOT EXISTS `presentase_pegawai` (
  `id_alokasi` int(11) NOT NULL AUTO_INCREMENT,
  `id_unit` int(11) NOT NULL,
  `id_pegawai` int(11) NOT NULL,
  `presentase_dari_unit` decimal(5,2) NOT NULL CHECK (`presentase_dari_unit` between 0.00 and 100.00),
  `berlaku_mulai` date NOT NULL,
  `berlaku_selesai` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id_alokasi`),
  UNIQUE KEY `unique_active_allocation` (`id_unit`,`id_pegawai`,`berlaku_selesai`) COMMENT 'Pastikan hanya 1 alokasi aktif per pegawai di unit',
  KEY `id_unit` (`id_unit`),
  KEY `id_pegawai` (`id_pegawai`),
  CONSTRAINT `presentase_pegawai_ibfk_1` FOREIGN KEY (`id_unit`) REFERENCES `presentase_unit` (`id_unit`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `presentase_pegawai_ibfk_2` FOREIGN KEY (`id_pegawai`) REFERENCES `pegawai` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Index tambahan untuk performa query
CREATE INDEX idx_presentase_pegawai_berlaku ON presentase_pegawai(berlaku_mulai, berlaku_selesai);

-- View untuk melihat struktur lengkap persentase
CREATE OR REPLACE VIEW `view_struktur_presentase` AS
SELECT 
    pk.id_kategori,
    pk.nama_kategori,
    pk.presentase_dari_total,
    pu.id_unit,
    d.nama as nama_departemen,
    pu.presentase_dari_kategori,
    pp.id_alokasi,
    p.id as id_pegawai,
    p.nik,
    p.nama as nama_pegawai,
    pp.presentase_dari_unit,
    pp.berlaku_mulai,
    pp.berlaku_selesai,
    -- Kalkulasi persentase akhir dari total
    ROUND(
        (pk.presentase_dari_total / 100) * 
        (pu.presentase_dari_kategori / 100) * 
        (pp.presentase_dari_unit / 100) * 100, 
        4
    ) as presentase_dari_total_final
FROM presentase_kategori pk
LEFT JOIN presentase_unit pu ON pk.id_kategori = pu.id_kategori
LEFT JOIN departemen d ON pu.dep_id = d.dep_id
LEFT JOIN presentase_pegawai pp ON pu.id_unit = pp.id_unit
LEFT JOIN pegawai p ON pp.id_pegawai = p.id
ORDER BY pk.nama_kategori, d.nama, p.nama;

-- Stored procedure untuk kalkulasi distribusi gaji
DELIMITER $$
CREATE PROCEDURE IF NOT EXISTS `sp_kalkulasi_distribusi_gaji`(
    IN p_total_jasa DECIMAL(15,2),
    IN p_tanggal DATE
)
BEGIN
    SELECT 
        pk.nama_kategori,
        d.nama as nama_departemen,
        p.nik,
        p.nama as nama_pegawai,
        pk.presentase_dari_total,
        pu.presentase_dari_kategori,
        pp.presentase_dari_unit,
        -- Kalkulasi nominal
        ROUND(p_total_jasa * (pk.presentase_dari_total / 100), 2) as nominal_kategori,
        ROUND(
            p_total_jasa * 
            (pk.presentase_dari_total / 100) * 
            (pu.presentase_dari_kategori / 100), 
            2
        ) as nominal_unit,
        ROUND(
            p_total_jasa * 
            (pk.presentase_dari_total / 100) * 
            (pu.presentase_dari_kategori / 100) * 
            (pp.presentase_dari_unit / 100), 
            2
        ) as nominal_pegawai
    FROM presentase_kategori pk
    JOIN presentase_unit pu ON pk.id_kategori = pu.id_kategori
    JOIN presentase_pegawai pp ON pu.id_unit = pp.id_unit
    JOIN pegawai p ON pp.id_pegawai = p.id
    JOIN departemen d ON pu.dep_id = d.dep_id
    WHERE pp.berlaku_mulai <= p_tanggal
      AND (pp.berlaku_selesai IS NULL OR pp.berlaku_selesai >= p_tanggal)
    ORDER BY pk.nama_kategori, d.nama, p.nama;
END$$
DELIMITER ;

