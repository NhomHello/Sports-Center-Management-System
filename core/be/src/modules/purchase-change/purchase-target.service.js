import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { getClassActions } from '../class/class-booking-policy.service.js';
import { CLASS_INCLUDE, coursePricing } from '../class/class.mapper.js';

/** Gói đích phải đang bán và khác gói của kỳ đang dùng. */
export const loadTargetPlan = async (db, planId, period) => {
  if (planId === period.planId) throw ApiError.businessRule('Hãy chọn gói khác gói đang dùng');
  const plan = await db.membershipPlan.findUnique({ where: { id: planId } });
  if (!plan) throw ApiError.notFound('Không tìm thấy gói tập');
  if (!plan.isActive || plan.status !== Enums.MembershipPlanStatus.SELLING)
    throw ApiError.businessRule('Gói tập đã ngừng bán');
  return plan;
};

/**
 * Lớp đích phải nhận được hội viên (còn chỗ, mở đăng ký, không trùng lịch với lớp khác ngoài lớp
 * đang rời đi). Giá lớp mới tính theo số buổi còn lại.
 */
export const loadTargetClass = async (db, classId, enrollment) => {
  if (classId === enrollment.classId) throw ApiError.businessRule('Hãy chọn lớp khác lớp đang học');
  const target = await db.gymClass.findUnique({ where: { id: classId }, include: CLASS_INCLUDE });
  if (!target) throw ApiError.notFound('Không tìm thấy lớp');
  const state = await getClassActions(
    db,
    { ...target, ignoreClassIds: [enrollment.classId] },
    enrollment.memberId,
  );
  if (!state.canEnroll) throw ApiError.businessRule(state.enrollReason);
  return { ...target, pricing: coursePricing(target) };
};

/** Giữ chỗ ở lớp đích trong lúc chờ thu chênh lệch (như mua khóa học). */
export const holdTargetSeat = (db, { target, memberId, invoice, actor }) => {
  const hold = {
    status: Enums.EnrollmentStatus.PENDING_PAYMENT,
    enrolledBy: actor.id,
    invoiceId: invoice.id,
    holdExpiresAt: invoice.channel === Enums.InvoiceChannel.ONLINE ? invoice.expiresAt : null,
  };
  return db.classEnrollment.upsert({
    where: { classId_memberId: { classId: target.id, memberId } },
    create: { classId: target.id, memberId, ...hold },
    update: {
      ...hold,
      enrolledAt: new Date(),
      cancelledAt: null,
      cancelledBy: null,
      exceptionUntil: null,
    },
  });
};
