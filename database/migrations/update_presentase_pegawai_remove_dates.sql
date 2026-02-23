-- Migration: Remove date columns from presentase_pegawai
-- Description: Menghapus kolom berlaku_mulai dan berlaku_selesai serta update constraint

-- 1. Hapus Index yang menggunakan kolom tanggal
ALTER TABLE presentase_pegawai DROP INDEX idx_presentase_pegawai_berlaku;

-- 2. Hapus Unique Constraint lama (yang menggunakan berlaku_selesai)
ALTER TABLE presentase_pegawai DROP INDEX unique_active_allocation;

-- 3. Hapus kolom tanggal
ALTER TABLE presentase_pegawai DROP COLUMN berlaku_mulai;
ALTER TABLE presentase_pegawai DROP COLUMN berlaku_selesai;

-- 4. Tambahkan Unique Constraint baru (hanya id_unit dan id_pegawai)
ALTER TABLE presentase_pegawai ADD CONSTRAINT unique_active_allocation UNIQUE (id_unit, id_pegawai);

-- 5. Update View (Re-create view with new schema)
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

-- 6. Update Stored Procedure
DROP PROCEDURE IF EXISTS `sp_kalkulasi_distribusi_gaji`;

DELIMITER $$
CREATE PROCEDURE `sp_kalkulasi_distribusi_gaji`(
    IN p_total_jasa DECIMAL(15,2)
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
    ORDER BY pk.nama_kategori, d.nama, p.nama;
END$$
DELIMITER ;
