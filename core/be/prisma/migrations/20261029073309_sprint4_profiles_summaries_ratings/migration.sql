-- AlterTable
ALTER TABLE `gym_classes` MODIFY `status` ENUM('COMPLETED', 'OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN';

-- CreateTable
CREATE TABLE `coach_profiles` (
    `user_id` INTEGER NOT NULL,
    `bio` TEXT NOT NULL DEFAULT (''),
    `experience_years` INTEGER NOT NULL DEFAULT 0,
    `certifications` JSON NULL,
    `public_email` VARCHAR(191) NULL,
    `public_phone` VARCHAR(20) NULL,
    `zalo` VARCHAR(20) NULL,
    `show_contact` BOOLEAN NOT NULL DEFAULT false,
    `avatar_data` MEDIUMBLOB NULL,
    `avatar_mime` VARCHAR(30) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `member_profiles` (
    `user_id` INTEGER NOT NULL,
    `birth_date` DATE NULL,
    `gender` VARCHAR(20) NULL,
    `height_cm` DOUBLE NULL,
    `weight_kg` DOUBLE NULL,
    `goals` TEXT NOT NULL DEFAULT (''),
    `level` VARCHAR(20) NOT NULL DEFAULT 'BEGINNER',
    `health_notes` TEXT NOT NULL DEFAULT (''),
    `emergency_name` VARCHAR(100) NULL,
    `emergency_phone` VARCHAR(20) NULL,
    `share_with_coach` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_summaries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `class_id` INTEGER NOT NULL,
    `coach_id` INTEGER NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED') NOT NULL DEFAULT 'DRAFT',
    `deadline_at` DATETIME(3) NOT NULL,
    `published_at` DATETIME(3) NULL,
    `revision` INTEGER NOT NULL DEFAULT 0,
    `reopened_reason` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `course_summaries_class_id_key`(`class_id`),
    INDEX `course_summaries_status_deadline_at_idx`(`status`, `deadline_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_summary_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `summary_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `result` ENUM('PASS', 'NOT_PASSED') NULL,
    `progress` INTEGER NULL,
    `comment` TEXT NOT NULL DEFAULT (''),
    `next_course` TEXT NOT NULL DEFAULT (''),
    `attendance_snapshot` JSON NULL,
    `lookup_code` VARCHAR(40) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `course_summary_items_lookup_code_key`(`lookup_code`),
    INDEX `course_summary_items_member_id_idx`(`member_id`),
    UNIQUE INDEX `course_summary_items_summary_id_member_id_key`(`summary_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `course_ratings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `class_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `coach_id` INTEGER NOT NULL,
    `course_stars` INTEGER NOT NULL,
    `coach_stars` INTEGER NOT NULL,
    `comment` TEXT NOT NULL DEFAULT (''),
    `hidden_at` DATETIME(3) NULL,
    `hidden_by_id` INTEGER NULL,
    `hidden_reason` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `course_ratings_coach_id_hidden_at_created_at_idx`(`coach_id`, `hidden_at`, `created_at`),
    UNIQUE INDEX `course_ratings_class_id_member_id_key`(`class_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `coach_profiles` ADD CONSTRAINT `coach_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `member_profiles` ADD CONSTRAINT `member_profiles_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_summaries` ADD CONSTRAINT `course_summaries_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `gym_classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_summaries` ADD CONSTRAINT `course_summaries_coach_id_fkey` FOREIGN KEY (`coach_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_summary_items` ADD CONSTRAINT `course_summary_items_summary_id_fkey` FOREIGN KEY (`summary_id`) REFERENCES `course_summaries`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_summary_items` ADD CONSTRAINT `course_summary_items_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_ratings` ADD CONSTRAINT `course_ratings_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `gym_classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_ratings` ADD CONSTRAINT `course_ratings_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `course_ratings` ADD CONSTRAINT `course_ratings_coach_id_fkey` FOREIGN KEY (`coach_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
