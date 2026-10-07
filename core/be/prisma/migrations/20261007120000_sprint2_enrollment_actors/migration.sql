-- Ghi nhan nhan vien dat/huy ho (UC-CB-09/10) va thoi diem huy.
ALTER TABLE `enrollments`
    ADD COLUMN `enrolled_by` INTEGER NULL,
    ADD COLUMN `cancelled_by` INTEGER NULL,
    ADD COLUMN `cancelled_at` DATETIME(3) NULL;

ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_enrolled_by_fkey` FOREIGN KEY (`enrolled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_cancelled_by_fkey` FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
