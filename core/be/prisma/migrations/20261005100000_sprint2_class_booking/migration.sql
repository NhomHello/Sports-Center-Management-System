-- Additive upgrade: keep legacy per-session enrollments and every Flow 3/4 table.
ALTER TABLE class_sessions
  ADD COLUMN room_name VARCHAR(100) NULL,
  ADD COLUMN coach_name VARCHAR(100) NULL;
UPDATE class_sessions s
JOIN gym_classes c ON c.id = s.class_id
JOIN rooms r ON r.id = c.room_id
JOIN users u ON u.id = c.coach_id
SET s.room_name = r.name, s.coach_name = u.full_name;
CREATE TABLE class_enrollments (
  id INTEGER NOT NULL AUTO_INCREMENT,
  class_id INTEGER NOT NULL,
  member_id INTEGER NOT NULL,
  status ENUM('BOOKED', 'CANCELLED') NOT NULL DEFAULT 'BOOKED',
  enrolled_by INTEGER NOT NULL,
  cancelled_by INTEGER NULL,
  enrolled_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  cancelled_at DATETIME(3) NULL,
  exception_until DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE INDEX class_enrollments_class_id_member_id_key (class_id, member_id),
  INDEX class_enrollments_member_id_status_idx (member_id, status),
  CONSTRAINT class_enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES gym_classes(id),
  CONSTRAINT class_enrollments_member_id_fkey FOREIGN KEY (member_id) REFERENCES users(id),
  CONSTRAINT class_enrollments_enrolled_by_fkey FOREIGN KEY (enrolled_by) REFERENCES users(id),
  CONSTRAINT class_enrollments_cancelled_by_fkey FOREIGN KEY (cancelled_by) REFERENCES users(id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE class_events (
  id INTEGER NOT NULL AUTO_INCREMENT,
  class_id INTEGER NOT NULL,
  kind ENUM('MEMBERSHIP_EXPIRY_REMINDER', 'CLASS_CHANGED', 'CLASS_CANCELLED',
    'TRAINING_PLAN_PUBLISHED', 'TRAINING_RESULT_CREATED') NOT NULL,
  title VARCHAR(150) NOT NULL,
  message VARCHAR(500) NOT NULL,
  recipient_ids JSON NOT NULL,
  changes JSON NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  sent_at DATETIME(3) NULL,
  last_error VARCHAR(500) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  INDEX class_events_sent_at_id_idx (sent_at, id),
  CONSTRAINT class_events_class_id_fkey FOREIGN KEY (class_id) REFERENCES gym_classes(id)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE schedule_locks (id INTEGER NOT NULL PRIMARY KEY)
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT INTO schedule_locks (id) VALUES (1);
