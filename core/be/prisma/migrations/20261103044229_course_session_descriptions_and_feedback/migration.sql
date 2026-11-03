-- AlterTable
ALTER TABLE `class_sessions` ADD COLUMN `description` VARCHAR(2000) NULL;

-- CreateTable
CREATE TABLE `session_feedback` (
    `version` INTEGER NOT NULL DEFAULT 1,
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `session_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `author_id` INTEGER NOT NULL,
    `rating` INTEGER NULL,
    `note` VARCHAR(2000) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `session_feedback_member_id_updated_at_idx`(`member_id`, `updated_at`),
    UNIQUE INDEX `session_feedback_session_id_member_id_key`(`session_id`, `member_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session_feedback` ADD CONSTRAINT `session_feedback_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `class_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_feedback` ADD CONSTRAINT `session_feedback_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session_feedback` ADD CONSTRAINT `session_feedback_author_id_fkey` FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
