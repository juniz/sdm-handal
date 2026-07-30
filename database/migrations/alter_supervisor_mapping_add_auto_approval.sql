ALTER TABLE `supervisor_mapping`
  ADD COLUMN `is_auto_approve` TINYINT(1) NOT NULL DEFAULT 0 AFTER `is_aktif`,
  ADD COLUMN `auto_approve_days` INT NULL DEFAULT 3 AFTER `is_auto_approve`;
