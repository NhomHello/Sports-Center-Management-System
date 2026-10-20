-- Góp ý giảng viên 20/10/2026 – GĐ1 lịch học: khung giờ hoạt động, loại phòng (chức năng + bộ môn),
-- chuyên môn huấn luyện viên. Viết tay: CHỈ THÊM bảng/cột, không DROP bảng legacy Sprint 1.

-- AlterTable
ALTER TABLE `rooms` ADD COLUMN `room_type_id` INTEGER NULL;

CREATE TABLE `room_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `is_self_training_area` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `room_types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_type_subjects` (
    `room_type_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,

    INDEX `room_type_subjects_subject_id_idx`(`subject_id`),
    PRIMARY KEY (`room_type_id`, `subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coach_subjects` (
    `coach_id` INTEGER NOT NULL,
    `subject_id` INTEGER NOT NULL,

    INDEX `coach_subjects_subject_id_idx`(`subject_id`),
    PRIMARY KEY (`coach_id`, `subject_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operating_frames` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `start_time` VARCHAR(5) NOT NULL,
    `end_time` VARCHAR(5) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `operating_frames_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `rooms_room_type_id_idx` ON `rooms`(`room_type_id`);

-- AddForeignKey

-- AddForeignKey
ALTER TABLE `rooms` ADD CONSTRAINT `rooms_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `room_type_subjects` ADD CONSTRAINT `room_type_subjects_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `room_type_subjects` ADD CONSTRAINT `room_type_subjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `coach_subjects` ADD CONSTRAINT `coach_subjects_coach_id_fkey` FOREIGN KEY (`coach_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `coach_subjects` ADD CONSTRAINT `coach_subjects_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Dữ liệu: khung giờ mặc định (giờ Việt Nam).
INSERT INTO `operating_frames` (`name`, `start_time`, `end_time`, `sort_order`, `is_active`, `updated_at`) VALUES
  ('Sáng sớm', '05:00', '09:00', 1, true, CURRENT_TIMESTAMP(3)),
  ('Sáng', '09:00', '13:00', 2, true, CURRENT_TIMESTAMP(3)),
  ('Chiều', '13:00', '17:00', 3, true, CURRENT_TIMESTAMP(3)),
  ('Tối', '17:00', '22:00', 4, true, CURRENT_TIMESTAMP(3));

-- Dữ liệu: phòng cũ chưa phân loại vẫn xếp lớp được như trước nhờ loại "Đa năng" hỗ trợ mọi bộ môn hiện có.
INSERT INTO `room_types` (`name`, `description`, `is_self_training_area`, `is_active`, `updated_at`)
SELECT 'Đa năng', 'Loại phòng mặc định cho phòng tạo trước khi có phân loại', true, true, CURRENT_TIMESTAMP(3)
FROM DUAL WHERE EXISTS (SELECT 1 FROM `rooms`);
INSERT INTO `room_type_subjects` (`room_type_id`, `subject_id`)
SELECT rt.`id`, s.`id` FROM `room_types` rt CROSS JOIN `subjects` s WHERE rt.`name` = 'Đa năng';
UPDATE `rooms` r JOIN `room_types` rt ON rt.`name` = 'Đa năng' SET r.`room_type_id` = rt.`id` WHERE r.`room_type_id` IS NULL;

-- Dữ liệu: HLV giữ chuyên môn theo các bộ môn đang/đã dạy.
INSERT IGNORE INTO `coach_subjects` (`coach_id`, `subject_id`)
SELECT DISTINCT g.`coach_id`, g.`subject_id` FROM `gym_classes` g;
