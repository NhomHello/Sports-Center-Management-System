import { Enums, prisma } from '../../config/db.js';
import { logger } from '../../config/logger.js';
import { CLASS_LIMITS } from '../../constants/index.js';
import * as notificationService from '../notification/notification.service.js';

let isDraining = false;

const findRecipientIds = async (db, classId) => {
  const rows = await db.$queryRaw`
    SELECT DISTINCT e.user_id AS userId
    FROM enrollments e
    INNER JOIN class_sessions s ON s.id = e.session_id
    WHERE s.class_id = ${classId}
      AND e.status = 'BOOKED'
  `;

  return rows.map((row) => row.userId);
};

/**
 * Ghi su kien lop vao outbox trong cung transaction nghiep vu.
 *
 * @param {object} db
 * @param {object} item
 * @param {string} kind
 * @param {object|null} changes
 * @returns {Promise<object>}
 */
export const queueClassEvent = async (db, item, kind, changes = null) => {
  const recipientIds = await findRecipientIds(db, item.id);
  const cancelled = kind === Enums.NotificationKind.CLASS_CANCELLED;

  return db.classEvent.create({
    data: {
      classId: item.id,
      kind,
      recipientIds,
      changes,
      title: cancelled ? 'Lớp học đã bị huỷ' : 'Lịch lớp học thay đổi',
      message: cancelled
        ? `Lớp ${item.name} đã bị huỷ.`
        : `Lớp ${item.name} đã thay đổi lịch. Vui lòng xem lịch mới.`,
    },
  });
};

const deliverEvent = async (id) => {
  try {
    await prisma.$transaction(async (db) => {
      await db.$queryRaw`
        SELECT id
        FROM class_events
        WHERE id = ${id}
        FOR UPDATE
      `;

      const event = await db.classEvent.findUnique({
        where: { id },
      });

      if (!event || event.sentAt) return;

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
        data: {
          sentAt: new Date(),
          attempts: { increment: 1 },
          lastError: null,
        },
      });
    });
  } catch (error) {
    await prisma.classEvent.update({
      where: { id },
      data: {
        attempts: { increment: 1 },
        lastError: String(error.message).slice(0, CLASS_LIMITS.ERROR_LENGTH),
      },
    });

    logger.error({ err: error, eventId: id }, 'Gửi thông báo lớp thất bại; sẽ thử lại');
  }
};

/**
 * Xu ly mot batch su kien outbox chua gui.
 *
 * @returns {Promise<void>}
 */
export const drainClassEvents = async () => {
  if (isDraining) return;

  isDraining = true;

  try {
    const events = await prisma.classEvent.findMany({
      where: {
        sentAt: null,
      },
      select: {
        id: true,
      },
      orderBy: {
        id: 'asc',
      },
      take: CLASS_LIMITS.OUTBOX_BATCH_SIZE,
    });

    for (const event of events) {
      await deliverEvent(event.id);
    }
  } finally {
    isDraining = false;
  }
};

/**
 * Khoi dong worker xu ly outbox.
 *
 * @returns {() => void}
 */
export const startClassEventWorker = () => {
  const tick = () =>
    drainClassEvents().catch((error) => logger.error({ err: error }, 'Outbox lớp chưa sẵn sàng'));

  const timer = setInterval(tick, CLASS_LIMITS.OUTBOX_INTERVAL_MS);

  timer.unref();
  tick();

  return () => clearInterval(timer);
};
