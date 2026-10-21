import { PERMISSIONS as P, SETTING_KEYS as K } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { vietnamDateTime } from '../../common/utils/vietnam-date.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS, TIME } from '../../constants/index.js';
import * as settings from '../setting/setting.service.js';

/** Hội viên báo nghỉ cho chính mình; nhân viên có quyền đăng ký hộ thì báo nghỉ thay. */
const targetMember = (memberId, context) => {
  if (!memberId || memberId === context.user.id) {
    if (!context.permissions.has(P.CLASS_CANCEL_SELF)) throw ApiError.forbidden();
    return context.user.id;
  }
  if (!context.permissions.has(P.CLASS_ENROLL_FOR_MEMBER)) throw ApiError.forbidden();
  return memberId;
};

async function assertExcusable(db, session, now) {
  if (
    session.status !== Enums.SessionStatus.SCHEDULED ||
    session.gymClass.status === Enums.ClassStatus.CANCELLED
  )
    throw ApiError.businessRule('Buổi học không còn theo lịch');
  const hours = await settings.getValue(K.CLASS_CANCEL_MIN_HOURS_BEFORE);
  const deadline = new Date(session.startAt.getTime() - hours * TIME.MS_PER_HOUR);
  if (now > deadline)
    throw ApiError.businessRule(`Đã quá hạn báo nghỉ (trước ${vietnamDateTime(deadline)})`);
}

/**
 * GY-30 / BR-2.17: báo nghỉ một buổi trước hạn — buổi ghi "Xin nghỉ" (EXCUSED), không tính vắng,
 * không hủy đăng ký cả khóa và không phát sinh tiền.
 * @param {number} sessionId
 * @param {{ memberId?: number }} input
 * @param {{ user: { id: number }, permissions: Set<string> }} context
 */
export const excuseSession = (sessionId, { memberId }, context) =>
  withScheduleTransaction(async (db) => {
    const member = targetMember(memberId, context);
    const session = await db.classSession.findUnique({
      where: { id: sessionId },
      include: { gymClass: true },
    });
    if (!session) throw ApiError.notFound('Không tìm thấy buổi học');
    const now = new Date();
    await assertExcusable(db, session, now);
    const enrollment = await db.classEnrollment.findUnique({
      where: { classId_memberId: { classId: session.classId, memberId: member } },
    });
    if (enrollment?.status !== Enums.EnrollmentStatus.BOOKED)
      throw ApiError.businessRule('Hội viên chưa đăng ký lớp của buổi này');
    const key = { sessionId_memberId: { sessionId, memberId: member } };
    const existing = await db.attendance.findUnique({ where: key });
    if (existing?.status === Enums.AttendanceStatus.EXCUSED) return existing;
    const item = await db.attendance.upsert({
      where: key,
      create: {
        sessionId,
        memberId: member,
        status: Enums.AttendanceStatus.EXCUSED,
        excusedAt: now,
        actorId: context.user.id,
      },
      update: { status: Enums.AttendanceStatus.EXCUSED, excusedAt: now, actorId: context.user.id },
    });
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'Attendance',
      entityId: item.id,
      meta: { before: existing?.status ?? null, after: item.status, reason: 'EXCUSE' },
    });
    return item;
  });
