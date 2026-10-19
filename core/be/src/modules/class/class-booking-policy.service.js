import { SETTING_KEYS } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import { extraEnrollmentReason, heldSeats } from './class-member-eligibility.service.js';
import { membershipWarning } from './membership-warning.js';
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

/** Lý do "đủ chỗ" là lý do duy nhất còn cho phép vào danh sách chờ (BR-2.16). */
const CLASS_FULL_REASON = 'Lớp đã đủ chỗ';

const isRegistrationOpen = (item, now) =>
  item.status === Enums.ClassStatus.OPEN &&
  now >= item.registrationStartAt &&
  now < item.registrationEndAt;

function enrollmentReason({ item, enrollment, member, membership, conflict, sessions }, now) {
  if (enrollment?.status === Enums.EnrollmentStatus.BOOKED) return 'Bạn đã đăng ký lớp này';
  if (member?.status !== Enums.UserStatus.ACTIVE) return 'Tài khoản hội viên đã bị khoá';
  if (!membership) return 'Cần gói tập còn hiệu lực để đăng ký lớp';
  if (!isRegistrationOpen(item, now)) return 'Lớp ngoài thời gian mở đăng ký';
  if (!sessions.length) return 'Lớp không còn buổi chưa diễn ra';
  // Kiểm tra trùng lịch trước sức chứa: lớp đủ chỗ mà trùng giờ thì cũng không được vào chờ.
  if (conflict) return 'Trùng lịch với lớp đã đăng ký';
  if (item._count.enrollments >= item.capacity) return CLASS_FULL_REASON;
  return null;
}

/** Đánh giá dùng chung cho DTO và phép ghi trong transaction. */
export const getClassActions = async (db, item, memberId, now = new Date()) => {
  const sessions = item.sessions.filter(
    (s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt > now,
  );
  const [enrollment, member, membership, others] = await Promise.all([
    db.classEnrollment.findUnique({ where: { classId_memberId: { classId: item.id, memberId } } }),
    db.user.findUnique({ where: { id: memberId } }),
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
  const extraReason = await extraEnrollmentReason(db, memberId, sessions, now);
  const held = await heldSeats(db, item.id, now, memberId);
  const enrollReason =
    extraReason ??
    enrollmentReason(
      {
        item: { ...item, _count: { enrollments: item._count.enrollments + held } },
        enrollment,
        member,
        membership,
        conflict: firstConflict,
        sessions,
      },
      now,
    );
  return {
    bookingBlockedUntil: member?.bookingBlockedUntil ?? null,
    ...membershipWarning(membership, sessions),
    enrollment,
    canEnroll: !enrollReason,
    canJoinWaitlist: enrollReason === CLASS_FULL_REASON,
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
  const now = new Date();
  const held = await heldSeats(prisma, item.id, now);
  const waitlist = await prisma.classWaitlist.findUnique({
    where: { classId_memberId: { classId: item.id, memberId } },
  });
  return {
    ...item,
    heldSeats: held,
    seatsRemaining: Math.max(0, item.seatsRemaining - held),
    waitlist,
    ...(await getClassActions(prisma, data, memberId, now)),
  };
};
