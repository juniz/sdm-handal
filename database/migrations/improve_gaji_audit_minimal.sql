-- =============================================
-- Migration: Improve Audit Trail Minimal untuk Tabel Gaji
-- Hanya menambahkan field updated_by (lebih sederhana)
-- =============================================

-- Tambahkan field updated_by ke tabel gaji_pegawai
ALTER TABLE gaji_pegawai 
ADD COLUMN updated_by VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NULL AFTER uploaded_by;

-- Tambahkan foreign key untuk updated_by
ALTER TABLE gaji_pegawai
ADD CONSTRAINT fk_gaji_updated_by FOREIGN KEY (updated_by) REFERENCES pegawai(nik) ON DELETE RESTRICT ON UPDATE CASCADE;

-- Buat tabel history sederhana untuk track perubahan gaji
CREATE TABLE IF NOT EXISTS gaji_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gaji_id INT NOT NULL,
    nik VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
    periode_tahun INT NOT NULL,
    periode_bulan INT NOT NULL,
    jenis ENUM('Gaji', 'Jasa') NOT NULL,
    gaji_lama DECIMAL(15,2) NULL,
    gaji_baru DECIMAL(15,2) NOT NULL,
    changed_by VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
    change_type ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gaji_id) REFERENCES gaji_pegawai(id) ON DELETE CASCADE,
    FOREIGN KEY (nik) REFERENCES pegawai(nik) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES pegawai(nik) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_gaji_id (gaji_id),
    INDEX idx_nik (nik),
    INDEX idx_changed_by (changed_by),
    INDEX idx_changed_at (changed_at)
);


