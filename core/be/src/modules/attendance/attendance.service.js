import {
  loadStaffSession as loadSession,
  sessionMemberScope,
} from '../../common/utils/session-access.js';
import { randomUUID } from 'node:crypto';
import { SETTING_KEYS as K } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, TIME } from '../../constants/index.js';
import * as settings from '../setting/setting.service.js';
import { refreshNoShowBlock } from './no-show.service.js';

/** Check-in ghi nhận hội viên đến trung tâm; quyền học vẫn theo đăng ký khóa đã thanh toán. */
export const checkIn = (memberId, actor) =>
  withScheduleTransaction(async (db) => {
    const member = await db.user.findUnique({ where: { id: memberId } });
    if (!member) throw ApiError.notFound('Không tìm thấy hội viên');
    if (member.status !== Enums.UserStatus.ACTIVE) throw ApiError.businessRule('Tài khoản bị khóa');
    const courses = await db.classEnrollment.count({
      where: {
        memberId,
        status: Enums.EnrollmentStatus.BOOKED,
        gymClass: { status: { in: [Enums.ClassStatus.OPEN, Enums.ClassStatus.CLOSED] } },
      },
    });
    const result = await db.checkIn.create({
      data: {
        memberId,
        actorId: actor.id,
        kind: Enums.CheckInKind.GENERAL,
        code: randomUUID(),
        warning: courses ? null : 'Hội viên chưa có khóa học đang đăng ký',
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

/** Roster từng buổi: chỉ hội viên đã đăng ký trước giờ bắt đầu, giữ lịch sử sau khi huỷ lớp. */
export const roster = async (id, context) => {
  const session = await loadSession(prisma, id, context);
  const items = await prisma.classEnrollment.findMany({
    where: {
      ...sessionMemberScope(session),
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
  if (session.endAt <= now && !(session.attendanceUnlockedUntil > now))
    throw ApiError.businessRule('Buổi học đã kết thúc; cần quản lý mở quyền sửa');
}

/** UC-AT-02: danh sách được kiểm tra toàn bộ trước khi ghi, audit và no-show cùng transaction. */
export const record = (id, entries, context) =>
  withScheduleTransaction(async (db) => {
    const session = await loadSession(db, id, context);
    const now = new Date();
    await assertEditable(session, now);
    const eligible = await db.classEnrollment.findMany({
      where: {
        ...sessionMemberScope(session),
        memberId: { in: entries.map((e) => e.memberId) },
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
