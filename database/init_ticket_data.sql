-- Script untuk menginisialisasi data master ticket IT Support

-- Insert data kategori masalah
INSERT INTO categories_ticket (category_name) VALUES
('Hardware'),
('Software'),
('Network'),
('Printer'),
('Email'),
('Database'),
('Security'),
('Backup'),
('Other');

-- Insert data prioritas
INSERT INTO priorities_ticket (priority_name, priority_level) VALUES
('Low', 1),
('Medium', 2),
('High', 3),
('Critical', 4);

-- Insert data status
INSERT INTO statuses_ticket (status_name) VALUES
('Open'),
('In Progress'),
('Resolved'),
('Closed');

-- Contoh data ticket (opsional)
-- INSERT INTO tickets (user_id, departemen_id, category_id, priority_id, title, description, current_status_id) VALUES
-- ('12345', 'A', 1, 2, 'Komputer tidak bisa menyala', 'Komputer di ruang administrasi tidak bisa menyala sama sekali. Sudah dicoba tekan tombol power berkali-kali tapi tidak ada respon.', 1),
-- ('67890', 'B', 3, 3, 'Internet lambat', 'Koneksi internet di ruang IT sangat lambat, loading website membutuhkan waktu lama.', 1),
-- ('11111', 'C', 2, 1, 'Microsoft Word error', 'Aplikasi Microsoft Word sering crash ketika membuka dokumen besar.', 2); 