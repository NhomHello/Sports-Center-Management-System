import { ApiError } from '../../common/errors/api-error.js';

/**
 * Phạm vi xem lớp: người có `class.read_all` xem mọi lớp; còn lại (coach) chỉ xem lớp mình phụ trách.
 * @param {{ userId: number, canReadAll: boolean }} actor
 * @param {number} coachId coach phụ trách lớp
 */
export const assertInScope = ({ userId, canReadAll }, coachId) => {
  if (!canReadAll && coachId !== userId) throw ApiError.forbidden();
};

/** Thông tin hội viên hiển thị theo phạm vi: quản lý thấy liên hệ, coach chỉ thấy tối thiểu để điểm danh. */
export const toMemberView = (user, { canReadAll }) => ({
  id: user.id,
  fullName: user.fullName,
  ...(canReadAll && { email: user.email, phone: user.phone }),
});
