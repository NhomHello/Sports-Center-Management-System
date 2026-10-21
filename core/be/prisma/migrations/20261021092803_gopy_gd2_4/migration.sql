/*
  Warnings:

  - A unique constraint covering the columns `[invoice_id]` on the table `memberships` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `class_enrollments` DROP FOREIGN KEY `class_enrollments_cancelled_by_fkey`;

-- DropForeignKey
ALTER TABLE `class_enrollments` DROP FOREIGN KEY `class_enrollments_class_id_fkey`;

-- DropForeignKey
ALTER TABLE `class_enrollments` DROP FOREIGN KEY `class_enrollments_enrolled_by_fkey`;

-- DropForeignKey
ALTER TABLE `class_enrollments` DROP FOREIGN KEY `class_enrollments_member_id_fkey`;

-- DropForeignKey
ALTER TABLE `class_events` DROP FOREIGN KEY `class_events_class_id_fkey`;

-- DropForeignKey
ALTER TABLE `invoices` DROP FOREIGN KEY `invoices_plan_id_fkey`;

-- AlterTable
ALTER TABLE `attendance` ADD COLUMN `excused_at` DATETIME(3) NULL,
    MODIFY `status` ENUM('PRESENT', 'ABSENT', 'EXCUSED') NOT NULL;

-- AlterTable
ALTER TABLE `class_enrollments` ADD COLUMN `hold_expires_at` DATETIME(3) NULL,
    ADD COLUMN `invoice_id` INTEGER NULL,
    MODIFY `status` ENUM('BOOKED', 'CANCELLED', 'PENDING_PAYMENT') NOT NULL DEFAULT 'BOOKED';

-- AlterTable
ALTER TABLE `gym_classes` ADD COLUMN `price` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `change_id` INTEGER NULL,
    ADD COLUMN `class_id` INTEGER NULL,
    ADD COLUMN `kind` ENUM('MEMBERSHIP', 'COURSE', 'ADJUSTMENT') NOT NULL DEFAULT 'MEMBERSHIP',
    ADD COLUMN `session_count` INTEGER NULL,
    ADD COLUMN `total_sessions` INTEGER NULL,
    MODIFY `plan_id` INTEGER NULL,
    MODIFY `channel` ENUM('ONLINE', 'COUNTER') NOT NULL DEFAULT 'COUNTER';

-- AlterTable
ALTER TABLE `memberships` ADD COLUMN `cancelled_at` DATETIME(3) NULL,
    ADD COLUMN `invoice_id` INTEGER NULL,
    MODIFY `status` ENUM('ACTIVE', 'EXPIRED', 'FROZEN', 'CANCELLED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `payments` MODIFY `provider` ENUM('COUNTER', 'MANUAL', 'SEPAY', 'SIMULATOR', 'CREDIT') NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `credit_balance` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `plan_frames` (
    `plan_id` INTEGER NOT NULL,
    `frame_id` INTEGER NOT NULL,

    PRIMARY KEY (`plan_id`, `frame_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `plan_room_types` (
    `plan_id` INTEGER NOT NULL,
    `room_type_id` INTEGER NOT NULL,

    PRIMARY KEY (`plan_id`, `room_type_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `amount` INTEGER NOT NULL,
    `balance_after` INTEGER NOT NULL,
    `reason` ENUM('CANCELLATION', 'CHANGE', 'PAYMENT', 'ADJUSTMENT') NOT NULL,
    `invoice_id` INTEGER NULL,
    `change_id` INTEGER NULL,
    `note` VARCHAR(500) NULL,
    `actor_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `credit_transactions_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_changes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `kind` ENUM('CANCEL_PLAN', 'CANCEL_COURSE', 'CHANGE_PLAN', 'CHANGE_CLASS') NOT NULL,
    `status` ENUM('PENDING_PAYMENT', 'DONE', 'CANCELLED') NOT NULL DEFAULT 'DONE',
    `user_id` INTEGER NOT NULL,
    `actor_id` INTEGER NOT NULL,
    `from_invoice_id` INTEGER NOT NULL,
    `from_membership_id` INTEGER NULL,
    `from_enrollment_id` INTEGER NULL,
    `to_plan_id` INTEGER NULL,
    `to_class_id` INTEGER NULL,
    `paid_amount` INTEGER NOT NULL,
    `remaining_value` INTEGER NOT NULL,
    `fee` INTEGER NOT NULL DEFAULT 0,
    `new_price` INTEGER NOT NULL DEFAULT 0,
    `difference` INTEGER NOT NULL DEFAULT 0,
    `settlement` ENUM('REFUND', 'CREDIT', 'NONE') NOT NULL DEFAULT 'NONE',
    `adjustment_invoice_id` INTEGER NULL,
    `refund_id` INTEGER NULL,
    `credit_transaction_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed_at` DATETIME(3) NULL,

    INDEX `purchase_changes_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- GY-00: Link existing memberships to their latest PAID invoice.
-- Use only invoices explicitly linked to a membership.
-- Preserve NULL when no eligible invoice exists.
UPDATE `memberships` AS m
SET m.`invoice_id` = (
    SELECT i.`id`
    FROM `invoices` AS i
    WHERE i.`membership_id` = m.`id`
      AND i.`user_id` = m.`user_id`
      AND i.`status` = 'PAID'
    ORDER BY i.`paid_at` DESC, i.`id` DESC
    LIMIT 1
)
WHERE m.`invoice_id` IS NULL;
-- CreateIndex
CREATE UNIQUE INDEX `memberships_invoice_id_key` ON `memberships`(`invoice_id`);

-- AddForeignKey
ALTER TABLE `memberships` ADD CONSTRAINT `memberships_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `membership_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invoices` ADD CONSTRAINT `invoices_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `gym_classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `gym_classes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_enrolled_by_fkey` FOREIGN KEY (`enrolled_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_cancelled_by_fkey` FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `class_enrollments` ADD CONSTRAINT `class_enrollments_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `class_events` ADD CONSTRAINT `class_events_class_id_fkey` FOREIGN KEY (`class_id`) REFERENCES `gym_classes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `plan_frames` ADD CONSTRAINT `plan_frames_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `membership_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_frames` ADD CONSTRAINT `plan_frames_frame_id_fkey` FOREIGN KEY (`frame_id`) REFERENCES `operating_frames`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_room_types` ADD CONSTRAINT `plan_room_types_plan_id_fkey` FOREIGN KEY (`plan_id`) REFERENCES `membership_plans`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `plan_room_types` ADD CONSTRAINT `plan_room_types_room_type_id_fkey` FOREIGN KEY (`room_type_id`) REFERENCES `room_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `credit_transactions` ADD CONSTRAINT `credit_transactions_change_id_fkey` FOREIGN KEY (`change_id`) REFERENCES `purchase_changes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_changes` ADD CONSTRAINT `purchase_changes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_changes` ADD CONSTRAINT `purchase_changes_actor_id_fkey` FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_changes` ADD CONSTRAINT `purchase_changes_from_invoice_id_fkey` FOREIGN KEY (`from_invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_changes` ADD CONSTRAINT `purchase_changes_from_membership_id_fkey` FOREIGN KEY (`from_membership_id`) REFERENCES `memberships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_changes` ADD CONSTRAINT `purchase_changes_from_enrollment_id_fkey` FOREIGN KEY (`from_enrollment_id`) REFERENCES `class_enrollments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_changes` ADD CONSTRAINT `purchase_changes_to_plan_id_fkey` FOREIGN KEY (`to_plan_id`) REFERENCES `membership_plans`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_changes` ADD CONSTRAINT `purchase_changes_to_class_id_fkey` FOREIGN KEY (`to_class_id`) REFERENCES `gym_classes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_changes` ADD CONSTRAINT `purchase_changes_refund_id_fkey` FOREIGN KEY (`refund_id`) REFERENCES `refunds`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
