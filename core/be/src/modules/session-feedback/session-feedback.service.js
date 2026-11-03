import { PERMISSIONS as P } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { loadStaffSession, sessionMemberScope } from '../../common/utils/session-access.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';

/** HLV/quản lý xem ghi chú và danh sách học viên của đúng buổi được phép xử lý. */
export const listForSession = async (id, context) => {
  const session = await loadStaffSession(prisma, id, context);
  const [enrollments, feedback, recorded] = await Promise.all([
    prisma.classEnrollment.findMany({
      where: sessionMemberScope(session),
      select: { member: { select: { id: true, fullName: true } } },
    }),
    prisma.sessionFeedback.findMany({
      where: { sessionId: id },
      include: { member: { select: { id: true, fullName: true } } },
    }),
    prisma.attendance.findMany({
      where: { sessionId: id },
      select: { member: { select: { id: true, fullName: true } } },
    }),
  ]);
  const members = new Map(
    [...enrollments, ...recorded, ...feedback].map((row) => [row.member.id, row.member]),
  );
  return {
    session,
    items: [...members.values()].map((member) => ({
      member,
      feedback: feedback.find((f) => f.memberId === member.id) ?? null,
    })),
  };
};

async function assertMember(db, session, memberId) {
  const [enrollment, recorded] = await Promise.all([
    db.classEnrollment.findFirst({ where: { ...sessionMemberScope(session), memberId } }),
    db.attendance.findUnique({
      where: { sessionId_memberId: { sessionId: session.id, memberId } },
    }),
  ]);
  if (!enrollment && !recorded)
    throw ApiError.businessRule('Học viên chưa có đăng ký chính thức cho buổi này');
}

/** Nhận xét độc lập điểm danh; version tránh ghi đè khi hai người mở cùng bản cũ. */
export const save = (sessionId, memberId, data, context) =>
  withScheduleTransaction(async (db) => {
    const session = await loadStaffSession(db, sessionId, context);
    if (
      session.status === Enums.SessionStatus.CANCELLED ||
      session.gymClass.status === Enums.ClassStatus.CANCELLED
    )
      throw ApiError.businessRule('Không nhận xét buổi đã hủy');
    if (session.startAt > new Date()) throw ApiError.businessRule('Buổi học chưa bắt đầu');
    await assertMember(db, session, memberId);
    const where = { sessionId_memberId: { sessionId, memberId } };
    const before = await db.sessionFeedback.findUnique({ where });
    if (data.expectedVersion !== (before?.version ?? 0))
      throw ApiError.conflict('Nhận xét đã thay đổi, hãy tải lại trước khi lưu');
    const changes = { rating: data.rating, note: data.note, authorId: context.user.id };
    const result = await db.sessionFeedback.upsert({
      where,
      create: { ...changes, sessionId, memberId },
      update: { ...changes, version: { increment: 1 } },
    });
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'SessionFeedback',
      entityId: result.id,
      meta: {
        sessionId,
        memberId,
        before: before
          ? { rating: before.rating, note: before.note, version: before.version }
          : null,
        after: { rating: result.rating, note: result.note, version: result.version },
      },
    });
    return result;
  });

/** Hội viên chỉ đọc nhận xét của token, không nhận memberId từ query. */
export const listOwn = async (memberId, query) => {
  const where = { memberId, ...(query.classId && { session: { classId: query.classId } }) };
  const [items, total] = await prisma.$transaction([
    prisma.sessionFeedback.findMany({
      where,
      ...toPrismaPage(query),
      orderBy: { session: { startAt: 'desc' } },
      include: {
        session: { include: { gymClass: { select: { id: true, name: true } } } },
        author: { select: { fullName: true } },
      },
    }),
    prisma.sessionFeedback.count({ where }),
  ]);
  return { items, meta: buildPageMeta({ ...query, total }) };
};

/** Mô tả của từng buổi giữ nguyên khi đồng bộ lịch, cho HLV buổi đó hoặc quản lý sửa. */
export const updateDescription = (id, description, context) =>
  withScheduleTransaction(async (db) => {
    const before = await loadStaffSession(db, id, context, P.CLASS_UPDATE);
    const result = await db.classSession.update({ where: { id }, data: { description } });
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'ClassSession',
      entityId: id,
      meta: { before: { description: before.description }, after: { description } },
    });
    return result;
  });
