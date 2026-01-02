-- =============================================
-- Database Schema: Modul Penggajian Pegawai
-- =============================================

-- Tabel gaji_pegawai
-- Menyimpan data gaji pegawai per periode bulanan
CREATE TABLE IF NOT EXISTS gaji_pegawai (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nik VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
    periode_tahun INT NOT NULL,
    periode_bulan INT NOT NULL CHECK (periode_bulan BETWEEN 1 AND 12),
    jenis ENUM('Gaji', 'Jasa') NOT NULL DEFAULT 'Gaji',
    gaji DECIMAL(15,2) NOT NULL DEFAULT 0,
    uploaded_by VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (nik) REFERENCES pegawai(nik) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES pegawai(nik) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    UNIQUE KEY uk_gaji_periode (nik, periode_tahun, periode_bulan, jenis),
    INDEX idx_periode (periode_tahun, periode_bulan),
    INDEX idx_nik (nik),
    INDEX idx_uploaded_by (uploaded_by)
);

-- Tabel gaji_upload_log
-- Mencatat history upload file Excel untuk audit trail
CREATE TABLE IF NOT EXISTS gaji_upload_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    periode_tahun INT NOT NULL,
    periode_bulan INT NOT NULL,
    total_records INT NOT NULL DEFAULT 0,
    success_count INT NOT NULL DEFAULT 0,
    error_count INT NOT NULL DEFAULT 0,
    uploaded_by VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_details TEXT,
    
    FOREIGN KEY (uploaded_by) REFERENCES pegawai(nik) ON DELETE RESTRICT ON UPDATE CASCADE,
    INDEX idx_periode (periode_tahun, periode_bulan),
    INDEX idx_uploaded_by (uploaded_by)
);

