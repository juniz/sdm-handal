-- ============================================================================
-- SCRIPT PENAMBAHAN KOLOM URUTAN PADA TABEL RAPAT
-- ============================================================================
-- Tanggal: 2025-09-19
-- Deskripsi: Menambahkan kolom urutan untuk ordering data rapat pada export
-- ============================================================================

-- 1. TAMBAH KOLOM URUTAN
ALTER TABLE rapat 
ADD COLUMN urutan INT DEFAULT 0 AFTER id,
ADD INDEX idx_rapat_urutan (urutan),
ADD INDEX idx_rapat_tanggal_urutan (tanggal, urutan);

-- 2. UPDATE DATA EXISTING DENGAN URUTAN BERDASARKAN ID
-- Untuk data yang sudah ada, set urutan berdasarkan ID untuk menjaga konsistensi
UPDATE rapat SET urutan = id WHERE urutan = 0;

-- 3. UBAH DEFAULT VALUE UNTUK DATA BARU
-- Untuk data baru, urutan akan diisi otomatis berdasarkan ID yang akan dibuat
ALTER TABLE rapat ALTER COLUMN urutan SET DEFAULT 1;

-- ============================================================================
-- CATATAN PENGGUNAAN:
-- ============================================================================
-- 1. Kolom urutan digunakan untuk mengurutkan data rapat pada saat export
-- 2. Nilai urutan dapat diubah manual sesuai kebutuhan
-- 3. Index telah ditambahkan untuk optimasi query
-- 4. Data existing akan memiliki urutan berdasarkan ID mereka
-- ============================================================================
