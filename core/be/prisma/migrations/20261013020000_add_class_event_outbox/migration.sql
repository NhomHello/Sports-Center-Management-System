CREATE TABLE `class_events` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `class_id` INTEGER NOT NULL,
    `kind` ENUM(
        'MEMBERSHIP_EXPIRY_REMINDER',
        'CLASS_CHANGED',
        'CLASS_CANCELLED',
        'TRAINING_PLAN_PUBLISHED',
        'TRAINING_RESULT_CREATED'
    ) NOT NULL,
    `recipient_ids` JSON NOT NULL,
    `changes` JSON NULL,
    `title` VARCHAR(150) NOT NULL,
    `message` VARCHAR(500) NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `sent_at` DATETIME(3) NULL,
    `last_error` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `class_events_sent_at_id_idx`(`sent_at`, `id`),
    INDEX `class_events_class_id_idx`(`class_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `class_events`
ADD CONSTRAINT `class_events_class_id_fkey`
FOREIGN KEY (`class_id`)
REFERENCES `gym_classes`(`id`)
ON DELETE CASCADE
ON UPDATE CASCADE;
