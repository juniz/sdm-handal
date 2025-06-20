-- ============================================================================
-- SCRIPT PERBAIKAN STRUKTUR TABEL PENGAJUAN_KTA
-- ============================================================================
-- Tanggal: [CURRENT_DATE]
-- Deskripsi: Memperbaiki struktur tabel pengajuan_kta berdasarkan analisis
-- ============================================================================

-- 1. BACKUP TABEL EXISTING (OPSIONAL)
CREATE TABLE IF NOT EXISTS pengajuan_kta_backup AS SELECT * FROM pengajuan_kta;

-- 2. TAMBAH FOREIGN KEY CONSTRAINT
-- Pastikan tabel referensi (pegawai) ada dan field nik konsisten
ALTER TABLE pengajuan_kta 
ADD CONSTRAINT fk_pengajuan_kta_nik 
FOREIGN KEY (nik) REFERENCES pegawai(nik) 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- 3. TAMBAH FIELD TAMBAHAN YANG DIPERLUKAN
ALTER TABLE pengajuan_kta 
ADD COLUMN nama_lengkap VARCHAR(255) AFTER nik,
ADD COLUMN jabatan VARCHAR(100) AFTER nama_lengkap,
ADD COLUMN unit_kerja VARCHAR(100) AFTER jabatan,
ADD COLUMN foto_profile TEXT AFTER unit_kerja,
ADD COLUMN tanggal_bergabung DATE AFTER foto_profile,
ADD COLUMN nomor_kta VARCHAR(50) AFTER tanggal_bergabung,
ADD COLUMN tanggal_disetujui DATETIME NULL AFTER status,
ADD COLUMN tanggal_selesai DATETIME NULL AFTER tanggal_disetujui,
ADD COLUMN keterangan TEXT AFTER alasan_ditolak;

-- 4. PERBAIKI ENUM STATUS
ALTER TABLE pengajuan_kta 
MODIFY COLUMN status ENUM(
    'pending',
    'dalam_proses', 
    'disetujui',
    'ditolak',
    'proses',
    'selesai'
) DEFAULT 'pending';

-- 5. TAMBAH INDEX UNTUK PERFORMA
CREATE INDEX idx_pengajuan_kta_nik ON pengajuan_kta(nik);
CREATE INDEX idx_pengajuan_kta_status ON pengajuan_kta(status);
CREATE INDEX idx_pengajuan_kta_created ON pengajuan_kta(created_at);
CREATE INDEX idx_pengajuan_kta_jenis ON pengajuan_kta(jenis);

-- 6. TAMBAH CONSTRAINT UNTUK VALIDASI DATA
ALTER TABLE pengajuan_kta 
ADD CONSTRAINT chk_jenis_valid 
CHECK (jenis IN ('Baru', 'Ganti', 'Hilang'));

-- 7. BUAT TRIGGER UNTUK AUTO-POPULATE DATA PEGAWAI
DELIMITER //
CREATE TRIGGER tr_pengajuan_kta_insert 
BEFORE INSERT ON pengajuan_kta
FOR EACH ROW
BEGIN
    DECLARE v_nama VARCHAR(255);
    DECLARE v_jabatan VARCHAR(100);
    DECLARE v_unit_kerja VARCHAR(100);
    
    -- Ambil data dari tabel pegawai berdasarkan NIK
    SELECT nama, jabatan, unit_kerja 
    INTO v_nama, v_jabatan, v_unit_kerja
    FROM pegawai 
    WHERE nik = NEW.nik;
    
    -- Set nilai otomatis
    SET NEW.nama_lengkap = v_nama;
    SET NEW.jabatan = v_jabatan;
    SET NEW.unit_kerja = v_unit_kerja;
    
    -- Set timestamp otomatis jika belum diset
    IF NEW.created_at IS NULL THEN
        SET NEW.created_at = NOW();
    END IF;
    
    IF NEW.updated_at IS NULL THEN
        SET NEW.updated_at = NOW();
    END IF;
END//
DELIMITER ;

-- 8. BUAT TRIGGER UNTUK AUTO-UPDATE TIMESTAMP DAN STATUS DATE
DELIMITER //
CREATE TRIGGER tr_pengajuan_kta_update 
BEFORE UPDATE ON pengajuan_kta
FOR EACH ROW
BEGIN
    -- Update timestamp
    SET NEW.updated_at = NOW();
    
    -- Set tanggal berdasarkan status
    IF NEW.status = 'disetujui' AND OLD.status != 'disetujui' THEN
        SET NEW.tanggal_disetujui = NOW();
    END IF;
    
    IF NEW.status = 'selesai' AND OLD.status != 'selesai' THEN
        SET NEW.tanggal_selesai = NOW();
    END IF;
END//
DELIMITER ;

