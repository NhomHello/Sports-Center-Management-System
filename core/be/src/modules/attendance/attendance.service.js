import { randomUUID } from 'node:crypto';
import { PERMISSIONS as P, SETTING_KEYS as K } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, TIME } from '../../constants/index.js';
import * as settings from '../setting/setting.service.js';
import { completeDueFreezes } from '../membership/membership-freeze.service.js';
import { ACCESS_INCLUDE } from '../membership-plan/membership-plan.service.js';
import { frameContains, vietnamClock } from '../operating-frame/operating-frame.service.js';
import { refreshNoShowBlock } from './no-show.service.js';

/** Gói còn hạn nhưng trong số ngày nhắc gia hạn: nhắc lễ tân mời hội viên gia hạn. */
const expiringWarning = async (membership, now) => {
  const days = await settings.getValue(K.MEMBERSHIP_EXPIRY_REMINDER_DAYS);
  const left = Math.ceil((membership.endDate - now) / TIME.MS_PER_DAY);
  return left <= days ? `Gói sắp hết hạn: còn ${left} ngày, hãy mời hội viên gia hạn` : null;
};

const describeFrames = (frames) =>
  frames.map(({ frame }) => `${frame.name} ${frame.startTime}–${frame.endTime}`).join(', ');

/**
 * GY-20: gói tự tập chỉ vào được trong khung giờ và khu vực của gói. Gói không chọn khung giờ /
 * khu vực nghĩa là không giới hạn mục đó (dữ liệu trước góp ý).
 */
const assertPlanAccess = async (db, plan, { roomTypeId }, now) => {
  const clock = vietnamClock(now);
  if (plan.frames.length && !plan.frames.some(({ frame }) => frameContains(frame, clock)))
    throw ApiError.businessRule(`Ngoài khung giờ của gói (${describeFrames(plan.frames)})`);
  if (!roomTypeId || !plan.areas.length) return;
  if (plan.areas.some((area) => area.roomTypeId === roomTypeId)) return;
  const area = await db.roomType.findUnique({ where: { id: roomTypeId } });
  throw ApiError.businessRule(`Gói không cho vào khu vực ${area?.name ?? 'này'}`);
};

/** Kỳ gói đang hiệu lực kèm khung giờ/khu vực; kỳ đang bảo lưu bị từ chối. */
const loadAccessPeriod = async (db, memberId, now) => {
  const current = await completeDueFreezes(db, memberId, now);
  if (current?.status === Enums.MembershipStatus.FROZEN)
    throw ApiError.businessRule('Gói đang bảo lưu');
  return current
    ? db.membership.findUnique({
        where: { id: current.id },
        include: { plan: { include: ACCESS_INCLUDE } },
      })
    : null;
};

/** Check-in tại quầy không kích hoạt membership; gói bảo lưu / ngoài khung giờ bị từ chối. */
export const checkIn = (memberId, actor, access = {}) =>
  withScheduleTransaction(async (db) => {
    const member = await db.user.findUnique({ where: { id: memberId } });
    if (!member) throw ApiError.notFound('Không tìm thấy hội viên');
    if (member.status !== Enums.UserStatus.ACTIVE) throw ApiError.businessRule('Tài khoản bị khoá');
    const now = new Date();
    const item = await loadAccessPeriod(db, memberId, now);
    if (!item && !(await settings.getValue(K.CHECKIN_ALLOW_EXPIRED)))
      throw ApiError.businessRule('Cần gói còn hiệu lực để check-in');
    if (item) await assertPlanAccess(db, item.plan, access, now);
    const warning = item ? await expiringWarning(item, now) : 'Gói đã hết hạn hoặc chưa có gói';
    const result = await db.checkIn.create({
      data: {
        memberId,
        actorId: actor.id,
        kind: Enums.CheckInKind.GENERAL,
        code: randomUUID(),
        warning,
      },
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'CheckIn',
      entityId: result.id,
      meta: { memberId, warning: result.warning, roomTypeId: access.roomTypeId ?? null },
    });
    return result;
  });

async function loadSession(db, id, context) {
  const session = await db.classSession.findUnique({ where: { id }, include: { gymClass: true } });
  if (!session) throw ApiError.notFound('Không tìm thấy buổi học');
  if (
    !context.permissions.has(P.ATTENDANCE_MANAGE) &&
    (session.coachId ?? session.gymClass.coachId) !== context.user.id
  )
    throw ApiError.forbidden();
  return session;
}

