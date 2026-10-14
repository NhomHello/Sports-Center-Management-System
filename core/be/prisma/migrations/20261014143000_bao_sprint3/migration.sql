-- AlterTable
ALTER TABLE `users` ADD COLUMN `booking_blocked_until` DATETIME(3) NULL,
    ADD COLUMN `no_show_waived_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `notifications` MODIFY `kind` ENUM('MEMBERSHIP_EXPIRY_REMINDER', 'MEMBERSHIP_EXPIRED', 'MEMBERSHIP_FROZEN', 'WAITLIST_OFFER', 'ACCOUNT_LOCKED', 'BOOKING_BLOCKED', 'CLASS_CHANGED', 'CLASS_CANCELLED', 'TRAINING_PLAN_PUBLISHED', 'TRAINING_RESULT_CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_TOPUP_REQUIRED', 'PAYMENT_REVIEW_ALERT', 'PAYMENT_REFUND', 'PAYMENT_CLAIM_REJECTED', 'INVOICE_EXPIRED') NOT NULL;

-- AlterTable
ALTER TABLE `class_sessions` ADD COLUMN `attendance_unlocked_until` DATETIME(3) NULL,
    ADD COLUMN `coach_id` INTEGER NULL,
    ADD COLUMN `rescheduled_at` DATETIME(3) NULL,
    ADD COLUMN `room_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `class_events` MODIFY `kind` ENUM('MEMBERSHIP_EXPIRY_REMINDER', 'MEMBERSHIP_EXPIRED', 'MEMBERSHIP_FROZEN', 'WAITLIST_OFFER', 'ACCOUNT_LOCKED', 'BOOKING_BLOCKED', 'CLASS_CHANGED', 'CLASS_CANCELLED', 'TRAINING_PLAN_PUBLISHED', 'TRAINING_RESULT_CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_TOPUP_REQUIRED', 'PAYMENT_REVIEW_ALERT', 'PAYMENT_REFUND', 'PAYMENT_CLAIM_REJECTED', 'INVOICE_EXPIRED') NOT NULL;

-- CreateTable
CREATE TABLE `membership_freezes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `membership_id` INTEGER NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `ended_at` DATETIME(3) NULL,
    `credited_days` INTEGER NULL,
    `actor_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `membership_freezes_membership_id_ended_at_idx`(`membership_id`, `ended_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
ALTER TABLE `check_ins` ADD COLUMN `warning` VARCHAR(500) NULL;

-- CreateTable
CREATE TABLE `attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `actor_id` INTEGER NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `attendance_member_id_status_idx`(`member_id`, `status`),
    UNIQUE INDEX `attendance_session_id_member_id_key`(`session_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class_waitlist` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `class_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `status` ENUM('WAITING', 'OFFERED', 'ACCEPTED', 'EXPIRED', 'CANCELLED') NOT NULL DEFAULT 'WAITING',
    `offered_until` DATETIME(3) NULL,
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `class_waitlist_class_id_status_joined_at_idx`(`class_id`, `status`, `joined_at`),
    UNIQUE INDEX `class_waitlist_class_id_member_id_key`(`class_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `room_maintenance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `room_id` INTEGER NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NOT NULL,
    `reason` VARCHAR(500) NOT NULL,
    `actor_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `room_maintenance_room_id_start_at_end_at_idx`(`room_id`, `start_at`, `end_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `class_sessions` ADD CONSTRAINT `class_sessions_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_sessions` ADD CONSTRAINT `class_sessions_coach_id_fkey` FOREIGN KEY (`coach_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `membership_freezes` ADD CONSTRAINT `membership_freezes_membership_id_fkey` FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `attendance` ADD CONSTRAINT `attendance_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_waitlist` ADD CONSTRAINT `class_waitlist_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `gym_classes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_waitlist` ADD CONSTRAINT `class_waitlist_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `room_maintenance` ADD CONSTRAINT `room_maintenance_room_id_fkey` FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

UPDATE class_sessions s JOIN gym_classes c ON c.id = s.class_id SET s.coach_id = c.coach_id, s.room_id = c.room_id;