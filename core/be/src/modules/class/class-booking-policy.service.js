import { SETTING_KEYS } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import { extraEnrollmentReason, heldSeats } from './class-member-eligibility.service.js';
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

/** GY-20: học lớp không cần gói tự tập; lớp có học phí phải thanh toán khóa học mới có chỗ. */
const ENROLLED_REASON = Object.freeze({
  [Enums.EnrollmentStatus.BOOKED]: 'Bạn đã đăng ký lớp này',
  [Enums.EnrollmentStatus.PENDING_PAYMENT]: 'Đang giữ chỗ, chờ thanh toán khóa học',
});

function enrollmentReason({ item, enrollment, member, conflict, sessions }, now) {
  if (ENROLLED_REASON[enrollment?.status]) return ENROLLED_REASON[enrollment.status];
  if (member?.status !== Enums.UserStatus.ACTIVE) return 'Tài khoản hội viên đã bị khoá';
  if (!isRegistrationOpen(item, now)) return 'Lớp ngoài thời gian mở đăng ký';
  if (!sessions.length) return 'Lớp không còn buổi chưa diễn ra';
  // Kiểm tra trùng lịch trước sức chứa: lớp đủ chỗ mà trùng giờ thì cũng không được vào chờ.
  if (conflict) return 'Trùng lịch với lớp đã đăng ký';
  if (item._count.enrollments >= item.capacity) return CLASS_FULL_REASON;
  return null;
}

/** Đăng ký hiện có, hồ sơ hội viên và các lớp khác đang giữ chỗ của hội viên (để xét trùng lịch). */
const loadMemberState = (db, item, memberId, now) =>
  Promise.all([
    db.classEnrollment.findUnique({ where: { classId_memberId: { classId: item.id, memberId } } }),
    db.user.findUnique({ where: { id: memberId } }),
    db.classEnrollment.findMany({
      where: {
        memberId,
        // Đổi lớp: lớp đang rời đi không tính là trùng lịch với lớp mới.
        classId: { notIn: [item.id, ...(item.ignoreClassIds ?? [])] },
        status: { in: [Enums.EnrollmentStatus.BOOKED, Enums.EnrollmentStatus.PENDING_PAYMENT] },
      },
      include: {
        gymClass: {
          include: {
            sessions: { where: { status: Enums.SessionStatus.SCHEDULED, endAt: { gt: now } } },
          },
        },
      },
    }),
  ]);

/** Khóa đã thanh toán không hủy nhanh: phải qua "Hủy khóa học" để tính tiền hoàn (GY-32). */
const courseActions = (item, enrollment, policy) => {
  const paidCourse = Boolean(enrollment?.invoiceId) && item.price > 0;
  return {
    isPaidCourse: item.price > 0,
    needsPayment: item.price > 0 && !enrollment?.invoiceId,
    ...policy,
    ...(paidCourse &&
      policy.canCancel && {
        canCancel: false,
        cancelReason: 'Khóa học đã thanh toán, hãy dùng Hủy khóa học',
      }),
  };
};

/** Đánh giá dùng chung cho DTO và phép ghi trong transaction. */
export const getClassActions = async (db, item, memberId, now = new Date()) => {
  const sessions = item.sessions.filter(
    (s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt > now,
  );
  const [enrollment, member, others] = await loadMemberState(db, item, memberId, now);
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
        conflict: firstConflict,
        sessions,
      },
      now,
    );
  const policy = cancellationPolicy({ enrollment, sessions, hours, exceptionUntil }, now);
  return {
    bookingBlockedUntil: member?.bookingBlockedUntil ?? null,
    enrollment,
    canEnroll: !enrollReason,
    canJoinWaitlist: enrollReason === CLASS_FULL_REASON,
    enrollReason,
    ...courseActions(item, enrollment, policy),
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
