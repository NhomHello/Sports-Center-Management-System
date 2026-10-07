import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { vnRange } from '../../common/utils/vn-date.js';
import { Enums, prisma } from '../../config/db.js';
import { assertInScope, toMemberView } from './class-scope.js';

const MEMBER_FIELDS = { select: { id: true, fullName: true, email: true, phone: true } };
const BRIEF = {
  subject: { select: { id: true, name: true } },
  room: { select: { id: true, name: true, capacity: true } },
  coach: { select: { id: true, fullName: true } },
};

/**
 * UC-CB-17 (màn S25): danh sách lớp trong phạm vi được phân quyền. Coach không có `class.read_all`
 * luôn bị ép về lớp của mình; lọc coach khác bị từ chối thay vì trả danh sách rỗng gây hiểu nhầm.
 * @param {{ userId: number, canReadAll: boolean }} actor
 * @param {{ page: number, pageSize: number, date?: string, status?: string, subjectId?: number, coachId?: number, search?: string }} query
 */
export const listClasses = async (actor, query) => {
  if (!actor.canReadAll && query.coachId && query.coachId !== actor.userId) {
    throw ApiError.forbidden();
  }
  const where = {
    coachId: actor.canReadAll ? query.coachId : actor.userId,
    ...(query.status && { status: query.status }),
    ...(query.subjectId && { subjectId: query.subjectId }),
    ...(query.search && { name: { contains: query.search } }),
    ...(query.date && {
      sessions: {
        some: {
          startAt: {
            gte: vnRange(query.date, query.date).start,
            lt: vnRange(query.date, query.date).end,
          },
        },
      },
    }),
  };
  const [total, rows] = await Promise.all([
    prisma.gymClass.count({ where }),
    prisma.gymClass.findMany({
      where,
      ...toPrismaPage(query),
      orderBy: [{ startsOn: 'desc' }, { id: 'desc' }],
      include: { ...BRIEF, _count: { select: { sessions: true } } },
    }),
  ]);
  const data = rows.map(({ _count, ...gymClass }) => ({
    ...gymClass,
    sessionCount: _count.sessions,
  }));
  return { data, meta: buildPageMeta({ ...query, total }) };
};

/**
 * UC-CB-17 (màn S26): chi tiết lớp gồm từng buổi, số chỗ và danh sách hội viên kèm trạng thái
 * booking. Chỉ đọc, không xoá lịch sử đăng ký đã huỷ.
 * @param {{ userId: number, canReadAll: boolean }} actor
 * @param {number} classId
 */
export const getClassDetail = async (actor, classId) => {
  const gymClass = await prisma.gymClass.findUnique({
    where: { id: classId },
    include: {
      ...BRIEF,
      sessions: {
        orderBy: { startAt: 'asc' },
        include: {
          enrollments: {
            orderBy: { createdAt: 'asc' },
            include: {
              user: MEMBER_FIELDS,
              enrolledBy: { select: { id: true, fullName: true } },
              cancelledBy: { select: { id: true, fullName: true } },
            },
          },
        },
      },
    },
  });
  if (!gymClass) throw ApiError.notFound('Không tìm thấy lớp');
  assertInScope(actor, gymClass.coachId);

  const sessions = gymClass.sessions.map(({ enrollments, ...session }) => ({
    ...session,
    bookedCount: enrollments.filter((item) => item.status === Enums.EnrollmentStatus.BOOKED).length,
    enrollments: enrollments.map((item) => ({
      id: item.id,
      status: item.status,
      member: toMemberView(item.user, actor),
      enrolledBy: item.enrolledBy,
      cancelledBy: item.cancelledBy,
      cancelledAt: item.cancelledAt,
    })),
  }));
  return { ...gymClass, sessions };
};

/**
 * UC-CB-12: danh sách học viên của một buổi, chỉ thông tin tối thiểu phục vụ điểm danh.
 * @param {{ userId: number, canReadAll: boolean }} actor
 * @param {number} sessionId
 */
export const getSessionRoster = async (actor, sessionId) => {
  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: {
      gymClass: { select: { id: true, name: true, coachId: true, capacity: true } },
      enrollments: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, fullName: true } } },
      },
    },
  });
  if (!session) throw ApiError.notFound('Không tìm thấy buổi học');
  assertInScope(actor, session.gymClass.coachId);

  const { coachId: _coachId, ...gymClass } = session.gymClass;
  return {
    session: {
      id: session.id,
      startAt: session.startAt,
      endAt: session.endAt,
      status: session.status,
    },
    class: gymClass,
    bookedCount: session.enrollments.filter((e) => e.status === Enums.EnrollmentStatus.BOOKED)
      .length,
    students: session.enrollments.map((item) => ({
      enrollmentId: item.id,
      memberId: item.user.id,
      fullName: item.user.fullName,
      bookingStatus: item.status,
    })),
  };
};
