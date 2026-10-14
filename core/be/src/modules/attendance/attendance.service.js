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
import { isFrozen, completeDueFreezes } from '../membership/membership-freeze.service.js';
import { refreshNoShowBlock } from './no-show.service.js';

/** Check-in tại quầy không kích hoạt membership, gói bảo lưu/tài khoản khoá bị từ chối. */
export const checkIn = (memberId, actor) =>
  withScheduleTransaction(async (db) => {
    const member = await db.user.findUnique({ where: { id: memberId } });
    if (!member) throw ApiError.notFound('Không tìm thấy hội viên');
    if (member.status !== Enums.UserStatus.ACTIVE) throw ApiError.businessRule('Tài khoản bị khoá');
    const now = new Date();
    await completeDueFreezes(db, memberId, now);
    const item = await db.membership.findFirst({
      where: { userId: memberId, startDate: { lte: now } },
      orderBy: { endDate: 'desc' },
      include: { freezes: true },
    });
    if (item?.freezes.some((f) => isFrozen(f, now)))
      throw ApiError.businessRule('Gói đang bảo lưu');
    const expired = !item || item.status !== Enums.MembershipStatus.ACTIVE || item.endDate <= now;
    if (expired && !(await settings.getValue(K.CHECKIN_ALLOW_EXPIRED)))
      throw ApiError.businessRule('Cần gói còn hiệu lực để check-in');
    const result = await db.checkIn.create({
      data: {
        memberId,
        actorId: actor.id,
        kind: Enums.CheckInKind.GENERAL,
        code: randomUUID(),
        warning: expired ? 'Gói đã hết hạn hoặc chưa có gói' : null,
      },
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'CheckIn',
      entityId: result.id,
      meta: { memberId, warning: result.warning },
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
  return {
    session,
    items,
    attendance: await prisma.attendance.findMany({ where: { sessionId: id } }),
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
    if (eligible.length !== entries.length)
      throw ApiError.businessRule('Có hội viên chưa đăng ký buổi này');
    const result = [];
    for (const entry of entries) {
      if (entry.status === Enums.AttendanceStatus.ABSENT && session.endAt > now)
        throw ApiError.businessRule('Chỉ ghi vắng khi buổi học đã kết thúc');
      const before = await db.attendance.findUnique({
        where: { sessionId_memberId: { sessionId: id, memberId: entry.memberId } },
      });
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
