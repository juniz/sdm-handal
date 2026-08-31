-- Migration: alter_pelaporan_perilaku_add_evidence_and_urgency.sql
-- Description: Add tingkat_urgensi, bukti_lampiran, and tingkat_kerahasiaan to pelaporan_perilaku_tidak_diinginkan table
-- Date: 2026-08-26

ALTER TABLE `pelaporan_perilaku_tidak_diinginkan`
ADD COLUMN `tingkat_urgensi` ENUM('Rendah', 'Sedang', 'Tinggi', 'Kritis') NOT NULL DEFAULT 'Sedang' AFTER `jenis_perilaku`,
ADD COLUMN `bukti_lampiran` TEXT NULL AFTER `kronologi`,
ADD COLUMN `tingkat_kerahasiaan` ENUM('Standar', 'Sangat Rahasia') NOT NULL DEFAULT 'Standar' AFTER `status`;

CREATE INDEX `idx_urgensi` ON `pelaporan_perilaku_tidak_diinginkan` (`tingkat_urgensi`);
