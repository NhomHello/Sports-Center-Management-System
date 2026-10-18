import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { prisma } from '../../config/db.js';
import { teaches } from './class-read.service.js';

/** Roster chỉ cho người quản lý hoặc HLV thực sự phụ trách, kể cả đoán id URL. */
export const getRoster = async (classId, { user, permissions }) => {
  const item = await prisma.gymClass.findUnique({
    where: { id: classId },
    include: { sessions: { select: { coachId: true, status: true } } },
  });
  if (!item) throw ApiError.notFound('Không tìm thấy lớp');
  if (!permissions.has(P.CLASS_READ_ALL) && !teaches(item, user.id)) throw ApiError.forbidden();
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
  const actors = await prisma.user.findMany({
    where: { id: { in: [...new Set(history.map((h) => h.userId).filter(Boolean))] } },
    select: { id: true, fullName: true, role: { select: { name: true } } },
  });
  return {
    items,
    history: history.map((h) => ({ ...h, actor: actors.find((a) => a.id === h.userId) ?? null })),
  };
};
