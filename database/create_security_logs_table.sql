-- Tabel untuk menyimpan log keamanan lokasi dan deteksi fake GPS
CREATE TABLE IF NOT EXISTS security_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    id_pegawai VARCHAR(20) NOT NULL,
    tanggal DATE NOT NULL,
    action_type ENUM('CHECKIN', 'CHECKOUT') NOT NULL,
    confidence_level INT DEFAULT 0 COMMENT 'Tingkat kepercayaan lokasi (0-100)',
    risk_level ENUM('LOW', 'MEDIUM', 'HIGH') DEFAULT 'LOW',
    warnings JSON COMMENT 'Daftar peringatan keamanan dalam format JSON',
    gps_accuracy DECIMAL(10,2) COMMENT 'Akurasi GPS dalam meter',
    latitude DECIMAL(10,8) NOT NULL COMMENT 'Koordinat latitude',
    longitude DECIMAL(11,8) NOT NULL COMMENT 'Koordinat longitude',
    device_info JSON COMMENT 'Informasi perangkat (opsional)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for performance
    INDEX idx_pegawai_tanggal (id_pegawai, tanggal),
    INDEX idx_action_type (action_type),
    INDEX idx_risk_level (risk_level),
    INDEX idx_confidence (confidence_level),
    INDEX idx_created_at (created_at),
    
    -- Foreign key constraint (jika tabel pegawai ada)
    FOREIGN KEY (id_pegawai) REFERENCES pegawai(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Log keamanan untuk deteksi fake GPS dan monitoring lokasi';

-- Tabel untuk menyimpan statistik harian keamanan lokasi
CREATE TABLE IF NOT EXISTS security_daily_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tanggal DATE NOT NULL,
    total_checkins INT DEFAULT 0,
    total_checkouts INT DEFAULT 0,
    high_risk_count INT DEFAULT 0,
    medium_risk_count INT DEFAULT 0,
    low_risk_count INT DEFAULT 0,
    avg_confidence_level DECIMAL(5,2) DEFAULT 0.00,
    suspicious_activities JSON COMMENT 'Aktivitas mencurigakan dalam format JSON',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_date (tanggal),
    INDEX idx_tanggal (tanggal),
    INDEX idx_risk_counts (high_risk_count, medium_risk_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Statistik harian keamanan lokasi';

-- Tabel untuk menyimpan blacklist lokasi mencurigakan
CREATE TABLE IF NOT EXISTS location_blacklist (
    id INT AUTO_INCREMENT PRIMARY KEY,
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    radius_meter INT DEFAULT 100 COMMENT 'Radius dalam meter',
    reason VARCHAR(255) NOT NULL COMMENT 'Alasan blacklist',
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(20) COMMENT 'ID admin yang menambahkan',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_coordinates (latitude, longitude),
    INDEX idx_severity (severity),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Daftar lokasi yang diblacklist karena mencurigakan';

-- Tabel untuk konfigurasi keamanan
CREATE TABLE IF NOT EXISTS security_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description VARCHAR(255),
    data_type ENUM('string', 'integer', 'float', 'boolean', 'json') DEFAULT 'string',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_config_key (config_key),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Konfigurasi sistem keamanan';

-- Insert default security configurations
INSERT INTO security_config (config_key, config_value, description, data_type) VALUES
('min_confidence_level', '60', 'Minimum confidence level yang diizinkan untuk presensi', 'integer'),
('max_gps_accuracy_meter', '50', 'Maksimum akurasi GPS yang diizinkan (dalam meter)', 'integer'),
('max_speed_kmh', '120', 'Maksimum kecepatan yang realistis (km/jam)', 'integer'),
('mock_location_detection', 'true', 'Aktifkan deteksi mock location', 'boolean'),
('location_history_tracking', 'true', 'Aktifkan tracking riwayat lokasi', 'boolean'),
('auto_block_high_risk', 'true', 'Otomatis blokir presensi dengan risk level HIGH', 'boolean'),
('alert_admin_suspicious', 'true', 'Kirim alert ke admin untuk aktivitas mencurigakan', 'boolean'),
('retention_days', '90', 'Berapa hari data security log disimpan', 'integer')
ON DUPLICATE KEY UPDATE 
    config_value = VALUES(config_value),
    updated_at = CURRENT_TIMESTAMP;

-- View untuk laporan keamanan harian
CREATE OR REPLACE VIEW v_daily_security_report AS
SELECT 
    DATE(sl.created_at) as tanggal,
    COUNT(*) as total_aktivitas,
    COUNT(CASE WHEN sl.action_type = 'CHECKIN' THEN 1 END) as total_checkin,
    COUNT(CASE WHEN sl.action_type = 'CHECKOUT' THEN 1 END) as total_checkout,
    COUNT(CASE WHEN sl.risk_level = 'HIGH' THEN 1 END) as high_risk,
    COUNT(CASE WHEN sl.risk_level = 'MEDIUM' THEN 1 END) as medium_risk,
    COUNT(CASE WHEN sl.risk_level = 'LOW' THEN 1 END) as low_risk,
    AVG(sl.confidence_level) as avg_confidence,
    MIN(sl.confidence_level) as min_confidence,
    MAX(sl.confidence_level) as max_confidence,
    AVG(sl.gps_accuracy) as avg_gps_accuracy,
    COUNT(DISTINCT sl.id_pegawai) as unique_employees
FROM security_logs sl
GROUP BY DATE(sl.created_at)
ORDER BY tanggal DESC;

-- View untuk pegawai dengan aktivitas mencurigakan
CREATE OR REPLACE VIEW v_suspicious_employees AS
SELECT 
    sl.id_pegawai,
    p.nama_lengkap,
    COUNT(*) as total_aktivitas,
    COUNT(CASE WHEN sl.risk_level = 'HIGH' THEN 1 END) as high_risk_count,
    COUNT(CASE WHEN sl.risk_level = 'MEDIUM' THEN 1 END) as medium_risk_count,
    AVG(sl.confidence_level) as avg_confidence,
    MIN(sl.confidence_level) as min_confidence,
    MAX(sl.created_at) as last_activity,
    GROUP_CONCAT(DISTINCT sl.risk_level ORDER BY sl.created_at DESC LIMIT 5) as recent_risk_levels
FROM security_logs sl
LEFT JOIN pegawai p ON sl.id_pegawai = p.id
WHERE sl.created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY)
GROUP BY sl.id_pegawai, p.nama_lengkap
HAVING high_risk_count > 0 OR avg_confidence < 50
ORDER BY high_risk_count DESC, avg_confidence ASC;

-- Stored procedure untuk cleanup data lama
DELIMITER //
CREATE PROCEDURE CleanupSecurityLogs()
BEGIN
    DECLARE retention_days INT DEFAULT 90;
    
    -- Get retention period from config
    SELECT CAST(config_value AS UNSIGNED) INTO retention_days 
    FROM security_config 
    WHERE config_key = 'retention_days' AND is_active = TRUE
    LIMIT 1;
    
    -- Delete old security logs
    DELETE FROM security_logs 
    WHERE created_at < DATE_SUB(CURRENT_DATE, INTERVAL retention_days DAY);
    
    -- Delete old daily stats
    DELETE FROM security_daily_stats 
    WHERE tanggal < DATE_SUB(CURRENT_DATE, INTERVAL retention_days DAY);
    
    SELECT CONCAT('Cleanup completed. Retention period: ', retention_days, ' days') as result;
END //
DELIMITER ;

-- Event untuk otomatis cleanup (optional, requires event scheduler)
-- CREATE EVENT IF NOT EXISTS cleanup_security_logs
-- ON SCHEDULE EVERY 1 WEEK
-- STARTS CURRENT_TIMESTAMP
-- DO CALL CleanupSecurityLogs(); 