CREATE TABLE IF NOT EXISTS it_assets (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    serial_id VARCHAR(100) UNIQUE,
    nama VARCHAR(255) NOT NULL,
    jenis VARCHAR(100) NOT NULL,
    vendor VARCHAR(150),
    tanggal_beli DATE,
    garansi_berakhir DATE,
    status ENUM('Tersedia', 'Dipinjam', 'Diperbaiki', 'Rusak', 'Dihapus/Afkir') DEFAULT 'Tersedia',
    kondisi ENUM('Sangat Baik', 'Baik', 'Terdapat Cacat Fisik', 'Rusak Ringan', 'Rusak Berat') DEFAULT 'Baik',
    lokasi_departemen_id CHAR(4) CHARACTER SET latin1, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lokasi_departemen_id) REFERENCES departemen(dep_id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS it_asset_loans (
    id INT(11) AUTO_INCREMENT PRIMARY KEY,
    asset_id INT(11) NOT NULL,
    pegawai_id INT(11) NOT NULL,
    departemen_id CHAR(4) CHARACTER SET latin1,
    tanggal_pinjam DATETIME NOT NULL,
    tenggat_pengembalian DATETIME,
    tanggal_kembali DATETIME,
    tujuan_peminjaman TEXT,
    kondisi_keluar VARCHAR(255),
    kondisi_kembali VARCHAR(255),
    status_peminjaman ENUM('Aktif', 'Dikembalikan', 'Terlambat', 'Hilang') DEFAULT 'Aktif',
    created_by INT(11),
    received_by INT(11),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES it_assets(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (departemen_id) REFERENCES departemen(dep_id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES pegawai(id) ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (received_by) REFERENCES pegawai(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC;

CREATE TABLE IF NOT EXISTS it_asset_logs (
    id BIGINT(20) AUTO_INCREMENT PRIMARY KEY,
    asset_id INT(11) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    changed_by INT(11),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES it_assets(id) ON UPDATE CASCADE ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES pegawai(id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 ROW_FORMAT=DYNAMIC;
