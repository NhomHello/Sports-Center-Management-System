-- AlterTable
ALTER TABLE `email_verification_tokens`
    ADD COLUMN `purpose` ENUM('VERIFY_EMAIL', 'CHANGE_EMAIL', 'RESET_PASSWORD') NOT NULL DEFAULT 'VERIFY_EMAIL';

-- CreateIndex first: the user_id foreign key needs an index while the old one is dropped.
CREATE INDEX `email_verification_tokens_user_id_purpose_idx` ON `email_verification_tokens`(`user_id`, `purpose`);

-- DropIndex
DROP INDEX `email_verification_tokens_user_id_idx` ON `email_verification_tokens`;
