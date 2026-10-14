import { Enums, prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { CLASS_LIMITS } from '../../constants/index.js';
import * as notificationService from '../notification/notification.service.js';

let isDraining = false;

/** BR-2.7: outbox ghi trong transaction đổi lớp, gửi lỗi vẫn giữ sự kiện để thử lại. */
export const queueClassEvent = async (db, item, kind, changes) => {
  const enrollments = await db.classEnrollment.findMany({
    where: { classId: item.id, status: Enums.EnrollmentStatus.BOOKED },
    select: { memberId: true },
  });
  const isCancelled = kind === Enums.NotificationKind.CLASS_CANCELLED;
  return db.classEvent.create({
    data: {
      classId: item.id,
      kind,
      recipientIds: enrollments.map((e) => e.memberId),
      changes,
      title: isCancelled ? 'Lớp học đã bị huỷ' : 'Lịch lớp học thay đổi',
      message: `Lớp ${item.name} ${isCancelled ? 'đã bị huỷ' : 'đã thay đổi lịch. Vui lòng xem lịch mới'}.`,
    },
  });
};

async function deliverEvent(id) {
  try {
    await prisma.$transaction(async (db) => {
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
      await db.classEvent.update({
        where: { id },
        data: { sentAt: new Date(), attempts: { increment: 1 }, lastError: null },
      });
    });
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
