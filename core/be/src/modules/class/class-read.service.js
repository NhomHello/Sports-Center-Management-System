import { PERMISSIONS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { Enums, prisma } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { CLASS_INCLUDE, PUBLIC_PERSON, toClassView } from './class.mapper.js';
import { vietnamMidnight } from './class-schedule.service.js';

/** Phạm vi management luôn kiểm tra lại ở server, không tin bộ lọc của FE. */
/**
 * HLV phụ trách lớp là HLV mặc định hoặc HLV được đổi sang dạy một số buổi còn hiệu lực;
 * đổi HLV một phần không làm HLV mới mất quyền xem lớp và danh sách học viên.
 * @param {number} userId
 */
export const teachingScope = (userId) => ({
  OR: [
    { coachId: userId },
    { sessions: { some: { coachId: userId, status: { not: Enums.SessionStatus.CANCELLED } } } },
  ],
});

/** Bản kiểm tra trong bộ nhớ của teachingScope cho lớp đã nạp kèm sessions. */
export const teaches = (item, userId) =>
  item.coachId === userId ||
  (item.sessions ?? []).some(
    (s) => s.coachId === userId && s.status !== Enums.SessionStatus.CANCELLED,
  );

/** Phạm vi "Quản lý lớp": quản lý thấy mọi lớp, HLV thấy lớp mình dạy. */
export const managementScope = ({ user, permissions }) => {
  if (permissions.has(PERMISSIONS.CLASS_READ_ALL)) return {};
  if (permissions.has(PERMISSIONS.SCHEDULE_VIEW_TEACHING)) return teachingScope(user.id);
  throw ApiError.forbidden();
};

/** Chỉ nhân viên có quyền xử lý booking được đánh giá điều kiện của hội viên khác. */
export const resolveBookingMember = (query, context) => {
  if (query.memberId === undefined) return context.user.id;
  if (
    !context.permissions.has(PERMISSIONS.CLASS_ENROLL_FOR_MEMBER) &&
    !context.permissions.has(PERMISSIONS.CLASS_READ_ALL)
  )
    throw ApiError.forbidden();
  return query.memberId;
};

/** Bộ lọc quản lý chỉ chứa tài nguyên trong phạm vi lớp được phép xem. */
export const getFilters = async (context) => {
  const rows = await prisma.gymClass.findMany({
    where:
      context.permissions.has(PERMISSIONS.CLASS_READ_ALL) ||
      context.permissions.has(PERMISSIONS.SCHEDULE_VIEW_TEACHING)
        ? managementScope(context)
        : { status: Enums.ClassStatus.OPEN },
    select: {
      subject: { select: { id: true, name: true } },
      coach: { select: PUBLIC_PERSON },
      room: { select: { id: true, name: true } },
      sessions: {
        select: { room: { select: { id: true, name: true } }, coach: { select: PUBLIC_PERSON } },
      },
    },
  });
  const unique = (items) => [...new Map(items.filter(Boolean).map((i) => [i.id, i])).values()];
  return {
    subjects: unique(rows.map((r) => r.subject)),
    rooms: unique(rows.flatMap((r) => [r.room, ...r.sessions.map((s) => s.room)])),
    coaches: unique(rows.flatMap((r) => [r.coach, ...r.sessions.map((s) => s.coach)])),
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
        ? [teachingScope(context.user.id)]
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

const canManageClass = (item, context) =>
  context.permissions.has(PERMISSIONS.CLASS_READ_ALL) ||
  (context.permissions.has(PERMISSIONS.SCHEDULE_VIEW_TEACHING) && teaches(item, context.user.id));

/** Lớp không mở chỉ đọc được khi phụ trách, quản lý hoặc đã có đăng ký được phép xử lý. */
export const getById = async (id, context, memberId = context.user.id) => {
  const bookingMemberId = resolveBookingMember(
    memberId === context.user.id ? {} : { memberId },
    context,
  );
  const item = await prisma.gymClass.findUnique({ where: { id }, include: CLASS_INCLUDE });
  if (!item) throw ApiError.notFound('Không tìm thấy lớp');
  const enrolled = await prisma.classEnrollment.findUnique({
    where: { classId_memberId: { classId: id, memberId: bookingMemberId } },
  });
  const privileged = canManageClass(item, context);
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
export const listCoaches = async () =>
  (
    await prisma.user.findMany({
      where: {
        status: Enums.UserStatus.ACTIVE,
        // HLV = có quyền xem lịch dạy và đã khai báo chuyên môn (bộ môn dạy được).
        role: {
          permissions: { some: { permission: { code: PERMISSIONS.SCHEDULE_VIEW_TEACHING } } },
        },
        coachSubjects: { some: {} },
      },
      select: { ...PUBLIC_PERSON, coachSubjects: { select: { subjectId: true } } },
      orderBy: { fullName: 'asc' },
    })
  ).map(({ coachSubjects, ...coach }) => ({
    ...coach,
    subjectIds: coachSubjects.map((row) => row.subjectId),
  }));
