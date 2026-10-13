import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { prisma } from '../../config/db.js';

/** Roster chỉ cho người quản lý hoặc HLV thực sự phụ trách, kể cả đoán id URL. */
export const getRoster = async (classId, { user, permissions }) => {
  const item = await prisma.gymClass.findUnique({ where: { id: classId } });
  if (!item) throw ApiError.notFound('Không tìm thấy lớp');
  if (!permissions.has(P.CLASS_READ_ALL) && item.coachId !== user.id) throw ApiError.forbidden();
  const items = await prisma.classEnrollment.findMany({
    where: { classId },
    orderBy: { enrolledAt: 'asc' },
    select: {
      id: true,
      status: true,
      enrolledAt: true,
      cancelledAt: true,
      enrolledBy: true,
      cancelledBy: true,
      member: { select: { id: true, fullName: true, email: true, phone: true } },
    },
  });
  const history = await prisma.auditLog.findMany({
    where: { entity: 'ClassEnrollment', entityId: { in: items.map((e) => String(e.id)) } },
    select: { id: true, action: true, userId: true, entityId: true, meta: true, createdAt: true },
    orderBy: { id: 'desc' },
  });
  return { items, history };
};
