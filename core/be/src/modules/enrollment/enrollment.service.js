import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES, TIME } from '../../constants/index.js';
import * as settingService from '../setting/setting.service.js';
import {
  assertActiveMembership,
  assertCapacity,
  assertNoOverlap,
  assertOpenForBooking,
  lockSession,
} from './enrollment-rules.service.js';

const auditInTx = (tx, { userId, entityId, meta }) =>
  tx.auditLog.create({
    data: {
      userId,
      action: AUDIT_ACTIONS.UPDATE,
      entity: ENTITIES.ENROLLMENT,
      entityId: String(entityId),
      meta,
    },
  });

const toResult = (enrollment) => ({
  id: enrollment.id,
  sessionId: enrollment.sessionId,
  memberId: enrollment.userId,
  status: enrollment.status,
  enrolledBy: enrollment.enrolledById,
  cancelledBy: enrollment.cancelledById,
  cancelledAt: enrollment.cancelledAt,
});

/**
 * UC-CB-06/09: đặt chỗ một buổi học. Hội viên tự đặt (actorId === memberId, enrolledBy = null)
 * hoặc nhân viên đặt hộ (enrolledBy = nhân viên); cùng một bộ kiểm tra.
 * @param {{ sessionId: number, memberId: number, actorId: number }} input
 */
export const enroll = async ({ sessionId, memberId, actorId }) => {
  const now = new Date();
  const enrollment = await prisma.$transaction(async (tx) => {
    const session = await lockSession(tx, sessionId);
    const member = await tx.user.findFirst({
      where: { id: memberId, status: Enums.UserStatus.ACTIVE },
      select: { id: true },
    });
    if (!member) throw ApiError.notFound('Không tìm thấy hội viên');
    assertOpenForBooking(session, now);

    const existing = await tx.enrollment.findUnique({
      where: { sessionId_userId: { sessionId, userId: memberId } },
    });
    if (existing?.status === Enums.EnrollmentStatus.BOOKED) {
      throw ApiError.conflict('Hội viên đã đăng ký buổi học này');
    }
    await assertActiveMembership(tx, memberId, now);
    await assertCapacity(tx, session);
    await assertNoOverlap(tx, session, memberId);

    const data = {
      status: Enums.EnrollmentStatus.BOOKED,
      enrolledById: actorId === memberId ? null : actorId,
      cancelledById: null,
      cancelledAt: null,
    };
    const saved = existing
      ? await tx.enrollment.update({ where: { id: existing.id }, data })
      : await tx.enrollment.create({ data: { ...data, sessionId, userId: memberId } });
    await auditInTx(tx, {
      userId: actorId,
      entityId: saved.id,
      meta: { action: 'ENROLL', sessionId, memberId, onBehalf: actorId !== memberId },
    });
    return saved;
  });
  return toResult(enrollment);
};

/**
 * UC-CB-07/10: huỷ đặt chỗ. Nhân viên không có đặc quyền: cùng mốc N giờ (BR-2.5/2.14),
 * so sánh >= trên thời điểm tuyệt đối nên không phụ thuộc múi giờ.
 * @param {{ sessionId: number, memberId: number, actorId: number }} input
 */
export const cancel = async ({ sessionId, memberId, actorId }) => {
  const minHours = await settingService.getValue(SETTING_KEYS.CLASS_CANCEL_MIN_HOURS_BEFORE);
  const now = new Date();
  const enrollment = await prisma.$transaction(async (tx) => {
    const session = await lockSession(tx, sessionId);
    const existing = await tx.enrollment.findUnique({
      where: { sessionId_userId: { sessionId, userId: memberId } },
    });
    if (existing?.status !== Enums.EnrollmentStatus.BOOKED) {
      throw ApiError.notFound('Không tìm thấy đăng ký đang hiệu lực của buổi học này');
    }
    if (session.startAt.getTime() - now.getTime() < minHours * TIME.MS_PER_HOUR) {
      throw ApiError.businessRule(`Chỉ được huỷ trước giờ học tối thiểu ${minHours} giờ`);
    }
    const saved = await tx.enrollment.update({
      where: { id: existing.id },
      data: {
        status: Enums.EnrollmentStatus.CANCELLED,
        cancelledAt: now,
        cancelledById: actorId === memberId ? null : actorId,
      },
    });
    await auditInTx(tx, {
      userId: actorId,
      entityId: saved.id,
      meta: { action: 'CANCEL', sessionId, memberId, onBehalf: actorId !== memberId },
    });
    return saved;
  });
  return toResult(enrollment);
};
