-- Script untuk membuat tabel assignments_ticket
-- Tabel ini digunakan untuk menyimpan penugasan ticket ke pegawai IT

CREATE TABLE IF NOT EXISTS assignments_ticket (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    assigned_to VARCHAR(20) NOT NULL, -- NIK pegawai IT yang ditugaskan
    assigned_by VARCHAR(20) NOT NULL, -- NIK user IT yang menugaskan
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Tanggal penugasan
    released_date TIMESTAMP NULL, -- Tanggal pelepasan assignment
    is_read BOOLEAN DEFAULT FALSE, -- Status notifikasi sudah dibaca
    
    -- Foreign keys
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES pegawai(nik) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES pegawai(nik) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_ticket_id (ticket_id),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_assigned_by (assigned_by),
    INDEX idx_assigned_date (assigned_date),
    INDEX idx_is_read (is_read)
);

-- Tambahkan kolom assigned_to ke tabel tickets untuk referensi cepat
ALTER TABLE tickets 
ADD COLUMN assigned_to VARCHAR(20) NULL AFTER current_status_id,
ADD FOREIGN KEY (assigned_to) REFERENCES pegawai(nik) ON DELETE SET NULL;

-- Buat index untuk kolom assigned_to
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);

-- Insert data status assignment baru ke statuses_ticket
INSERT INTO statuses_ticket (status_name, status_description) VALUES
('Assigned', 'Ticket telah ditugaskan ke pegawai IT'),
('In Progress', 'Ticket sedang dikerjakan oleh pegawai IT'),
('Pending Review', 'Ticket menunggu review dari user')
ON DUPLICATE KEY UPDATE status_description = VALUES(status_description);

-- Jika tabel sudah ada, tambahkan kolom is_read
ALTER TABLE assignments_ticket 
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE,
ADD INDEX IF NOT EXISTS idx_is_read (is_read);

-- Verifikasi struktur tabel
DESCRIBE assignments_ticket;
DESCRIBE tickets; 