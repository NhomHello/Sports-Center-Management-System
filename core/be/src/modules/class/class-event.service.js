import { deliverCourseEmail } from '../course-summary/course-email.service.js';
import { COURSE_EVENTS } from '../course-summary/course.constants.js';
import { Enums, prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { CLASS_LIMITS } from '../../constants/index.js';
import { vietnamDateTime } from '../../common/utils/vietnam-date.js';
import * as notificationService from '../notification/notification.service.js';

let isDraining = false;

/**
 * Chi tiết đổi để hội viên không phải mở app mới biết: giờ cũ → giờ mới của buổi, buổi bị huỷ
 * (kèm lý do) hoặc HLV mới; đổi cả lịch lớp thì nhắc xem lịch mới.
 */
const describeChange = (changes) => {
  const at = (value) => vietnamDateTime(value);
  if (changes.before?.startAt && changes.after?.startAt)
    return `: ${at(changes.before.startAt)} → ${at(changes.after.startAt)}`;
  if (changes.sessionStartAt)
    return ` (buổi ${at(changes.sessionStartAt)}${changes.reason ? `, lý do: ${changes.reason}` : ''})`;
  if (changes.coachName) return `: HLV mới là ${changes.coachName}`;
  return '. Vui lòng xem lịch mới';
};

/** BR-2.7: outbox ghi trong transaction đổi lớp, gửi lỗi vẫn giữ sự kiện để thử lại. */
export const queueClassEvent = async (db, item, kind, changes) => {
  const enrollments = await db.classEnrollment.findMany({
    where: { classId: item.id, status: Enums.EnrollmentStatus.BOOKED },
    select: { memberId: true },
  });
  const isCancelled = kind === Enums.NotificationKind.CLASS_CANCELLED;
  const label = changes.sessionId ? 'Buổi học' : 'Lớp học';
  const detail = isCancelled && !changes.sessionStartAt ? '' : describeChange(changes);
  return db.classEvent.create({
    data: {
      classId: item.id,
      kind,
      recipientIds: enrollments.map((e) => e.memberId),
      changes,
      title: isCancelled ? `${label} đã bị huỷ` : `Lịch ${label.toLowerCase()} thay đổi`,
      message: `${label} ${item.name} ${isCancelled ? 'đã bị huỷ' : 'đã thay đổi lịch'}${detail}.`,
    },
  });
};

async function deliverEvent(id) {
  try {
    const needsEmail = await prisma.$transaction(async (db) => {
      await db.$queryRaw`SELECT id FROM class_events WHERE id = ${id} FOR UPDATE`;
      const event = await db.classEvent.findUnique({ where: { id } });
      if (event.sentAt) return;
      await notificationService.createForUsers({
        userIds: event.recipientIds,
        kind: event.kind,
        title: event.title,
        message: event.message,
        eventKey: `class-event:${event.id}`,
        db,
      });
      if (event.changes.type === COURSE_EVENTS.PUBLISHED) return true;
      await db.classEvent.update({
        where: { id },
        data: { sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
      });
    });
    if (needsEmail) await deliverCourseEmail(id);
  } catch (err) {
    await prisma.classEvent.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        lastError: String(err.message).slice(0, CLASS_LIMITS.ERROR_LENGTH),
      },
    });
    logger.error({ err, eventId: id }, 'Gửi thông báo lớp thất bại; sẽ thử lại');
  }
}

/** Khoá chống worker cùng tiến trình; mỗi event còn được khoá ở database. */
export const drainClassEvents = async () => {
  if (isDraining) return;
  isDraining = true;
  try {
    const events = await prisma.classEvent.findMany({
      where: { sentAt: null },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: CLASS_LIMITS.OUTBOX_BATCH_SIZE,
    });
    for (const event of events) await deliverEvent(event.id);
  } finally {
    isDraining = false;
  }
};

/** Khởi động và trả hàm dừng worker theo vòng đời server. */
export const startClassEventWorker = () => {
  const tick = () =>
    drainClassEvents().catch((err) => logger.error({ err }, 'Outbox chưa sẵn sàng'));
  const timer = setInterval(tick, CLASS_LIMITS.OUTBOX_INTERVAL_MS);
  timer.unref();
  tick();
  return () => clearInterval(timer);
};
