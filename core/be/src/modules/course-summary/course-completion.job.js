import { SETTING_KEYS as K, PERMISSIONS as P } from '@scms/shared';
import { withScheduleTransaction } from '../../common/utils/schedule-transaction.js';
import { vietnamDay, nextDay } from '../../common/utils/vietnam-date.js';
import { Enums, prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { TIME, SPRINT3, AUDIT_ACTIONS } from '../../constants/index.js';
import { getValue } from '../setting/setting.service.js';
import { createForUsers } from '../notification/notification.service.js';
import { COURSE_LIMITS } from './course.constants.js';

async function completeClass(db, classId, now, deadlineDays) {
  const item = await db.gymClass.findUnique({
    where: { id: classId },
    include: { sessions: true },
  });
  if (![Enums.ClassStatus.OPEN, Enums.ClassStatus.CLOSED].includes(item?.status)) return null;
  const sessions = item.sessions.filter((s) => s.status !== Enums.SessionStatus.CANCELLED);
  if (!sessions.length || sessions.some((s) => s.endAt > now)) return null;
  const endedAt = new Date(Math.max(...sessions.map((s) => s.endAt.getTime())));
  const enrollments = await db.classEnrollment.findMany({
    where: {
      classId,
      enrolledAt: { lte: endedAt },
      OR: [
        { status: Enums.EnrollmentStatus.BOOKED },
        { status: Enums.EnrollmentStatus.CANCELLED, cancelledAt: { gt: endedAt } },
      ],
    },
  });
  const deadlineAt = nextDay(
    new Date(vietnamDay(endedAt).getTime() + deadlineDays * TIME.MS_PER_DAY),
  );
  const summary = await db.courseSummary.upsert({
    where: { classId },
    update: {},
    create: {
      classId,
      coachId: item.coachId,
      deadlineAt,
      items: { create: enrollments.map((e) => ({ memberId: e.memberId })) },
    },
  });
  await db.gymClass.update({
    where: { id: classId },
    data: { status: Enums.ClassStatus.COMPLETED },
  });
  await db.auditLog.create({
    data: {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'GymClass',
      entityId: String(classId),
      meta: { status: Enums.ClassStatus.COMPLETED, summaryId: summary.id },
    },
  });
  await createForUsers({
    db,
    userIds: [item.coachId],
    kind: Enums.NotificationKind.TRAINING_RESULT_CREATED,
    title: 'Khoá đã kết thúc, cần lập tổng kết',
    message: `Lớp ${item.name} cần nộp tổng kết trước ${deadlineAt.toISOString()}.`,
    eventKey: `course-summary:${summary.id}:created`,
  });
  return summary;
}

async function remind(db, summary, now, reminderDays) {
  const late = summary.deadlineAt <= now;
  if (!late && summary.deadlineAt > new Date(now.getTime() + reminderDays * TIME.MS_PER_DAY))
    return;
  const managers = late
    ? await db.user.findMany({
        where: {
          status: Enums.UserStatus.ACTIVE,
          role: { permissions: { some: { permission: { code: P.COURSE_SUMMARY_VIEW_ALL } } } },
        },
        select: { id: true },
      })
    : [];
  await createForUsers({
    db,
    userIds: late ? managers.map((m) => m.id) : [summary.coachId],
    kind: Enums.NotificationKind.TRAINING_RESULT_CREATED,
    title: late ? 'Tổng kết khoá quá hạn' : 'Sắp đến hạn nộp tổng kết',
    message: `Lớp ${summary.gymClass.name} chưa công bố tổng kết. Hạn: ${summary.deadlineAt.toISOString()}.`,
    eventKey: `course-summary:${summary.id}:${summary.revision}:${late ? 'late' : 'reminder'}`,
  });
}

/** BR-S4-05/07/10: recheck từng lớp dưới khoá; chạy lặp không tạo trùng tổng kết/thông báo. */
export const runCourseCompletion = async (now = new Date(), classId) => {
  const [days, reminderDays] = await Promise.all(
    [K.COURSE_SUMMARY_DEADLINE_DAYS, K.COURSE_SUMMARY_REMINDER_DAYS].map(getValue),
  );
  const due = await prisma.gymClass.findMany({
    where: {
      ...(classId && { id: classId }),
      status: { in: [Enums.ClassStatus.OPEN, Enums.ClassStatus.CLOSED] },
      sessions: {
        some: { status: { not: Enums.SessionStatus.CANCELLED } },
        none: { status: { not: Enums.SessionStatus.CANCELLED }, endAt: { gt: now } },
      },
    },
    select: { id: true },
    take: COURSE_LIMITS.BATCH_SIZE,
  });
  for (const item of due)
    await withScheduleTransaction((db) => completeClass(db, item.id, now, days));
  const drafts = await prisma.courseSummary.findMany({
    where: { status: Enums.CourseSummaryStatus.DRAFT, ...(classId && { classId }) },
    select: { id: true },
  });
  for (const { id } of drafts)
    await withScheduleTransaction(async (db) => {
      const summary = await db.courseSummary.findUnique({
        where: { id },
        include: { gymClass: true },
      });
      if (summary.status === Enums.CourseSummaryStatus.DRAFT)
        await remind(db, summary, now, reminderDays);
    });
  return due.length;
};

/** Worker nhẹ, không chạy chồng; mọi xử lý vẫn bảo vệ khi nhiều tiến trình cùng chạy. */
export const startCourseCompletionWorker = () => {
  let running = false;
  const tick = async () => {
    if (running) return;
    running = true;
    try {
      await runCourseCompletion();
    } catch (err) {
      logger.error({ err }, 'Job tổng kết khoá lỗi');
    } finally {
      running = false;
    }
  };
  const timer = setInterval(tick, SPRINT3.JOB_INTERVAL_MS);
  timer.unref();
  tick();
  return () => clearInterval(timer);
};
