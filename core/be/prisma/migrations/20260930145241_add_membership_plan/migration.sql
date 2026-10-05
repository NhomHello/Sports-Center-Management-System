-- Bảng đã được tạo bởi migration Flow 1 dùng chung.
ALTER TABLE `membership_plans`
  ADD COLUMN `description` VARCHAR(500) NULL,
  ADD COLUMN `status` ENUM('SELLING', 'STOPPED') NOT NULL DEFAULT 'SELLING';

CREATE UNIQUE INDEX `membership_plans_name_key` ON `membership_plans`(`name`);
CREATE INDEX `membership_plans_status_idx` ON `membership_plans`(`status`);
