import { ApiError } from '../../common/errors/api-error.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { Enums, prisma } from '../../config/db.js';
import { createForUsers } from '../notification/notification.service.js';
import { promoteWaitlist } from '../class/class-waitlist.service.js';

/** Xem trước lịch sẽ bị ảnh hưởng để FE yêu cầu xác nhận trước khi khoá. */
export const preview = async (memberId, db = prisma) => {
  const now = new Date();
  const [classes, bookings] = await Promise.all([
    db.gymClass.findMany({
      where: {
        status: Enums.ClassStatus.OPEN,
        OR: [
          { coachId: memberId },
          {
            sessions: {
              some: {
                coachId: memberId,
                status: Enums.SessionStatus.SCHEDULED,
                endAt: { gt: now },
              },
            },
          },
        ],
      },
      select: { id: true, name: true },
    }),
    db.classEnrollment.findMany({
      where: {
        memberId,
        status: Enums.EnrollmentStatus.BOOKED,
        gymClass: {
          sessions: { some: { status: Enums.SessionStatus.SCHEDULED, startAt: { gt: now } } },
        },
      },
      include: {
        gymClass: {
          select: {
            name: true,
            sessions: { where: { startAt: { gt: now }, status: Enums.SessionStatus.SCHEDULED } },
          },
        },
      },
    }),
  ]);
  return { classes, bookings };
};

/** BR-1.15: huỷ booking sau xác nhận, nhả chỗ và giữ actor Manager. */
export const cancelBookingsForLock = async (db, memberId, actor, confirmed) => {
  const impact = await preview(memberId, db);
  if (impact.classes.length)
    throw ApiError.conflict('Cần đổi HLV trước khi khoá tài khoản', impact);
  if (impact.bookings.length && !confirmed)
    throw ApiError.conflict('Xác nhận huỷ các đăng ký tương lai trước khi khoá', impact);
  for (const row of impact.bookings) {
    await db.classEnrollment.update({
      where: { id: row.id },
      data: {
        status: Enums.EnrollmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: actor.id,
        exceptionUntil: null,
      },
    });
    await db.auditLog.create({
      data: {
        userId: actor.id,
        action: AUDIT_ACTIONS.DELETE,
        entity: 'ClassEnrollment',
        entityId: String(row.id),
        meta: { reason: 'ACCOUNT_LOCKED' },
      },
    });
  }
  const waiting = await db.classWaitlist.findMany({
    where: {
      memberId,
      status: { in: [Enums.WaitlistStatus.WAITING, Enums.WaitlistStatus.OFFERED] },
    },
    select: { classId: true },
  });
  await db.classWaitlist.updateMany({
    where: {
      memberId,
      status: { in: [Enums.WaitlistStatus.WAITING, Enums.WaitlistStatus.OFFERED] },
    },
    data: { status: Enums.WaitlistStatus.CANCELLED },
  });
  for (const classId of new Set([...waiting, ...impact.bookings].map((row) => row.classId)))
    await promoteWaitlist(db, classId);
  if (impact.bookings.length)
    await createForUsers({
      db,
      userIds: [memberId],
      kind: Enums.NotificationKind.ACCOUNT_LOCKED,
      title: 'Tài khoản bị khoá',
      message: 'Các đăng ký lớp tương lai đã được huỷ và giải phóng chỗ.',
      eventKey: `account-lock:${memberId}:${Date.now()}`,
    });
  return impact;
};