/** Roster từng buổi: chỉ hội viên đã đăng ký trước giờ bắt đầu, giữ lịch sử sau khi huỷ lớp. */
export const roster = async (id, context) => {
  const session = await loadSession(prisma, id, context);
  const items = await prisma.classEnrollment.findMany({
    where: {
      classId: session.classId,
      enrolledAt: { lte: session.startAt },
      OR: [{ cancelledAt: null }, { cancelledAt: { gt: session.startAt } }],
    },
    select: { member: { select: { id: true, fullName: true } }, status: true },
  });
  const attendance = await prisma.attendance.findMany({
    where: { sessionId: id },
    include: { member: { select: { id: true, fullName: true } } },
  });
  // Đăng ký lại lớp ghi đè enrolledAt; người đã có điểm danh ở buổi này vẫn phải hiện trong roster.
  const listed = new Set(items.map((item) => item.member.id));
  const recorded = attendance
    .filter((row) => !listed.has(row.memberId))
    .map((row) => ({ member: row.member, status: Enums.EnrollmentStatus.BOOKED }));
  return {
    session,
    items: [...items, ...recorded],
    attendance: attendance.map(({ member: _member, ...row }) => row),
  };
};

async function assertEditable(session, now) {
  if (
    session.status === Enums.SessionStatus.CANCELLED ||
    session.gymClass.status === Enums.ClassStatus.CANCELLED
  )
    throw ApiError.businessRule('Không điểm danh buổi đã huỷ');
  if (session.startAt > now) throw ApiError.businessRule('Buổi học chưa bắt đầu');
  const hours = await settings.getValue(K.ATTENDANCE_EDIT_HOURS);
  const deadline = new Date(session.endAt.getTime() + hours * TIME.MS_PER_HOUR);
  if (now > deadline && !(session.attendanceUnlockedUntil > now))
    throw ApiError.businessRule('Đã quá hạn điểm danh; cần quản lý mở quyền sửa');
}

/** UC-AT-02: danh sách được kiểm tra toàn bộ trước khi ghi, audit và no-show cùng transaction. */
export const record = (id, entries, context) =>
  withScheduleTransaction(async (db) => {
    const session = await loadSession(db, id, context);
    const now = new Date();
    await assertEditable(session, now);
    const eligible = await db.classEnrollment.findMany({
      where: {
        classId: session.classId,
        memberId: { in: entries.map((e) => e.memberId) },
        enrolledAt: { lte: session.startAt },
        OR: [{ cancelledAt: null }, { cancelledAt: { gt: session.startAt } }],
      },
    });
    const recorded = await db.attendance.findMany({
      where: { sessionId: id, memberId: { in: entries.map((e) => e.memberId) } },
      select: { memberId: true },
    });
    const allowed = new Set([...eligible, ...recorded].map((row) => row.memberId));
    if (entries.some((entry) => !allowed.has(entry.memberId)))
      throw ApiError.businessRule('Có hội viên chưa đăng ký buổi này');
    const result = [];
    for (const entry of entries) {
      if (entry.status === Enums.AttendanceStatus.ABSENT && session.endAt > now)
        throw ApiError.businessRule('Chỉ ghi vắng khi buổi học đã kết thúc');
      const before = await db.attendance.findUnique({
        where: { sessionId_memberId: { sessionId: id, memberId: entry.memberId } },
      });
      // Đã báo nghỉ trước hạn thì không bị ghi vắng (BR-2.17); đến học vẫn ghi có mặt được.
      if (
        before?.status === Enums.AttendanceStatus.EXCUSED &&
        entry.status === Enums.AttendanceStatus.ABSENT
      ) {
        result.push(before);
        continue;
      }
      const item = await db.attendance.upsert({
        where: { sessionId_memberId: { sessionId: id, memberId: entry.memberId } },
        create: { sessionId: id, ...entry, actorId: context.user.id },
        update: { status: entry.status, actorId: context.user.id },
      });
      await writeScheduleAudit(db, context.user, {
        action: AUDIT_ACTIONS.UPDATE,
        entity: 'Attendance',
        entityId: item.id,
        meta: { before: before?.status ?? null, after: item.status },
      });
      await refreshNoShowBlock(db, entry.memberId, now);
      result.push(item);
    }
    return result;
  });

/** Chỉ permission attendance.manage mở hạn sửa, không tự bỏ qua hạn ở API điểm danh. */
export const unlock = (id, reason, context) =>
  withScheduleTransaction(async (db) => {
    await loadSession(db, id, context);
    const hours = await settings.getValue(K.ATTENDANCE_EDIT_HOURS);
    const item = await db.classSession.update({
      where: { id },
      data: {
        attendanceUnlockedUntil: new Date(Date.now() + hours * TIME.MS_PER_HOUR),
      },
    });
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'ClassSession',
      entityId: id,
      meta: { reason, attendanceUnlockedUntil: item.attendanceUnlockedUntil.toISOString() },
    });
    return item;
  });
