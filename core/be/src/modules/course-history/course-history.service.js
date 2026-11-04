import { Enums, prisma } from '../../config/db.js';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import {
  COURSE_SUMMARY,
  PERSON,
  courseView,
  membershipPeriods,
  sessionView,
} from './course-history.mapper.js';

const ownEnrollment = (memberId) => ({
  where: { memberId },
  select: { status: true, enrolledAt: true, cancelledAt: true },
});
const memberScope = (memberId) => ({
  OR: [
    { enrollments: { some: { memberId, status: Enums.EnrollmentStatus.BOOKED } } },
    {
      enrollments: {
        some: { memberId, status: Enums.EnrollmentStatus.CANCELLED, invoiceId: null },
      },
    },
    {
      courseInvoices: {
        some: {
          userId: memberId,
          status: { in: [Enums.InvoiceStatus.PAID, Enums.InvoiceStatus.REFUNDED] },
        },
      },
    },
    { sessions: { some: { attendance: { some: { memberId } } } } },
    { sessions: { some: { feedback: { some: { memberId } } } } },
  ],
});

const loadMember = async (memberId) => {
  const member = await prisma.user.findUnique({ where: { id: memberId }, select: PERSON });
  if (!member) throw ApiError.notFound('Không tìm thấy hội viên');
  return member;
};

/** Khóa đã mua/đăng ký hoặc có dữ liệu học lịch sử; không chỉ những khóa còn mở đăng ký. */
export const listCourses = async (memberId, query) => {
  await loadMember(memberId);
  const where = {
    AND: [memberScope(memberId), ...(query.search ? [{ name: { contains: query.search } }] : [])],
  };
  const [items, total] = await prisma.$transaction([
    prisma.gymClass.findMany({
      where,
      include: { ...COURSE_SUMMARY, enrollments: ownEnrollment(memberId) },
      orderBy: [{ startsOn: 'desc' }, { id: 'desc' }],
      ...toPrismaPage(query),
    }),
    prisma.gymClass.count({ where }),
  ]);
  return { items: items.map(courseView), meta: buildPageMeta({ ...query, total }) };
};

/** Lấy một lần toàn bộ buổi học, gộp đúng điểm danh và ghi chú của một hội viên. */
export const getCourse = async (memberId, classId) => {
  const member = await loadMember(memberId);
  const item = await prisma.gymClass.findFirst({
    where: { id: classId, ...memberScope(memberId) },
    include: {
      ...COURSE_SUMMARY,
      enrollments: ownEnrollment(memberId),
      sessions: {
        orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
        include: {
          coach: { select: PERSON },
          attendance: {
            where: { memberId },
            select: { status: true, updatedAt: true, actorId: true },
          },
          feedback: {
            where: { memberId },
            select: { rating: true, note: true, updatedAt: true, author: { select: PERSON } },
          },
        },
      },
    },
  });
  if (!item) throw ApiError.notFound('Không tìm thấy khóa học trong lịch sử của hội viên');
  const changes = await prisma.purchaseChange.findMany({
    where: {
      userId: memberId,
      fromInvoice: { classId },
      kind: { in: [Enums.PurchaseChangeKind.CANCEL_COURSE, Enums.PurchaseChangeKind.CHANGE_CLASS] },
      status: Enums.PurchaseChangeStatus.DONE,
    },
    select: {
      id: true,
      createdAt: true,
      fromInvoice: { select: { paidAt: true, createdAt: true } },
    },
  });
  const logs = await prisma.auditLog.findMany({
    where: {
      entity: 'PurchaseChange',
      entityId: { in: changes.map((change) => String(change.id)) },
    },
    select: { entityId: true, meta: true },
    orderBy: { id: 'desc' },
  });
  const periods = membershipPeriods(item.enrollments[0], changes, logs);
  return {
    member,
    course: courseView(item),
    asOf: new Date(),
    sessions: item.sessions.map((session, index) =>
      sessionView(session, index + 1, periods, item.coach),
    ),
  };
};
