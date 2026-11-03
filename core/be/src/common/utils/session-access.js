import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../errors/api-error.js';
import { Enums } from '../../config/db.js';

/** Phạm vi dựa trên HLV từng buổi; không dựa vào vai trò hoặc HLV hiện tại của lớp. */
export const loadStaffSession = async (
  db,
  id,
  context,
  managerPermission = P.ATTENDANCE_MANAGE,
) => {
  const session = await db.classSession.findUnique({ where: { id }, include: { gymClass: true } });
  if (!session) throw ApiError.notFound('Không tìm thấy buổi học');
  if (
    !context.permissions.has(managerPermission) &&
    (session.coachId ?? session.gymClass.coachId) !== context.user.id
  )
    throw ApiError.forbidden();
  return session;
};

/** Chỉ người có đăng ký chính thức lúc bắt đầu buổi, hoặc kết quả điểm danh lịch sử của buổi. */
export const sessionMemberScope = (session) => ({
  classId: session.classId,
  enrolledAt: { lte: session.startAt },
  OR: [
    { status: Enums.EnrollmentStatus.BOOKED },
    { status: Enums.EnrollmentStatus.CANCELLED, cancelledAt: { gt: session.startAt } },
  ],
});
