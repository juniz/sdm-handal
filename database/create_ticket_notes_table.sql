-- Tabel untuk menyimpan notes/catatan ticket
CREATE TABLE IF NOT EXISTS ticket_notes (
    note_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    note TEXT NOT NULL,
    note_type ENUM('status_update', 'general', 'assignment', 'resolution') DEFAULT 'general',
    created_by VARCHAR(50) NOT NULL,
    created_date DATETIME NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES pegawai(nik) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_ticket_notes_ticket_id (ticket_id),
    INDEX idx_ticket_notes_created_by (created_by),
    INDEX idx_ticket_notes_created_date (created_date),
    INDEX idx_ticket_notes_note_type (note_type)
);

-- Tabel untuk menyimpan history perubahan status
CREATE TABLE IF NOT EXISTS status_history_ticket (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id INT NOT NULL,
    old_status INT,
    new_status INT NOT NULL,
    changed_by VARCHAR(50) NOT NULL,
    change_date DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    FOREIGN KEY (old_status) REFERENCES statuses_ticket(status_id) ON DELETE SET NULL,
    FOREIGN KEY (new_status) REFERENCES statuses_ticket(status_id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES pegawai(nik) ON DELETE CASCADE,
    
    -- Indexes
    INDEX idx_status_history_ticket_id (ticket_id),
    INDEX idx_status_history_changed_by (changed_by),
    INDEX idx_status_history_change_date (change_date),
    INDEX idx_status_history_new_status (new_status)
); 