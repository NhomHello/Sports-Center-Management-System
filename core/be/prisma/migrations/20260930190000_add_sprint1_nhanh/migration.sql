ALTER TABLE `users`
  ADD COLUMN `token_version` INTEGER NOT NULL DEFAULT 0;

ALTER TABLE `notifications`
  DROP FOREIGN KEY `notifications_membership_id_fkey`,
  DROP INDEX `notifications_membership_id_kind_key`,
  MODIFY `membership_id` INTEGER NULL,
  MODIFY `kind` ENUM('MEMBERSHIP_EXPIRY_REMINDER', 'CLASS_CHANGED', 'CLASS_CANCELLED') NOT NULL,
  ADD COLUMN `dedupe_key` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `notifications_dedupe_key_key`(`dedupe_key`),
  ADD CONSTRAINT `notifications_membership_id_fkey`
    FOREIGN KEY (`membership_id`) REFERENCES `memberships`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `payments` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `invoice_id` INTEGER NOT NULL,
  `provider` ENUM('COUNTER') NOT NULL,
  `requested_amount` INTEGER NOT NULL,
  `received_amount` INTEGER NOT NULL,
  `reference` VARCHAR(100) NULL,
  `paid_at` DATETIME(3) NOT NULL,
  `actor_id` INTEGER NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX `payments_invoice_id_paid_at_idx`(`invoice_id`, `paid_at`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `payments` ADD CONSTRAINT `payments_invoice_id_fkey`
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
