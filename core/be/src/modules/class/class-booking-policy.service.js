import { SETTING_KEYS } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import { overlaps } from './class-schedule.service.js';

/** BR-2.5: mốc >= N giờ được phép; ngoại lệ phải trước buổi xung đột. */
export const cancellationPolicy = ({ enrollment, sessions, hours, exceptionUntil }, now) => {
  const next = sessions.find((s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt > now);
  const deadline = next ? new Date(next.startAt.getTime() - hours * TIME.MS_PER_HOUR) : null;
  const unavailable = !enrollment || enrollment.status !== Enums.EnrollmentStatus.BOOKED || !next;
  if (unavailable)
    return {
      canCancel: false,
      cancelDeadline: deadline,
      cancellationExceptionUntil: null,
      cancelReason: 'Không có đăng ký được phép huỷ',
    };
  const exception = Boolean(exceptionUntil) && now < exceptionUntil;
  const ordinary = Boolean(deadline) && now <= deadline;
  const canCancel = Boolean(ordinary || exception);
  return {
    canCancel,
    cancelDeadline: deadline,
    cancellationExceptionUntil: exception ? exceptionUntil : null,
    cancelReason: canCancel ? null : 'Đã quá hạn huỷ',
  };
};

const isRegistrationOpen = (item, now) =>
  item.status === Enums.ClassStatus.OPEN &&
  now >= item.registrationStartAt &&
  now < item.registrationEndAt;

function enrollmentReason({ item, enrollment, member, membership, conflict, sessions }, now) {
  if (enrollment?.status === Enums.EnrollmentStatus.BOOKED) return 'Bạn đã đăng ký lớp này';
  if (member?.status !== Enums.UserStatus.ACTIVE || !membership)
    return 'Cần membership còn hiệu lực';
  if (!isRegistrationOpen(item, now)) return 'Lớp ngoài thời gian mở đăng ký';
  if (!sessions.length) return 'Lớp không còn buổi chưa diễn ra';
  if (item._count.enrollments >= item.capacity) return 'Lớp đã đủ chỗ';
  if (conflict) return 'Trùng lịch với lớp đã đăng ký';
  return null;
}

/** Đánh giá dùng chung cho DTO và phép ghi trong transaction. */
export const getClassActions = async (db, item, memberId, now = new Date()) => {
  const sessions = item.sessions.filter(
    (s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt > now,
  );
  const [enrollment, member, membership, others] = await Promise.all([
    db.classEnrollment.findUnique({ where: { classId_memberId: { classId: item.id, memberId } } }),
    db.user.findUnique({ where: { id: memberId }, select: { status: true } }),
    db.membership.findFirst({
      where: {
        userId: memberId,
        status: Enums.MembershipStatus.ACTIVE,
        startDate: { lte: now },
        endDate: { gt: now },
      },
    }),
    db.classEnrollment.findMany({
      where: { memberId, classId: { not: item.id }, status: Enums.EnrollmentStatus.BOOKED },
      include: {
        gymClass: {
          include: {
            sessions: { where: { status: Enums.SessionStatus.SCHEDULED, endAt: { gt: now } } },
          },
        },
      },
    }),
  ]);
  const firstConflict = sessions.find((s) =>
    others.some((e) => e.gymClass.sessions.some((other) => overlaps(s, other))),
  );
  const hours = await settingService.getValue(SETTING_KEYS.CLASS_CANCEL_MIN_HOURS_BEFORE);
  const exceptionUntil =
    enrollment?.exceptionUntil && firstConflict
      ? new Date(Math.min(enrollment.exceptionUntil.getTime(), firstConflict.startAt.getTime()))
      : null;
  const enrollReason = enrollmentReason(
    {
      item,
      enrollment,
      member,
      membership,
      conflict: firstConflict,
      sessions,
    },
    now,
  );
  return {
    enrollment,
    canEnroll: !enrollReason,
    enrollReason,
    ...cancellationPolicy({ enrollment, sessions, hours, exceptionUntil }, now),
  };
};

/** Projection de permission/điều kiện hiện tại, FE không tự tính hạn huỷ. */
export const enrichClassView = async (item, memberId) => {
  const data = {
    ...item,
    startsOn: new Date(item.startsOn),
    endsOn: new Date(item.endsOn),
    registrationStartAt: new Date(item.registrationStartAt),
    registrationEndAt: new Date(item.registrationEndAt),
    sessions: item.sessions.map((s) => ({
      ...s,
      startAt: new Date(s.startAt),
      endAt: new Date(s.endAt),
    })),
    _count: { enrollments: item.enrolledCount },
  };
  return { ...item, ...(await getClassActions(prisma, data, memberId)) };
};
