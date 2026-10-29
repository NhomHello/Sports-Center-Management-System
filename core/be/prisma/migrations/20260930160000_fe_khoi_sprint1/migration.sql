-- Các bảng nghiệp vụ đã được tạo bởi migration Flow 1 trong handover.
-- Chỉ bổ sung cột/index; không xóa dữ liệu hoặc các bảng của flow khác.
ALTER TABLE `users` ADD COLUMN `token_version` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `invoices`
  ADD COLUMN `plan_name` VARCHAR(100) NULL,
  ADD COLUMN `duration_days` INTEGER NULL;

ALTER TABLE `memberships` ADD COLUMN `active_user_id` INTEGER NULL;

-- Membership lịch sử không có active_user_id; chỉ đánh dấu gói còn hiệu lực.
UPDATE `memberships` SET `active_user_id` = `user_id`
WHERE `status` = 'ACTIVE' AND `end_date` > UTC_TIMESTAMP(3);

CREATE UNIQUE INDEX `memberships_active_user_id_key` ON `memberships` (`active_user_id`);
