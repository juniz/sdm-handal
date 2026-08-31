-- Migration: create_pelaporan_perilaku_table.sql
-- Description: Create table for Pelaporan Perilaku yang Tidak Diinginkan (Misconduct Incident & Whistleblower)
-- Date: 2026-08-21

CREATE TABLE IF NOT EXISTS `pelaporan_perilaku_tidak_diinginkan` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `tanggal` DATE NOT NULL,
    `nama_pelaku` VARCHAR(255) NOT NULL,
    `nik_pelaku` VARCHAR(30) NULL,
    `unit_kerja` VARCHAR(150) NOT NULL,
    `jenis_perilaku` ENUM(
        'Pelecehan Seksual',
        'Pelecehan Verbal',
        'Perundungan / Bullying',
        'Kekerasan Fisik',
        'Diskriminasi',
        'Penyalahgunaan Wewenang',
        'Pelanggaran Disiplin & Etika',
        'Lainnya'
    ) NOT NULL,
    `korban` VARCHAR(255) NOT NULL,
    `nik_korban` VARCHAR(30) NULL,
    `kronologi` TEXT NOT NULL,
    `pelapor` VARCHAR(255) NOT NULL,
    `nik_pelapor` VARCHAR(30) NOT NULL,
    `status` ENUM(
        'Menunggu Review',
        'Sedang Diinvestigasi',
        'Selesai',
        'Ditolak'
    ) NOT NULL DEFAULT 'Menunggu Review',
    `catatan_tindak_lanjut` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX `idx_tanggal` (`tanggal`),
    INDEX `idx_nik_pelapor` (`nik_pelapor`),
    INDEX `idx_status` (`status`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Register menu in sdm_menu if table exists
INSERT INTO `sdm_menu` (`group_label`, `group_order`, `label`, `href`, `icon_name`, `item_order`, `is_public`, `access_type`, `is_active`)
SELECT 'Layanan Pegawai', 2, 'Pelaporan Perilaku', '/dashboard/pelaporan-perilaku', 'ShieldAlert', 6, 1, 'public', 1
WHERE NOT EXISTS (
    SELECT 1 FROM `sdm_menu` WHERE `href` = '/dashboard/pelaporan-perilaku'
);
