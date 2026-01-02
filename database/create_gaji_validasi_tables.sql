-- =============================================
-- Database Schema: Tabel Validasi Gaji Pegawai
-- =============================================

-- Tabel gaji_validasi
-- Menyimpan tanda tangan gaji pegawai (auditable)
-- Hanya tanda tangan dari penerima gaji, tanpa validasi KEU
CREATE TABLE IF NOT EXISTS gaji_validasi (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gaji_id INT NOT NULL,
    nik VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
    periode_tahun INT NOT NULL,
    periode_bulan INT NOT NULL CHECK (periode_bulan BETWEEN 1 AND 12),
    jenis ENUM('Gaji', 'Jasa') NOT NULL DEFAULT 'Gaji',
    tanda_tangan TEXT NOT NULL COMMENT 'Base64 encoded signature image',
    catatan TEXT NULL COMMENT 'Catatan dari pegawai',
    signed_by VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'NIK pegawai yang menandatangani',
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Waktu tanda tangan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gaji_id) REFERENCES gaji_pegawai(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (nik) REFERENCES pegawai(nik) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (signed_by) REFERENCES pegawai(nik) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    UNIQUE KEY uk_gaji_validasi (gaji_id, signed_by),
    INDEX idx_periode (periode_tahun, periode_bulan),
    INDEX idx_nik (nik),
    INDEX idx_signed_by (signed_by),
    INDEX idx_signed_at (signed_at)
);

-- Tabel gaji_validasi_history
-- Menyimpan history tanda tangan gaji (audit trail)
-- Hanya track CREATE karena tidak ada update status
CREATE TABLE IF NOT EXISTS gaji_validasi_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    validasi_id INT NOT NULL,
    gaji_id INT NOT NULL,
    nik VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
    catatan TEXT NULL,
    changed_by VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL COMMENT 'NIK user yang melakukan perubahan',
    change_type ENUM('CREATE') NOT NULL DEFAULT 'CREATE',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (validasi_id) REFERENCES gaji_validasi(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (gaji_id) REFERENCES gaji_pegawai(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (nik) REFERENCES pegawai(nik) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES pegawai(nik) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_validasi_id (validasi_id),
    INDEX idx_gaji_id (gaji_id),
    INDEX idx_nik (nik),
    INDEX idx_changed_at (changed_at)
);

-- Note: Audit trail di-handle langsung di business logic aplikasi
-- Tidak menggunakan trigger untuk memudahkan debugging dan maintenance

