-- Migration untuk menambahkan kolom no_pengajuan ke tabel pengajuan_kta
-- Tanggal: 2024
-- Deskripsi: Menambahkan kolom no_pengajuan dengan format auto-generate

-- 1. Tambahkan kolom no_pengajuan
ALTER TABLE pengajuan_kta 
ADD COLUMN no_pengajuan VARCHAR(20) NOT NULL UNIQUE AFTER id;

-- 2. Buat function untuk generate nomor pengajuan
DELIMITER //
CREATE FUNCTION generate_no_pengajuan() 
RETURNS VARCHAR(20)
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE next_number INT;
    DECLARE current_year CHAR(4);
    DECLARE current_month CHAR(2);
    DECLARE new_no_pengajuan VARCHAR(20);
    
    -- Ambil tahun dan bulan saat ini
    SET current_year = YEAR(NOW());
    SET current_month = LPAD(MONTH(NOW()), 2, '0');
    
    -- Ambil nomor urut terakhir untuk bulan dan tahun ini
    SELECT COALESCE(MAX(CAST(SUBSTRING(no_pengajuan, -4) AS UNSIGNED)), 0) + 1
    INTO next_number
    FROM pengajuan_kta 
    WHERE no_pengajuan LIKE CONCAT('KTA-', current_year, '-', current_month, '-%');
    
    -- Format: KTA-YYYY-MM-NNNN
    SET new_no_pengajuan = CONCAT('KTA-', current_year, '-', current_month, '-', LPAD(next_number, 4, '0'));
    
    RETURN new_no_pengajuan;
END//
DELIMITER ;

-- 3. Buat trigger untuk auto-generate no_pengajuan saat insert
DELIMITER //
CREATE TRIGGER trigger_generate_no_pengajuan 
BEFORE INSERT ON pengajuan_kta
FOR EACH ROW
BEGIN
    IF NEW.no_pengajuan IS NULL OR NEW.no_pengajuan = '' THEN
        SET NEW.no_pengajuan = generate_no_pengajuan();
    END IF;
END//
DELIMITER ;

-- 4. Update data existing (jika ada) dengan nomor pengajuan
UPDATE pengajuan_kta 
SET no_pengajuan = CONCAT('KTA-', YEAR(created_at), '-', LPAD(MONTH(created_at), 2, '0'), '-', LPAD(id, 4, '0'))
WHERE no_pengajuan IS NULL OR no_pengajuan = '';

-- 5. Buat index untuk performa
CREATE INDEX idx_no_pengajuan ON pengajuan_kta(no_pengajuan);
CREATE INDEX idx_pengajuan_year_month ON pengajuan_kta(YEAR(created_at), MONTH(created_at));

-- 6. Contoh hasil format nomor pengajuan:
-- KTA-2024-01-0001
-- KTA-2024-01-0002
-- KTA-2024-02-0001
-- dst...

-- Untuk rollback (jika diperlukan):
-- ALTER TABLE pengajuan_kta DROP COLUMN no_pengajuan;
-- DROP TRIGGER IF EXISTS trigger_generate_no_pengajuan;
-- DROP FUNCTION IF EXISTS generate_no_pengajuan; 