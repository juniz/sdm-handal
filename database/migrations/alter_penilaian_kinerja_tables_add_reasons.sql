-- Alter tables to add reasons for late attendance and unfinished activities
ALTER TABLE `penilaian_harian` ADD COLUMN `alasan_terlambat` text DEFAULT NULL AFTER `catatan_supervisor`;
ALTER TABLE `kegiatan_harian` ADD COLUMN `alasan_belum_selesai` text DEFAULT NULL AFTER `status_selesai`;
