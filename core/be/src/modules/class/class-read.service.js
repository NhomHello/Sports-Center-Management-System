import { PERMISSIONS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { CLASS_INCLUDE, PUBLIC_PERSON, toClassView } from './class.mapper.js';
import { vietnamMidnight } from './class-schedule.service.js';

/** Phạm vi management luôn kiểm tra lại ở server, không tin bộ lọc của FE. */
export const managementScope = ({ user, permissions }) => {
  if (permissions.has(PERMISSIONS.CLASS_READ_ALL)) return {};
  if (permissions.has(PERMISSIONS.SCHEDULE_VIEW_TEACHING)) return { coachId: user.id };
  throw ApiError.forbidden();
};

/** Chỉ nhân viên có quyền xử lý booking được đánh giá điều kiện của hội viên khác. */
export const resolveBookingMember = (query, context) => {
  if (query.memberId === undefined) return context.user.id;
  if (!context.permissions.has(PERMISSIONS.CLASS_ENROLL_FOR_MEMBER) &&
    !context.permissions.has(PERMISSIONS.CLASS_READ_ALL)) throw ApiError.forbidden();
  return query.memberId;
};

/** Bộ lọc quản lý chỉ chứa tài nguyên trong phạm vi lớp được phép xem. */
export const getFilters = async (context) => {
  const rows = await prisma.gymClass.findMany({ where: managementScope(context),
    select: { subject: { select: { id: true, name: true } }, coach: { select: PUBLIC_PERSON } } });
  return {
    subjects: [...new Map(rows.map((r) => [r.subject.id, r.subject])).values()],
    coaches: [...new Map(rows.map((r) => [r.coach.id, r.coach])).values()],
  };
};

/** Phân trang có điều kiện ngày/trạng thái/bộ môn/HLV và phạm vi quyền. */
export const list = async (query, context) => {
  const now = new Date();
  const scope =
    query.scope === 'management'
      ? managementScope(context)
      : {
          status: Enums.ClassStatus.OPEN,
          registrationStartAt: { lte: now },
          registrationEndAt: { gt: now },
        };
  const where = {
    AND: [
      scope,
      ...(context.permissions.has(PERMISSIONS.SCHEDULE_VIEW_TEACHING) &&
      !context.permissions.has(PERMISSIONS.CLASS_READ_ALL)
        ? [{ coachId: context.user.id }]
        : []),
      {
        ...(query.status && { status: query.status }),
        ...(query.subjectId && { subjectId: query.subjectId }),
        ...(query.coachId && { coachId: query.coachId }),
        ...(query.search && { name: { contains: query.search } }),
        ...(query.date && {
          sessions: {
            some: {
              startAt: {
                gte: vietnamMidnight(query.date),
                lt: new Date(vietnamMidnight(query.date).getTime() + TIME.MS_PER_DAY),
              },
              status: { not: Enums.SessionStatus.CANCELLED },
            },
          },
        }),
      },
    ],
  };
  const [items, total] = await prisma.$transaction([
    prisma.gymClass.findMany({
      where,
      include: CLASS_INCLUDE,
      ...toPrismaPage(query),
      orderBy: { id: 'desc' },
    }),
    prisma.gymClass.count({ where }),
  ]);
  return { data: items.map(toClassView), meta: buildPageMeta({ ...query, total }) };
};

/** Lớp không mở chỉ đọc được khi phụ trách, quản lý hoặc đã có đăng ký của chính mình. */
export const getById = async (id, context) => {
  const item = await prisma.gymClass.findUnique({ where: { id }, include: CLASS_INCLUDE });
  if (!item) throw ApiError.notFound('Không tìm thấy lớp');
  const enrolled = await prisma.classEnrollment.findUnique({
    where: { classId_memberId: { classId: id, memberId: context.user.id } },
  });
  const privileged =
    context.permissions.has(PERMISSIONS.CLASS_READ_ALL) ||
    (context.permissions.has(PERMISSIONS.SCHEDULE_VIEW_TEACHING) &&
      item.coachId === context.user.id);
  if (context.permissions.has(PERMISSIONS.SCHEDULE_VIEW_TEACHING) && !privileged)
    throw ApiError.forbidden();
  if (!privileged && !enrolled && item.status !== Enums.ClassStatus.OPEN)
    throw ApiError.forbidden();
  const events = await prisma.classEvent.findMany({
    where: { classId: id },
    select: { id: true, kind: true, title: true, message: true, changes: true, createdAt: true },
    orderBy: { id: 'desc' },
  });
  return { ...toClassView(item), events };
};

/** Danh sách chọn HLV dựa vào permission giảng dạy, không so sánh tên role. */
export const listCoaches = () =>
  prisma.user.findMany({
    where: {
      status: Enums.UserStatus.ACTIVE,
      role: { permissions: { some: { permission: { code: PERMISSIONS.SCHEDULE_VIEW_TEACHING } } } },
    },
    select: PUBLIC_PERSON,
    orderBy: { fullName: 'asc' },
  });
