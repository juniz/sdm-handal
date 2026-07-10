-- Migration v2 untuk menambahkan kolom no_pengajuan ke tabel pengajuan_kta
-- Tanggal: 2024
-- Deskripsi: Menambahkan kolom no_pengajuan dengan generate di backend

-- 1. Tambahkan kolom no_pengajuan
ALTER TABLE pengajuan_kta 
ADD COLUMN no_pengajuan VARCHAR(20) NOT NULL UNIQUE AFTER id;

-- 2. Update data existing (jika ada) dengan nomor pengajuan
-- Format: KTA-YYYY-MM-NNNN berdasarkan created_at dan id
UPDATE pengajuan_kta 
SET no_pengajuan = CONCAT('KTA-', YEAR(created_at), '-', LPAD(MONTH(created_at), 2, '0'), '-', LPAD(id, 4, '0'))
WHERE no_pengajuan IS NULL OR no_pengajuan = '';

-- 3. Buat index untuk performa
CREATE INDEX idx_no_pengajuan ON pengajuan_kta(no_pengajuan);
CREATE INDEX idx_pengajuan_year_month ON pengajuan_kta(YEAR(created_at), MONTH(created_at));

-- 4. Contoh hasil format nomor pengajuan:
-- KTA-2024-01-0001
-- KTA-2024-01-0002
-- KTA-2024-02-0001
-- dst...

-- CATATAN: 
-- - Generate nomor pengajuan dilakukan di backend JavaScript
-- - Tidak menggunakan database function/trigger
-- - Lebih fleksibel untuk custom logic dan error handling

-- Untuk rollback (jika diperlukan):
-- ALTER TABLE pengajuan_kta DROP COLUMN no_pengajuan;
-- DROP INDEX IF EXISTS idx_no_pengajuan;
-- DROP INDEX IF EXISTS idx_pengajuan_year_month; 