-- Tabel Master Kategori Jenis Pegawai untuk Penggajian
CREATE TABLE IF NOT EXISTS gaji_kategori_jenis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nama VARCHAR(100) NOT NULL UNIQUE,
    urutan INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Mapping NIK Pegawai ke Kategori Jenis
CREATE TABLE IF NOT EXISTS gaji_pegawai_mapping (
    nik VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci PRIMARY KEY,
    kategori_id INT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_kategori_id (kategori_id),
    FOREIGN KEY (kategori_id) REFERENCES gaji_kategori_jenis(id) ON DELETE CASCADE
);

-- Seed data awal jika belum ada
INSERT IGNORE INTO gaji_kategori_jenis (id, nama, urutan) VALUES 
(1, 'Nakes', 1),
(2, 'Apoteker', 2),
(3, 'Administrasi', 3),
(4, 'Radiologi', 4);
