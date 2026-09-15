CREATE TABLE IF NOT EXISTS `user_notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nik` VARCHAR(30) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `url` VARCHAR(255) DEFAULT NULL,
  `type` VARCHAR(50) DEFAULT 'system',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_notif_nik_read` (`nik`, `is_read`),
  INDEX `idx_user_notif_nik_created` (`nik`, `created_at`),
  INDEX `idx_user_notif_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
