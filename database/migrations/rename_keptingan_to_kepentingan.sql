-- =============================================
-- Migration: Rename kolom keptingan menjadi kepentingan
-- =============================================
-- Deskripsi: Mengubah nama kolom keptingan menjadi kepentingan di tabel pengajuan_tudin
-- Tanggal: 2024

-- STEP 1: Cek apakah kolom keptingan ada
-- Jika ada, rename menjadi kepentingan
ALTER TABLE `pengajuan_tudin` 
CHANGE COLUMN `keptingan` `kepentingan` VARCHAR(100) NOT NULL DEFAULT '' 
COMMENT 'Kepentingan/alasan tukar dinas' 
AFTER `nik_pj`;

-- STEP 2: Jika kolom keptingan belum ada tapi kepentingan sudah ada, tidak perlu melakukan apa-apa
-- (Script ini akan error jika kolom keptingan tidak ada, tapi itu tidak masalah)

-- STEP 3: Verifikasi struktur tabel
DESCRIBE pengajuan_tudin;

-- Catatan: 
-- - Jika kolom keptingan tidak ada di database, script ini akan error
-- - Jika kolom kepentingan sudah ada, script ini akan error karena kolom sudah ada
-- - Pastikan untuk backup data sebelum menjalankan migration ini

