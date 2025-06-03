-- Script untuk menambahkan kolom no_ticket ke tabel tickets
-- Jalankan script ini jika kolom no_ticket belum ada

-- Tambahkan kolom no_ticket
ALTER TABLE tickets 
ADD COLUMN no_ticket VARCHAR(20) UNIQUE AFTER ticket_id;

-- Buat index untuk performa pencarian
CREATE INDEX idx_no_ticket ON tickets(no_ticket);

-- Update data existing dengan nomor ticket sementara (opsional)
-- Hanya jalankan jika ada data existing yang perlu diupdate
UPDATE tickets 
SET no_ticket = CONCAT('TKT-', DATE_FORMAT(submission_date, '%Y%m%d'), '-', LPAD(ticket_id, 4, '0'))
WHERE no_ticket IS NULL;

-- Verifikasi hasil
SELECT ticket_id, no_ticket, title, submission_date 
FROM tickets 
ORDER BY submission_date DESC 
LIMIT 10; 