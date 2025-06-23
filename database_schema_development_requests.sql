-- =============================================
-- Database Schema: Pengajuan Pengembangan Modul IT
-- Based on existing ticket system structure
-- =============================================

-- 1. Tabel Master: Jenis/Tipe Modul
CREATE TABLE module_types (
    type_id INT PRIMARY KEY AUTO_INCREMENT,
    type_name VARCHAR(100) NOT NULL UNIQUE,
    type_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default module types
INSERT INTO module_types (type_name, type_description) VALUES
('Web Application', 'Aplikasi berbasis web untuk internal/eksternal'),
('Mobile Application', 'Aplikasi mobile (Android/iOS)'),
('Desktop Application', 'Aplikasi desktop untuk workstation'),
('API/Web Service', 'Layanan API untuk integrasi sistem'),
('Database Module', 'Modul pengelolaan database dan laporan'),
('Integration Module', 'Modul integrasi dengan sistem eksternal'),
('Security Module', 'Modul keamanan dan otentikasi'),
('Reporting Module', 'Modul pelaporan dan dashboard'),
('Automation Module', 'Modul otomatisasi proses bisnis'),
('Other', 'Jenis modul lainnya');

-- 2. Tabel Master: Prioritas Pengembangan
CREATE TABLE development_priorities (
    priority_id INT PRIMARY KEY AUTO_INCREMENT,
    priority_name VARCHAR(50) NOT NULL UNIQUE,
    priority_level INT NOT NULL,
    priority_description TEXT,
    priority_color VARCHAR(7) DEFAULT '#666666',
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default priorities
INSERT INTO development_priorities (priority_name, priority_level, priority_description, priority_color) VALUES
('Critical', 1, 'Pengembangan sangat urgent, menghentikan operasional', '#dc3545'),
('High', 2, 'Prioritas tinggi, perlu segera dikembangkan', '#fd7e14'),
('Medium', 3, 'Prioritas sedang, bisa dijadwalkan', '#ffc107'),
('Low', 4, 'Prioritas rendah, bisa ditunda', '#28a745'),
('Enhancement', 5, 'Peningkatan fitur yang tidak urgent', '#6c757d');

-- 3. Tabel Master: Status Pengembangan
CREATE TABLE development_statuses (
    status_id INT PRIMARY KEY AUTO_INCREMENT,
    status_name VARCHAR(50) NOT NULL UNIQUE,
    status_description TEXT,
    status_color VARCHAR(7) DEFAULT '#666666',
    is_active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default statuses
INSERT INTO development_statuses (status_name, status_description, status_color) VALUES
('Draft', 'Pengajuan masih dalam tahap draft', '#6c757d'),
('Submitted', 'Pengajuan telah disubmit untuk review', '#17a2b8'),
('Under Review', 'Sedang dalam tahap review oleh IT Manager', '#ffc107'),
('Need Info', 'Membutuhkan informasi tambahan dari pengaju', '#fd7e14'),
('Approved', 'Pengajuan disetujui untuk dilanjutkan', '#28a745'),
('Assigned', 'Telah di-assign ke developer', '#007bff'),
('In Development', 'Sedang dalam tahap pengembangan', '#fd7e14'),
('Development Complete', 'Pengembangan selesai', '#28a745'),
('In Testing', 'Sedang dalam tahap testing', '#17a2b8'),
('Bug Found', 'Ditemukan bug, perlu perbaikan', '#dc3545'),
('Testing Complete', 'Testing selesai, siap deploy', '#28a745'),
('In Deployment', 'Sedang dalam proses deployment', '#6f42c1'),
('UAT', 'User Acceptance Testing', '#ffc107'),
('UAT Failed', 'UAT gagal, perlu perbaikan', '#dc3545'),
('Completed', 'Pengembangan selesai dan berhasil', '#28a745'),
('Closed', 'Pengajuan ditutup', '#6c757d'),
('Rejected', 'Pengajuan ditolak', '#dc3545'),
('Cancelled', 'Pengajuan dibatalkan', '#dc3545');

-- 4. Tabel Utama: Pengajuan Pengembangan
CREATE TABLE development_requests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    no_request VARCHAR(50) NOT NULL UNIQUE,
    user_id VARCHAR(20) NOT NULL CHARACTER SET latin1 COLLATE latin1_swedish_ci,
    departement_id CHAR(4) NOT NULL CHARACTER SET latin1 COLLATE latin1_swedish_ci,
    module_type_id INT NOT NULL,
    priority_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    current_system_issues TEXT,
    proposed_solution TEXT,
    expected_completion_date DATE,
    current_status_id INT NOT NULL,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_date TIMESTAMP NULL,
    approved_by VARCHAR(20) NULL,
    development_start_date TIMESTAMP NULL,
    deployment_date TIMESTAMP NULL,
    completed_date TIMESTAMP NULL,
    closed_date TIMESTAMP NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES pegawai(nik),
    FOREIGN KEY (departement_id) REFERENCES departemen(dep_id),
    FOREIGN KEY (module_type_id) REFERENCES module_types(type_id),
    FOREIGN KEY (priority_id) REFERENCES development_priorities(priority_id),
    FOREIGN KEY (current_status_id) REFERENCES development_statuses(status_id),
    FOREIGN KEY (approved_by) REFERENCES pegawai(nik),
    
    INDEX idx_user_id (user_id),
    INDEX idx_status (current_status_id),
    INDEX idx_priority (priority_id),
    INDEX idx_submission_date (submission_date),
    INDEX idx_no_request (no_request)
);

-- 5. Tabel Catatan/Komentar Pengembangan
CREATE TABLE development_notes (
    note_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT(11) NOT NULL,
    note TEXT NOT NULL,
    note_type ENUM('comment', 'feedback', 'approval', 'rejection', 'clarification', 'update') DEFAULT 'comment',
    created_by VARCHAR(20) NOT NULL,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES development_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES pegawai(nik),
    
    INDEX idx_request_id (request_id),
    INDEX idx_created_date (created_date)
);

-- 6. Tabel Riwayat Status
CREATE TABLE development_status_history (
    history_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    old_status INT,
    new_status INT NOT NULL,
    changed_by VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci,
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    change_reason TEXT,
    
    FOREIGN KEY (request_id) REFERENCES development_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (old_status) REFERENCES development_statuses(status_id),
    FOREIGN KEY (new_status) REFERENCES development_statuses(status_id),
    FOREIGN KEY (changed_by) REFERENCES pegawai(nik),
    
    INDEX idx_request_id (request_id),
    INDEX idx_change_date (change_date)
);

-- 7. Tabel Lampiran/Attachment
CREATE TABLE development_attachments (
    attachment_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(100),
    file_size INT,
    attachment_type ENUM('document', 'image', 'mockup', 'specification', 'other') DEFAULT 'document',
    uploaded_by VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES development_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES pegawai(nik),
    
    INDEX idx_request_id (request_id)
);

-- 8. Tabel Assignment Developer
CREATE TABLE development_assignments (
    assignment_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    assigned_to VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci,
    assigned_by VARCHAR(20) CHARACTER SET latin1 COLLATE latin1_swedish_ci,
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assignment_notes TEXT,
    estimated_hours INT,
    is_active BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (request_id) REFERENCES development_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES pegawai(nik),
    FOREIGN KEY (assigned_by) REFERENCES pegawai(nik),
    
    INDEX idx_request_id (request_id),
    INDEX idx_assigned_to (assigned_to)
);

-- 9. Tabel Progress Tracking
CREATE TABLE development_progress (
    progress_id INT PRIMARY KEY AUTO_INCREMENT,
    request_id INT NOT NULL,
    progress_percentage INT DEFAULT 0,
    progress_description TEXT,
    milestone VARCHAR(255),
    updated_by VARCHAR(20) NOT NULL,
    update_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (request_id) REFERENCES development_requests(request_id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES pegawai(nik),
    
    INDEX idx_request_id (request_id),
    INDEX idx_update_date (update_date)
);



-- =============================================
-- Views untuk Reporting dan Dashboard
-- =============================================

-- View: Development Requests dengan Detail
CREATE VIEW v_development_requests AS
SELECT 
    dr.request_id,
    dr.no_request,
    dr.user_id,
    p.nama as user_name,
    d.nama as departemen_name,
    mt.type_name as module_type,
    dp.priority_name,
    dp.priority_level,
    dp.priority_color,
    dr.title,
    dr.description,
    dr.current_system_issues,
    dr.proposed_solution,
    dr.expected_completion_date,
    ds.status_name as current_status,
    ds.status_color,
    dr.submission_date,
    dr.approved_date,
    dr.development_start_date,
    dr.deployment_date,
    dr.completed_date,
    dr.closed_date,
    COALESCE(notes_count.total_notes, 0) as notes_count,
    COALESCE(attachments_count.total_attachments, 0) as attachments_count
FROM development_requests dr
LEFT JOIN pegawai p ON dr.user_id = p.nik
LEFT JOIN departemen d ON dr.departement_id = d.dep_id
LEFT JOIN module_types mt ON dr.module_type_id = mt.type_id
LEFT JOIN development_priorities dp ON dr.priority_id = dp.priority_id
LEFT JOIN development_statuses ds ON dr.current_status_id = ds.status_id
LEFT JOIN (
    SELECT request_id, COUNT(*) as total_notes
    FROM development_notes
    GROUP BY request_id
) notes_count ON dr.request_id = notes_count.request_id
LEFT JOIN (
    SELECT request_id, COUNT(*) as total_attachments
    FROM development_attachments
    GROUP BY request_id
) attachments_count ON dr.request_id = attachments_count.request_id;

-- View: Dashboard Statistics
CREATE VIEW v_development_dashboard AS
SELECT 
    COUNT(*) as total_requests,
    COUNT(CASE WHEN ds.status_name = 'Submitted' THEN 1 END) as pending_review,
    COUNT(CASE WHEN ds.status_name IN ('In Development', 'In Testing') THEN 1 END) as in_progress,
    COUNT(CASE WHEN ds.status_name = 'Completed' THEN 1 END) as completed,
    COUNT(CASE WHEN ds.status_name = 'Rejected' THEN 1 END) as rejected,
    AVG(CASE WHEN dr.completed_date IS NOT NULL THEN 
        DATEDIFF(dr.completed_date, dr.submission_date) END) as avg_completion_days
FROM development_requests dr
LEFT JOIN development_statuses ds ON dr.current_status_id = ds.status_id
WHERE dr.submission_date >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR);

-- =============================================
-- Indexes untuk Performance
-- =============================================

-- Additional indexes for better performance
CREATE INDEX idx_dev_requests_date_status ON development_requests(submission_date, current_status_id);
CREATE INDEX idx_dev_requests_user_status ON development_requests(user_id, current_status_id);
CREATE INDEX idx_dev_notes_type_date ON development_notes(note_type, created_date);
CREATE INDEX idx_dev_status_history_date ON development_status_history(change_date);

-- =============================================
-- Triggers untuk Audit Trail
-- =============================================

-- Trigger untuk auto-generate nomor request
DELIMITER //
CREATE TRIGGER tr_generate_request_number
    BEFORE INSERT ON development_requests
    FOR EACH ROW
BEGIN
    DECLARE next_seq INT;
    DECLARE today_str VARCHAR(8);
    DECLARE request_prefix VARCHAR(15);
    
    SET today_str = DATE_FORMAT(NOW(), '%Y%m%d');
    SET request_prefix = CONCAT('DEV-', today_str, '-');
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(no_request, 14) AS UNSIGNED)), 0) + 1
    INTO next_seq
    FROM development_requests
    WHERE no_request LIKE CONCAT(request_prefix, '%');
    
    SET NEW.no_request = CONCAT(request_prefix, LPAD(next_seq, 4, '0'));
END //
DELIMITER ;

-- Trigger untuk audit trail saat update status
DELIMITER //
CREATE TRIGGER tr_development_status_audit
    AFTER UPDATE ON development_requests
    FOR EACH ROW
BEGIN
    IF OLD.current_status_id != NEW.current_status_id THEN
        INSERT INTO development_status_history (
            request_id, 
            old_status, 
            new_status, 
            changed_by, 
            change_date,
            change_reason
        ) VALUES (
            NEW.request_id,
            OLD.current_status_id,
            NEW.current_status_id,
            USER(),
            NOW(),
            'Status changed via system update'
        );
    END IF;
END //
DELIMITER ; 