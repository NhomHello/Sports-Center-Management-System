import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { getClassActions, enrichClassView } from './class-booking-policy.service.js';
import { CLASS_INCLUDE, toClassView } from './class.mapper.js';

async function loadClass(db, id) {
  const item = await db.gymClass.findUnique({ where: { id }, include: CLASS_INCLUDE });
  if (!item) throw ApiError.notFound('Không tìm thấy lớp');
  return item;
}

/** BR-2.1/2.2/2.3: cùng luật cho tự đăng ký và đăng ký hộ, ghi rõ actor. */
export const enroll = (classId, memberId, actor) =>
  withScheduleTransaction(async (db) => {
    const item = await loadClass(db, classId);
    const state = await getClassActions(db, item, memberId);
    if (state.enrollment?.status === Enums.EnrollmentStatus.BOOKED) {
      throw ApiError.conflict('Hội viên đã đăng ký lớp này');
    }
    if (!state.canEnroll) throw ApiError.businessRule(state.enrollReason);
    const enrollment = await db.classEnrollment.upsert({
      where: { classId_memberId: { classId, memberId } },
      create: { classId, memberId, enrolledBy: actor.id },
      update: {
        status: Enums.EnrollmentStatus.BOOKED,
        enrolledBy: actor.id,
        enrolledAt: new Date(),
        cancelledBy: null,
        cancelledAt: null,
        exceptionUntil: null,
      },
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.CREATE,
      entity: 'ClassEnrollment',
      entityId: enrollment.id,
      meta: { classId, memberId },
    });
    return enrollment;
  });

/** Huỷ lại giữ nguyên actor/thời gian cũ; lỗi/huỷ quá hạn không ghi dữ liệu. */
export const cancel = (classId, memberId, actor) =>
  withScheduleTransaction(async (db) => {
    const item = await loadClass(db, classId);
    const state = await getClassActions(db, item, memberId);
    if (!state.enrollment) throw ApiError.notFound('Không tìm thấy đăng ký');
    if (state.enrollment.status === Enums.EnrollmentStatus.CANCELLED) return state.enrollment;
    if (!state.canCancel) throw ApiError.businessRule(state.cancelReason);
    const enrollment = await db.classEnrollment.update({
      where: { id: state.enrollment.id },
      data: {
        status: Enums.EnrollmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: actor.id,
        exceptionUntil: null,
      },
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.DELETE,
      entity: 'ClassEnrollment',
      entityId: enrollment.id,
      meta: { classId, memberId },
    });
    return enrollment;
  });

/** Danh sách đăng ký của hội viên được chọn bởi nhân viên có quyền xử lý booking. */
export const listForMember = async (memberId) => {
  if (!(await prisma.user.findUnique({ where: { id: memberId } })))
    throw ApiError.notFound('Không tìm thấy hội viên');
  const rows = await prisma.classEnrollment.findMany({
    where: { memberId },
    include: { gymClass: { include: CLASS_INCLUDE } },
    orderBy: { id: 'desc' },
  });
  return Promise.all(rows.map((row) => enrichClassView(toClassView(row.gymClass), memberId)));
};
