-- Tabel untuk menyimpan error logs
CREATE TABLE IF NOT EXISTS error_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) DEFAULT NULL,
    user_name VARCHAR(100) DEFAULT NULL,
    error_type VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT DEFAULT NULL,
    page_url VARCHAR(500) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    browser_info JSON DEFAULT NULL,
    device_info JSON DEFAULT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    severity ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') DEFAULT 'MEDIUM',
    status ENUM('NEW', 'REVIEWED', 'RESOLVED', 'IGNORED') DEFAULT 'NEW',
    component_name VARCHAR(100) DEFAULT NULL,
    action_attempted VARCHAR(200) DEFAULT NULL,
    additional_data JSON DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    session_id VARCHAR(100) DEFAULT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_severity (severity),
    INDEX idx_status (status),
    INDEX idx_error_type (error_type)
);

-- Tabel untuk tracking error resolution
CREATE TABLE IF NOT EXISTS error_resolutions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    error_log_id INT NOT NULL,
    admin_id VARCHAR(50) NOT NULL,
    admin_name VARCHAR(100) NOT NULL,
    resolution_notes TEXT NOT NULL,
    resolution_type ENUM('FIXED', 'WORKAROUND', 'WONT_FIX', 'DUPLICATE') NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (error_log_id) REFERENCES error_logs(id) ON DELETE CASCADE
);

-- Insert contoh data
INSERT INTO error_logs (
    user_id, user_name, error_type, error_message, page_url, 
    severity, component_name, action_attempted
) VALUES 
('P001', 'John Doe', 'CameraError', 'Gagal mengakses kamera', '/dashboard/attendance', 'HIGH', 'AttendanceCamera', 'Taking photo for attendance'),
('P002', 'Jane Smith', 'LocationError', 'GPS tidak akurat', '/dashboard/attendance', 'MEDIUM', 'LocationVerification', 'Verifying location'),
('P003', 'Bob Wilson', 'ApiError', 'Network timeout', '/dashboard/attendance', 'CRITICAL', 'API', 'Submitting attendance data'); 