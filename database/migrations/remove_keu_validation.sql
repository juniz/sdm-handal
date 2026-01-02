-- =============================================
-- Migration: Hapus Validasi KEU
-- Hanya menyisakan tanda tangan dari penerima gaji
-- =============================================

-- Hapus kolom yang tidak diperlukan dari gaji_validasi
ALTER TABLE gaji_validasi
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS validated_by,
DROP COLUMN IF EXISTS validated_at,
DROP FOREIGN KEY IF EXISTS fk_gaji_validasi_validated_by;

-- Hapus index yang tidak diperlukan
DROP INDEX IF EXISTS idx_status ON gaji_validasi;
DROP INDEX IF EXISTS idx_validated_by ON gaji_validasi;

-- Update gaji_validasi_history untuk hanya track CREATE
-- Hapus kolom status_lama dan status_baru karena tidak diperlukan lagi
ALTER TABLE gaji_validasi_history
DROP COLUMN IF EXISTS status_lama,
DROP COLUMN IF EXISTS status_baru,
DROP INDEX IF EXISTS idx_status_baru;

-- Update change_type enum untuk hanya CREATE
ALTER TABLE gaji_validasi_history
MODIFY COLUMN change_type ENUM('CREATE') NOT NULL DEFAULT 'CREATE';

