-- =============================================
-- Migration: Improve Audit Trail untuk Tabel Gaji
-- Menambahkan field dan tabel untuk full audit trail
-- =============================================

-- Step 1: Tambahkan field updated_by ke tabel gaji_pegawai
ALTER TABLE gaji_pegawai 
ADD COLUMN updated_by VARCHAR(20) NULL AFTER uploaded_by,
ADD COLUMN deleted_at TIMESTAMP NULL AFTER updated_at,
ADD COLUMN deleted_by VARCHAR(20) NULL AFTER deleted_at;

-- Step 2: Tambahkan foreign key untuk updated_by dan deleted_by
ALTER TABLE gaji_pegawai
ADD CONSTRAINT fk_gaji_updated_by FOREIGN KEY (updated_by) REFERENCES pegawai(nik) ON DELETE RESTRICT,
ADD CONSTRAINT fk_gaji_deleted_by FOREIGN KEY (deleted_by) REFERENCES pegawai(nik) ON DELETE RESTRICT;

-- Step 3: Buat tabel history untuk track perubahan gaji
CREATE TABLE IF NOT EXISTS gaji_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    gaji_id INT NOT NULL,
    nik VARCHAR(20) NOT NULL,
    periode_tahun INT NOT NULL,
    periode_bulan INT NOT NULL,
    jenis ENUM('Gaji', 'Jasa') NOT NULL,
    gaji_lama DECIMAL(15,2) NULL,
    gaji_baru DECIMAL(15,2) NOT NULL,
    changed_by VARCHAR(20) NOT NULL,
    change_type ENUM('CREATE', 'UPDATE', 'DELETE') NOT NULL,
    change_reason TEXT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gaji_id) REFERENCES gaji_pegawai(id) ON DELETE CASCADE,
    FOREIGN KEY (nik) REFERENCES pegawai(nik) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES pegawai(nik) ON DELETE RESTRICT,
    
    INDEX idx_gaji_id (gaji_id),
    INDEX idx_nik (nik),
    INDEX idx_changed_by (changed_by),
    INDEX idx_changed_at (changed_at),
    INDEX idx_change_type (change_type)
);

-- Step 4: Buat trigger untuk auto-record perubahan (CREATE)
DELIMITER //
CREATE TRIGGER tr_gaji_after_insert
AFTER INSERT ON gaji_pegawai
FOR EACH ROW
BEGIN
    INSERT INTO gaji_history (
        gaji_id,
        nik,
        periode_tahun,
        periode_bulan,
        jenis,
        gaji_lama,
        gaji_baru,
        changed_by,
        change_type,
        change_reason
    ) VALUES (
        NEW.id,
        NEW.nik,
        NEW.periode_tahun,
        NEW.periode_bulan,
        NEW.jenis,
        NULL,
        NEW.gaji,
        NEW.uploaded_by,
        'CREATE',
        CONCAT('Data gaji diupload via file: ', COALESCE((SELECT file_name FROM gaji_upload_log WHERE uploaded_by = NEW.uploaded_by ORDER BY uploaded_at DESC LIMIT 1), 'Manual'))
    );
END//
DELIMITER ;

-- Step 5: Buat trigger untuk auto-record perubahan (UPDATE)
DELIMITER //
CREATE TRIGGER tr_gaji_after_update
AFTER UPDATE ON gaji_pegawai
FOR EACH ROW
BEGIN
    -- Hanya record jika ada perubahan pada nilai gaji atau jenis
    IF OLD.gaji != NEW.gaji OR OLD.jenis != NEW.jenis THEN
        INSERT INTO gaji_history (
            gaji_id,
            nik,
            periode_tahun,
            periode_bulan,
            jenis,
            gaji_lama,
            gaji_baru,
            changed_by,
            change_type,
            change_reason
        ) VALUES (
            NEW.id,
            NEW.nik,
            NEW.periode_tahun,
            NEW.periode_bulan,
            NEW.jenis,
            OLD.gaji,
            NEW.gaji,
            COALESCE(NEW.updated_by, NEW.uploaded_by),
            'UPDATE',
            CONCAT('Gaji diupdate: ', 
                CASE WHEN OLD.gaji != NEW.gaji THEN CONCAT('Gaji ', OLD.gaji, ' -> ', NEW.gaji) ELSE '' END,
                CASE WHEN OLD.jenis != NEW.jenis THEN CONCAT('Jenis ', OLD.jenis, ' -> ', NEW.jenis) ELSE '' END
            )
        );
    END IF;
END//
DELIMITER ;

-- Step 6: Buat trigger untuk auto-record perubahan (DELETE)
DELIMITER //
CREATE TRIGGER tr_gaji_before_delete
BEFORE DELETE ON gaji_pegawai
FOR EACH ROW
BEGIN
    INSERT INTO gaji_history (
        gaji_id,
        nik,
        periode_tahun,
        periode_bulan,
        jenis,
        gaji_lama,
        gaji_baru,
        changed_by,
        change_type,
        change_reason
    ) VALUES (
        OLD.id,
        OLD.nik,
        OLD.periode_tahun,
        OLD.periode_bulan,
        OLD.jenis,
        OLD.gaji,
        NULL,
        COALESCE(OLD.deleted_by, OLD.uploaded_by),
        'DELETE',
        'Data gaji dihapus'
    );
END//
DELIMITER ;