-- 9. BUAT VIEW UNTUK LAPORAN PENGAJUAN KTA
CREATE OR REPLACE VIEW v_pengajuan_kta_report AS
SELECT 
    pk.id,
    pk.nik,
    pk.nama_lengkap,
    pk.jabatan,
    pk.unit_kerja,
    pk.jenis,
    pk.alasan,
    pk.status,
    pk.alasan_ditolak,
    pk.keterangan,
    pk.nomor_kta,
    pk.created_at as tanggal_pengajuan,
    pk.tanggal_disetujui,
    pk.tanggal_selesai,
    pk.updated_at,
    CASE 
        WHEN pk.status = 'selesai' THEN DATEDIFF(pk.tanggal_selesai, pk.created_at)
        ELSE DATEDIFF(NOW(), pk.created_at)
    END as durasi_proses_hari,
    p.email,
    p.no_telp,
    d.nama as departemen_nama
FROM pengajuan_kta pk
LEFT JOIN pegawai p ON pk.nik = p.nik
LEFT JOIN departemen d ON p.departemen = d.dep_id
ORDER BY pk.created_at DESC;

-- 10. BUAT STORED PROCEDURE UNTUK STATISTIK
DELIMITER //
CREATE PROCEDURE sp_statistik_pengajuan_kta(
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        COUNT(*) as total_pengajuan,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'dalam_proses' THEN 1 ELSE 0 END) as dalam_proses,
        SUM(CASE WHEN status = 'disetujui' THEN 1 ELSE 0 END) as disetujui,
        SUM(CASE WHEN status = 'ditolak' THEN 1 ELSE 0 END) as ditolak,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN jenis = 'Baru' THEN 1 ELSE 0 END) as kta_baru,
        SUM(CASE WHEN jenis = 'Ganti' THEN 1 ELSE 0 END) as kta_ganti,
        SUM(CASE WHEN jenis = 'Hilang' THEN 1 ELSE 0 END) as kta_hilang,
        AVG(CASE 
            WHEN status = 'selesai' THEN DATEDIFF(tanggal_selesai, created_at)
            ELSE NULL
        END) as rata_rata_durasi_hari
    FROM pengajuan_kta
    WHERE DATE(created_at) BETWEEN p_start_date AND p_end_date;
END//
DELIMITER ;

-- 11. BUAT FUNCTION UNTUK CEK DEPARTMENT ACCESS
DELIMITER //
CREATE FUNCTION fn_check_department_access(p_user_id INT) 
RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_department VARCHAR(10);
    DECLARE v_department_name VARCHAR(100);
    DECLARE v_access BOOLEAN DEFAULT FALSE;
    
    -- Ambil data departemen user
    SELECT p.departemen, d.nama 
    INTO v_department, v_department_name
    FROM pegawai p
    LEFT JOIN departemen d ON p.departemen = d.dep_id
    WHERE p.id = p_user_id;
    
    -- Cek akses berdasarkan departemen
    IF v_department IN ('IT', 'HRD') OR
       LOWER(v_department_name) LIKE '%it%' OR
       LOWER(v_department_name) LIKE '%teknologi%' OR
       LOWER(v_department_name) LIKE '%hrd%' OR
       LOWER(v_department_name) LIKE '%human resource%' THEN
        SET v_access = TRUE;
    END IF;
    
    RETURN v_access;
END//
DELIMITER ;

-- 12. INSERT DATA SAMPLE (OPSIONAL - UNTUK TESTING)
-- INSERT INTO pengajuan_kta (nik, jenis, alasan, status) VALUES
-- ('1234567890123456', 'Baru', 'Karyawan baru membutuhkan KTA', 'pending'),
-- ('1234567890123457', 'Ganti', 'KTA lama rusak dan tidak bisa dibaca', 'disetujui'),
-- ('1234567890123458', 'Hilang', 'KTA hilang saat perjalanan dinas ke Jakarta', 'dalam_proses'),
-- ('1234567890123459', 'Ganti', 'Perubahan data pribadi', 'ditolak');

-- ============================================================================
-- NOTES UNTUK DEVELOPER:
-- ============================================================================
-- 1. Jalankan script ini secara bertahap dan test setiap langkah
-- 2. Pastikan backup database sebelum menjalankan
-- 3. Sesuaikan nama tabel referensi (pegawai) dengan struktur database Anda
-- 4. Test trigger dan constraint setelah implementasi
-- 5. Monitor performa setelah menambah index
-- 6. Function fn_check_department_access() bisa digunakan di aplikasi
-- ============================================================================

-- QUERY UNTUK TESTING SETELAH IMPLEMENTASI:
-- SELECT * FROM v_pengajuan_kta_report LIMIT 10;
-- CALL sp_statistik_pengajuan_kta('2024-01-01', '2024-12-31');
-- SELECT fn_check_department_access(1); -- Test dengan ID user
-- SHOW INDEX FROM pengajuan_kta;
-- SHOW TRIGGERS LIKE 'pengajuan_kta'; 