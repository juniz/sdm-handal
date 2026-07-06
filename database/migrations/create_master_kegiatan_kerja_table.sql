-- Create master_kegiatan_kerja table with compatible charset for foreign key
CREATE TABLE IF NOT EXISTS `master_kegiatan_kerja` (
  `id`             int NOT NULL AUTO_INCREMENT,
  `dep_id`         char(4) CHARACTER SET latin1 DEFAULT NULL,
  `nama_kegiatan`  varchar(200) NOT NULL,
  `deskripsi`      text DEFAULT NULL,
  `is_aktif`       tinyint(1) NOT NULL DEFAULT 1,
  `created_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`     timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dep_id` (`dep_id`),
  CONSTRAINT `fk_mkk_departemen` FOREIGN KEY (`dep_id`) REFERENCES `departemen` (`dep_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
