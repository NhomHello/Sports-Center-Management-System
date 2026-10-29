-- Đối soát SePay (UC-PAY-11..14): phiếu đối soát, nhật ký liên hệ, yêu cầu hoàn tiền và loại thông báo thanh toán.
-- Chỉ thêm mới; không đụng các bảng cũ còn giữ lại từ Sprint 1 (attendances, enrollments, training_*...).

ALTER TABLE `class_events` MODIFY `kind` ENUM('MEMBERSHIP_EXPIRY_REMINDER', 'CLASS_CHANGED', 'CLASS_CANCELLED', 'TRAINING_PLAN_PUBLISHED', 'TRAINING_RESULT_CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_TOPUP_REQUIRED', 'PAYMENT_REVIEW_ALERT', 'PAYMENT_REFUND', 'PAYMENT_CLAIM_REJECTED', 'INVOICE_EXPIRED') NOT NULL;

ALTER TABLE `notifications` MODIFY `kind` ENUM('MEMBERSHIP_EXPIRY_REMINDER', 'CLASS_CHANGED', 'CLASS_CANCELLED', 'TRAINING_PLAN_PUBLISHED', 'TRAINING_RESULT_CREATED', 'PAYMENT_CONFIRMED', 'PAYMENT_TOPUP_REQUIRED', 'PAYMENT_REVIEW_ALERT', 'PAYMENT_REFUND', 'PAYMENT_CLAIM_REJECTED', 'INVOICE_EXPIRED') NOT NULL;

-- CreateTable
CREATE TABLE `reconciliation_cases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reason` ENUM('NO_MATCH', 'UNDERPAID', 'OVERPAID', 'LATE', 'DUPLICATE_TRANSFER', 'MEMBER_CLAIM') NOT NULL,
    `status` ENUM('OPEN', 'WAITING_MEMBER', 'WAITING_TOPUP', 'REFUND_PENDING', 'MATCHED', 'REFUNDED', 'REJECTED', 'IGNORED') NOT NULL DEFAULT 'OPEN',
    `webhook_log_id` INTEGER NULL,
    `invoice_id` INTEGER NULL,
    `user_id` INTEGER NULL,
    `amount` INTEGER NOT NULL,
    `excess_amount` INTEGER NULL,
    `claim` JSON NULL,
    `note` VARCHAR(500) NULL,
    `resolved_by_id` INTEGER NULL,
    `resolved_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `reconciliation_cases_webhook_log_id_key`(`webhook_log_id`),
    INDEX `reconciliation_cases_status_reason_idx`(`status`, `reason`),
    INDEX `reconciliation_cases_invoice_id_idx`(`invoice_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reconciliation_contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `case_id` INTEGER NOT NULL,
    `channel` ENUM('PHONE', 'ZALO', 'EMAIL', 'COUNTER', 'OTHER') NOT NULL,
    `content` VARCHAR(500) NOT NULL,
    `result` VARCHAR(255) NULL,
    `actor_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reconciliation_contacts_case_id_idx`(`case_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refunds` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `invoice_id` INTEGER NULL,
    `case_id` INTEGER NULL,
    `amount` INTEGER NOT NULL,
    `reason` VARCHAR(255) NOT NULL,
    `status` ENUM('PENDING', 'DONE') NOT NULL DEFAULT 'PENDING',
    `reference` VARCHAR(100) NULL,
    `requested_by_id` INTEGER NOT NULL,
    `completed_by_id` INTEGER NULL,
    `completed_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refunds_status_created_at_idx`(`status`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `reconciliation_cases` ADD CONSTRAINT `reconciliation_cases_webhook_log_id_fkey` FOREIGN KEY (`webhook_log_id`) REFERENCES `payment_webhook_logs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reconciliation_cases` ADD CONSTRAINT `reconciliation_cases_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reconciliation_contacts` ADD CONSTRAINT `reconciliation_contacts_case_id_fkey` FOREIGN KEY (`case_id`) REFERENCES `reconciliation_cases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_invoice_id_fkey` FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refunds` ADD CONSTRAINT `refunds_case_id_fkey` FOREIGN KEY (`case_id`) REFERENCES `reconciliation_cases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

