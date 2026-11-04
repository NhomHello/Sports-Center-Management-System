// Run from core/be: node --env-file-if-exists=.env prisma/seed/demo/history.demo.js
// Includes refund.test@scms.test: paid 1.000.000 VND, 10 of 20 sessions completed.
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { prisma } from '../../../src/config/db.js';
import { env } from '../../../src/config/env.js';
import { logger } from '../../../src/config/logger.js';
import { ensureCourse, loadDemoActors } from './history-courses.demo.js';
import { publishSummary, recordAttendanceAndFeedback } from './history-reviews.demo.js';
import { HISTORY_COURSES } from './history-data.demo.js';
import { seedRefundTestCourse } from './refund-course.demo.js';

async function seedHistory() {
  if (env.NODE_ENV === 'production') throw new Error('Không tạo dữ liệu demo trong production');
  const members = await loadDemoActors();
  const results = [];
  for (const definition of HISTORY_COURSES) {
    const course = await ensureCourse(definition, members);
    await recordAttendanceAndFeedback(course);
    await publishSummary(course);
    results.push({
      classId: course.gymClass.id,
      name: course.gymClass.name,
      coach: course.coach.fullName,
      sessions: course.sessions.length,
      attendanceRows: course.sessions.length * members.length,
      sessionFeedbackRows: course.sessions.length * members.length,
      courseRatings: members.length,
    });
  }
  const refundCourse = await seedRefundTestCourse();
  results.push({
    ...refundCourse,
    sessions: 20,
    completedSessions: 10,
    price: 1_000_000,
  });
  logger.info({ members: members.length, courses: results }, 'Đã seed lịch sử lớp học và đánh giá demo');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  seedHistory().catch((err) => {
    logger.error({ err }, 'Seed lịch sử demo thất bại');
    process.exitCode = 1;
  }).finally(() => prisma.$disconnect());
}
