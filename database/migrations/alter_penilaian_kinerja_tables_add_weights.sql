-- Add prioritas column to master template activities
ALTER TABLE `master_kegiatan_kerja`
ADD COLUMN `prioritas` ENUM('tinggi', 'sedang', 'rendah') NOT NULL DEFAULT 'sedang' AFTER `deskripsi`;

-- Add prioritas column to daily employee activities
ALTER TABLE `kegiatan_harian`
ADD COLUMN `prioritas` ENUM('tinggi', 'sedang', 'rendah') NOT NULL DEFAULT 'sedang' AFTER `penjabaran`;

-- Seed the weight parameters
INSERT INTO `parameter_penilaian` (`kode`, `nama_parameter`, `kategori`, `bobot_persen`, `nilai_kondisi`, `nilai_skor`, `deskripsi`, `is_aktif`) VALUES
('KGT_BOBOT_TINGGI', 'Bobot Kerja Prioritas Tinggi', 'kegiatan', 60, NULL, 3.00, 'Faktor pengali skor untuk kegiatan berprioritas tinggi', 1),
('KGT_BOBOT_SEDANG', 'Bobot Kerja Prioritas Sedang', 'kegiatan', 60, NULL, 2.00, 'Faktor pengali skor untuk kegiatan berprioritas sedang', 1),
('KGT_BOBOT_RENDAH', 'Bobot Kerja Prioritas Rendah', 'kegiatan', 60, NULL, 1.00, 'Faktor pengali skor untuk kegiatan berprioritas rendah', 1);
