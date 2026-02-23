-- =============================================
-- Migration: Remove signed_by from gaji_validasi
-- Focus only on gaji_id for unique validation
-- =============================================

-- 1. Hapus constraint dan kolom signed_by
-- Mencoba menghapus index dan foreign key jika ada
ALTER TABLE gaji_validasi 
DROP FOREIGN KEY IF EXISTS gaji_validasi_ibfk_3, -- Asumsi nama FK, jika tidak tahu bisa drop by column name di MariaDB 10.1.2+
DROP COLUMN IF EXISTS signed_by;

-- 2. Update Unique Key
-- Menghapus unique key lama yang mungkin melibatkan nik atau signed_by
-- Dan menggantinya dengan unique key pada gaji_id saja
ALTER TABLE gaji_validasi
DROP INDEX IF EXISTS uk_gaji_validasi,
ADD UNIQUE KEY uk_gaji_validasi (gaji_id);

-- 3. Hapus index pendukung yang tidak diperlukan lagi jika ada
DROP INDEX IF EXISTS idx_signed_by ON gaji_validasi;
