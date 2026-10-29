import { PERMISSIONS as P, SETTING_KEYS as K } from '@scms/shared';
import { Enums, prisma } from '../../config/db.js';
import { ApiError } from '../../common/errors/api-error.js';
import { buildPageMeta, toPrismaPage } from '../../common/utils/pagination.js';
import { withScheduleTransaction, writeScheduleAudit } from '../../common/utils/schedule-transaction.js';
import { AUDIT_ACTIONS, TIME } from '../../constants/index.js';
import { getValue } from '../setting/setting.service.js';

async function eligible(db, classId, memberId) {
  const summary = await db.courseSummary.findFirst({ where: { classId, items: { some: { memberId } } } });
  if (!summary) throw ApiError.forbidden('Chỉ học viên có tổng kết khoá mới được đánh giá');
  const last = await db.classSession.findFirst({ where: { classId, status: { not: Enums.SessionStatus.CANCELLED } }, orderBy: { endAt: 'desc' } });
  const days = await getValue(K.COURSE_RATING_WINDOW_DAYS);
  if (!last || last.endAt > new Date() || Date.now() >= last.endAt.getTime() + days * TIME.MS_PER_DAY)
    throw ApiError.businessRule('Đã hết thời hạn đánh giá khoá');
  return summary;
}

/** Một hội viên/lớp; chỉ sửa trong cửa sổ đánh giá, không đổi moderation bằng nội dung mới. */
export const saveRating = (classId, data, actor, updating) => withScheduleTransaction(async (db) => {
  const summary = await eligible(db, classId, actor.id);
  const old = await db.courseRating.findUnique({ where: { classId_memberId: { classId, memberId: actor.id } } });
  if (Boolean(old) !== updating) throw ApiError.conflict(old ? 'Đã có đánh giá, hãy sửa đánh giá hiện có' : 'Chưa có đánh giá để sửa');
  const item = old ? await db.courseRating.update({ where: { id: old.id }, data }) :
    await db.courseRating.create({ data: { ...data, classId, memberId: actor.id, coachId: summary.coachId } });
  await writeScheduleAudit(db, actor, { action: old ? AUDIT_ACTIONS.UPDATE : AUDIT_ACTIONS.CREATE, entity: 'CourseRating', entityId: item.id, meta: data });
  return item;
});

const initials = (name) => name.trim().split(/\s+/u).map((part) => `${part[0]}.`).join(' ');
/** BR-S4-11: không trả memberId/summary/raw user cho HLV hoặc hội viên. */
export const listRatings = async (coachId, query, context) => {
  const manager = context.permissions.has(P.COURSE_RATING_MODERATE);
  const coach = await prisma.user.findFirst({ where: { id: coachId, ...(!manager && { status: Enums.UserStatus.ACTIVE }),
    role: { permissions: { some: { permission: { code: P.SCHEDULE_VIEW_TEACHING } } } } }, select: { id: true } });
  if (!coach) throw ApiError.notFound('Không tìm thấy HLV');
  const where = { coachId };
  const [items, total, average] = await prisma.$transaction([
    prisma.courseRating.findMany({ where, ...toPrismaPage(query), include: { member: { select: { fullName: true } } }, orderBy: { id: 'desc' } }),
    prisma.courseRating.count({ where }),
    prisma.courseRating.aggregate({ where, _avg: { courseStars: true, coachStars: true } }),
  ]);
  return { items: items.map((item) => ({ id: item.id, courseStars: item.courseStars, coachStars: item.coachStars,
    comment: item.hiddenAt && !manager ? null : item.comment, hidden: Boolean(item.hiddenAt),
    memberName: manager ? item.member.fullName : initials(item.member.fullName), ...(manager && { memberId: item.memberId }), createdAt: item.createdAt })),
    averages: average._avg, meta: buildPageMeta({ ...query, total }) };
};

/** Ẩn nhận xét giữ điểm sao, lưu ai/bao giờ/lý do và audit trong cùng transaction. */
export const moderate = (id, data, actor) => withScheduleTransaction(async (db) => {
  if (!await db.courseRating.findUnique({ where: { id } })) throw ApiError.notFound('Không tìm thấy đánh giá');
  const result = await db.courseRating.update({ where: { id }, data: { hiddenAt: data.hidden ? new Date() : null,
    hiddenById: actor.id, hiddenReason: data.reason } });
  await writeScheduleAudit(db, actor, { action: AUDIT_ACTIONS.UPDATE, entity: 'CourseRating', entityId: id, meta: data });
  return result;
});
