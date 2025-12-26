-- =============================================
-- Migration: Refaktor Schema gaji_pegawai
-- Menggabungkan kolom gaji_pokok dan total_gaji menjadi kolom gaji
-- =============================================

-- Cek apakah tabel sudah ada dan memiliki kolom lama
-- Jika tabel belum ada, script create_gaji_tables.sql akan membuat dengan schema baru
-- Script ini untuk migrate tabel yang sudah ada

-- Step 1: Tambahkan kolom baru gaji
ALTER TABLE gaji_pegawai 
ADD COLUMN gaji DECIMAL(15,2) NOT NULL DEFAULT 0 AFTER jenis;

-- Step 2: Copy data dari total_gaji ke gaji (jika ada data)
UPDATE gaji_pegawai 
SET gaji = COALESCE(total_gaji, gaji_pokok, 0)
WHERE gaji = 0;

-- Step 3: Hapus kolom lama
ALTER TABLE gaji_pegawai 
DROP COLUMN gaji_pokok,
DROP COLUMN total_gaji;


