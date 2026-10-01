-- CreateTable
CREATE TABLE `membership_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` VARCHAR(500) NULL,
    `price` INTEGER NOT NULL,
    `duration_days` INTEGER NOT NULL,
    `status` ENUM('SELLING', 'STOPPED') NOT NULL DEFAULT 'SELLING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `membership_plans_name_key`(`name`),
    INDEX `membership_plans_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
