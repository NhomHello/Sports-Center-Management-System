CREATE TABLE `login_throttles` (
  `throttle_key` VARCHAR(64) NOT NULL,
  `attempts` INTEGER NOT NULL DEFAULT 0,
  `locked_until` DATETIME(3) NULL,
  PRIMARY KEY (`throttle_key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
