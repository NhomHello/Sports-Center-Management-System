import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { getValue } from '../setting/setting.service.js';
import { overlaps } from './class-schedule.service.js';

const activeEnrollment = {
  OR: [
    { status: Enums.EnrollmentStatus.BOOKED },
    {
      status: Enums.EnrollmentStatus.PENDING_PAYMENT,
      invoice: { status: Enums.InvoiceStatus.PENDING },
    },
  ],
};

/** Both the original and replacement start must satisfy the configured notice period. */
export const assertRescheduleNotice = async (starts, now = new Date()) => {
  if (!starts.length) return;
  const hours = await getValue(SETTING_KEYS.CLASS_RESCHEDULE_MIN_HOURS_BEFORE);
  const earliest = now.getTime() + hours * TIME.MS_PER_HOUR;
  if (starts.some((start) => start.getTime() < earliest))
    throw ApiError.businessRule(
      `Phải đổi lịch trước ít nhất ${hours} giờ so với lịch cũ và lịch mới`,
    );
};

const pendingTransfers = (db, classId) =>
  db.purchaseChange.findMany({
    where: {
      status: Enums.PurchaseChangeStatus.PENDING_PAYMENT,
      OR: [{ toClassId: classId }, { fromEnrollment: { classId } }],
    },
    select: { userId: true, toClassId: true, fromEnrollment: { select: { classId: true } } },
  });

/** A transfer reserves two alternative courses; it does not require attending both. */
const isTransferPair = (changes, classId, other) =>
  changes.some(
    (c) =>
      c.userId === other.memberId &&
      ((c.toClassId === classId && c.fromEnrollment?.classId === other.classId) ||
        (c.toClassId === other.classId && c.fromEnrollment?.classId === classId)),
  );

/** Block overlaps for every booked member and pending payment seat, before any schedule write. */
export const assertRescheduleMembers = async (db, classId, slots, now = new Date()) => {
  const enrollments = await db.classEnrollment.findMany({
    where: { classId, ...activeEnrollment },
    select: { memberId: true, member: { select: { fullName: true } } },
  });
  if (!enrollments.length || !slots.length)
    return { enrolledCount: enrollments.length, conflicts: [] };
  const others = await db.classEnrollment.findMany({
    where: {
      memberId: { in: enrollments.map((e) => e.memberId) },
      classId: { not: classId },
      gymClass: { status: { not: Enums.ClassStatus.CANCELLED } },
      ...activeEnrollment,
    },
    select: {
      memberId: true,
      classId: true,
      gymClass: {
        select: {
          name: true,
          sessions: { where: { status: Enums.SessionStatus.SCHEDULED, endAt: { gt: now } } },
        },
      },
    },
  });
  const changes = await pendingTransfers(db, classId);
  const names = new Map(enrollments.map((e) => [e.memberId, e.member.fullName]));
  const conflicts = others
    .filter((o) => !isTransferPair(changes, classId, o))
    .filter((o) => o.gymClass.sessions.some((s) => slots.some((slot) => overlaps(s, slot))))
    .map((o) => ({
      memberId: o.memberId,
      fullName: names.get(o.memberId),
      className: o.gymClass.name,
    }));
  if (conflicts.length)
    throw ApiError.conflict('Không thể đổi lịch vì hội viên bị trùng lịch khóa học khác', {
      type: Enums.ReconciliationReason.SCHEDULE_CONFLICT,
      conflicts,
    });
  return { enrolledCount: enrollments.length, conflicts: [] };
};
