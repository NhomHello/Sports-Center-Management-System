-- Flow 1 additions and Flow 2-4 entities generated from Prisma schema diff.
-- Existing memberships/invoices/notifications are preserved; referenced data is not hard-deleted.

-- DropForeignKey
ALTER TABLE `notifications` DROP FOREIGN KEY `notifications_membership_id_fkey`;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `check_in_code` VARCHAR(40) NULL,
    MODIFY `email` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `refund_reason` VARCHAR(500) NULL,
    ADD COLUMN `refund_reference` VARCHAR(100) NULL,
    ADD COLUMN `refunded_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `dedupe_key` VARCHAR(191) NULL,
    MODIFY `membership_id` INTEGER NULL,
    MODIFY `kind` ENUM('MEMBERSHIP_EXPIRY_REMINDER', 'CLASS_CHANGED', 'CLASS_CANCELLED', 'TRAINING_PLAN_PUBLISHED', 'TRAINING_RESULT_CREATED') NOT NULL;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `token_hash` VARCHAR(64) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `password_reset_tokens_user_id_expires_at_idx`(`user_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `subjects_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `rooms` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `capacity` INTEGER NOT NULL,
    `description` VARCHAR(500) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `rooms_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `gym_classes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `description` VARCHAR(1000) NULL,
    `subject_id` INTEGER NOT NULL,
    `room_id` INTEGER NOT NULL,
    `coach_id` INTEGER NOT NULL,
    `capacity` INTEGER NOT NULL,
    `starts_on` DATE NOT NULL,
    `ends_on` DATE NOT NULL,
    `weekly_schedule` JSON NOT NULL,
    `registration_start_at` DATETIME(3) NOT NULL,
    `registration_end_at` DATETIME(3) NOT NULL,
    `status` ENUM('OPEN', 'CLOSED', 'CANCELLED') NOT NULL DEFAULT 'OPEN',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `gym_classes_subject_id_status_idx`(`subject_id`, `status`),
    INDEX `gym_classes_coach_id_status_idx`(`coach_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `class_sessions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `class_id` INTEGER NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `status` ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'SCHEDULED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `class_sessions_start_at_end_at_status_idx`(`start_at`, `end_at`, `status`),
    INDEX `class_sessions_class_id_start_at_idx`(`class_id`, `start_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `enrollments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `status` ENUM('BOOKED', 'CANCELLED') NOT NULL DEFAULT 'BOOKED',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `enrollments_user_id_status_idx`(`user_id`, `status`),
    UNIQUE INDEX `enrollments_session_id_user_id_key`(`session_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `attendances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `enrollment_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `marked_by_id` INTEGER NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE') NOT NULL,
    `note` VARCHAR(500) NULL,
    `marked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `attendances_enrollment_id_key`(`enrollment_id`),
    INDEX `attendances_session_id_status_idx`(`session_id`, `status`),
    INDEX `attendances_member_id_marked_at_idx`(`member_id`, `marked_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `check_ins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NOT NULL,
    `session_id` INTEGER NULL,
    `kind` ENUM('GENERAL', 'CLASS') NOT NULL,
    `code` VARCHAR(100) NOT NULL,
    `scanned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `check_ins_member_id_scanned_at_idx`(`member_id`, `scanned_at`),
    UNIQUE INDEX `check_ins_member_id_session_id_key`(`member_id`, `session_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NOT NULL,
    `provider` ENUM('COUNTER', 'MANUAL', 'SEPAY', 'SIMULATOR') NOT NULL,
    `provider_transaction_id` VARCHAR(100) NULL,
    `requested_amount` INTEGER NOT NULL,
    `received_amount` INTEGER NOT NULL,
    `reference` VARCHAR(100) NULL,
    `paid_at` DATETIME(3) NOT NULL,
    `actor_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `payments_provider_transaction_id_key`(`provider_transaction_id`),
    INDEX `payments_invoice_id_paid_at_idx`(`invoice_id`, `paid_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `payment_webhook_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `provider_transaction_id` VARCHAR(100) NULL,
    `invoice_code` VARCHAR(50) NULL,
    `transfer_type` VARCHAR(20) NULL,
    `transfer_amount` INTEGER NULL,
    `status` ENUM('PROCESSED', 'NEEDS_REVIEW', 'IGNORED', 'DUPLICATE', 'RESOLVED') NOT NULL,
    `reason` VARCHAR(255) NULL,
    `payload` JSON NOT NULL,
    `invoice_id` INTEGER NULL,
    `reviewed_by_id` INTEGER NULL,
    `reviewed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `payment_webhook_logs_provider_transaction_id_key`(`provider_transaction_id`),
    INDEX `payment_webhook_logs_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `training_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NOT NULL,
    `coach_id` INTEGER NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `notes` VARCHAR(1000) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'COMPLETED') NOT NULL DEFAULT 'DRAFT',
    `published_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `training_plans_member_id_status_idx`(`member_id`, `status`),
    INDEX `training_plans_coach_id_status_idx`(`coach_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `training_exercises` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `plan_id` INTEGER NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `sets` INTEGER NOT NULL,
    `repetitions` VARCHAR(50) NOT NULL,
    `load` VARCHAR(50) NULL,
    `notes` VARCHAR(500) NULL,
    `order` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `training_exercises_plan_id_order_idx`(`plan_id`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `exercise_completions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `exercise_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `exercise_completions_exercise_id_member_id_key`(`exercise_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `training_results` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `member_id` INTEGER NOT NULL,
    `coach_id` INTEGER NOT NULL,
    `session_id` INTEGER NULL,
    `plan_id` INTEGER NULL,
    `effort` INTEGER NULL,
    `comment` VARCHAR(1000) NOT NULL,
    `guidance` VARCHAR(1000) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `training_results_member_id_created_at_idx`(`member_id`, `created_at`),
    INDEX `training_results_coach_id_created_at_idx`(`coach_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `users_check_in_code_key` ON `users`(`check_in_code`);
CREATE UNIQUE INDEX `notifications_dedupe_key_key` ON `notifications`(`dedupe_key`);

ALTER TABLE `notifications` ADD CONSTRAINT `notifications_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `gym_classes` ADD CONSTRAINT `gym_classes_subject_id_fkey` FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `gym_classes` ADD CONSTRAINT `gym_classes_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `gym_classes` ADD CONSTRAINT `gym_classes_coach_id_fkey` FOREIGN KEY (`coach_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `class_sessions` ADD CONSTRAINT `class_sessions_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `gym_classes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_enrollment_id_fkey` FOREIGN KEY (`enrollment_id`) REFERENCES `enrollments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_marked_by_id_fkey` FOREIGN KEY (`marked_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `check_ins` ADD CONSTRAINT `check_ins_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `check_ins` ADD CONSTRAINT `check_ins_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `check_ins` ADD CONSTRAINT `check_ins_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `payments` ADD CONSTRAINT `payments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `payment_webhook_logs` ADD CONSTRAINT `payment_webhook_logs_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `training_plans` ADD CONSTRAINT `training_plans_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `training_plans` ADD CONSTRAINT `training_plans_coach_id_fkey` FOREIGN KEY (`coach_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `training_exercises` ADD CONSTRAINT `training_exercises_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `training_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `exercise_completions` ADD CONSTRAINT `exercise_completions_exercise_id_fkey` FOREIGN KEY (`exercise_id`) REFERENCES `training_exercises`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `exercise_completions` ADD CONSTRAINT `exercise_completions_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `training_results` ADD CONSTRAINT `training_results_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `training_results` ADD CONSTRAINT `training_results_coach_id_fkey` FOREIGN KEY (`coach_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `training_results` ADD CONSTRAINT `training_results_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `training_results` ADD CONSTRAINT `training_results_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `training_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
