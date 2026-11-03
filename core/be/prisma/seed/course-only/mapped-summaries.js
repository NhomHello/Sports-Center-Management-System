import { Enums } from '../../../src/config/db.js';
import { TIME } from '../../../src/constants/index.js';
import { vietnamDay, nextDay } from '../../../src/common/utils/vietnam-date.js';
import { calculateAttendance } from '../../../src/modules/course-summary/course-attendance.service.js';
import {
  createMappedAttendance,
  createMappedPurchase,
  historicalPaymentDate,
} from './mapped-purchases.js';

/** Tổng kết, điểm danh và kết quả đều trỏ về invoice/enrollment của đúng học viên. */
export const populateCompletedCourse = async (db, { course, template, catalog }, context) => {
  const endedAt = course.sessions.at(-1).endAt;
  const published = template.mode === 'published';
  const publishedAt = nextDay(vietnamDay(endedAt));
  const summary = await db.courseSummary.create({
    data: {
      classId: course.id,
      coachId: course.coachId,
      status: published ? Enums.CourseSummaryStatus.PUBLISHED : Enums.CourseSummaryStatus.DRAFT,
      deadlineAt: nextDay(
        new Date(vietnamDay(endedAt).getTime() + context.deadlineDays * TIME.MS_PER_DAY),
      ),
      publishedAt: published ? publishedAt : null,
      revision: published ? 1 : 0,
      createdAt: endedAt,
      updatedAt: published ? publishedAt : endedAt,
    },
  });
  for (const [index, member] of catalog.members.entries()) {
    const paidAt = historicalPaymentDate(template);
    const { enrollment } = await createMappedPurchase(
      db,
      { course, member, index, paidAt },
      context,
    );
    const attendance = await createMappedAttendance(db, course, member, index);
    const snapshot = calculateAttendance(course.sessions, attendance, enrollment.enrolledAt);
    const fields = itemFields(published, { index, snapshot, passPercent: context.passPercent });
    await db.courseSummaryItem.create({
      data: {
        summaryId: summary.id,
        memberId: member.id,
        createdAt: endedAt,
        updatedAt: published ? publishedAt : endedAt,
        ...fields,
      },
    });
    if (published) await createRating(db, { course, member, index, publishedAt });
  }
};
function itemFields(published, { index, snapshot, passPercent }) {
  if (!published) return { result: null, progress: null, comment: '', nextCourse: '' };
  return {
    result:
      snapshot.percent >= passPercent ? Enums.CourseResult.PASS : Enums.CourseResult.NOT_PASSED,
    progress: index === 2 ? 2 : 4,
    comment:
      index === 2
        ? 'Cần duy trì chuyên cần để tiến bộ.'
        : 'Tiến bộ tốt, thực hiện động tác an toàn.',
    nextCourse: 'Fitness nâng cao',
    attendanceSnapshot: snapshot,
  };
}
async function createRating(db, { course, member, index, publishedAt }) {
  await db.courseRating.create({
    data: {
      classId: course.id,
      memberId: member.id,
      coachId: course.coachId,
      courseStars: index === 2 ? 3 : 5,
      coachStars: 5,
      comment: 'HLV hướng dẫn rõ ràng; dữ liệu mẫu phục vụ demo.',
      createdAt: publishedAt,
      updatedAt: publishedAt,
    },
  });
  await db.notification.create({
    data: {
      userId: member.id,
      kind: Enums.NotificationKind.TRAINING_RESULT_CREATED,
      title: 'Đã có kết quả khóa học',
      message: `Khóa ${course.name} đã công bố tổng kết.`,
      dedupeKey: `mapped-result:${course.id}:${member.id}`,
      createdAt: publishedAt,
    },
  });
}
