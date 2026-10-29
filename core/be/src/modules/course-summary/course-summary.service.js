import { PERMISSIONS as P, SETTING_KEYS as K } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import {
  withScheduleTransaction,
  writeScheduleAudit,
} from '../../common/utils/schedule-transaction.js';
import { Enums, prisma } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { getValue } from '../setting/setting.service.js';
import { loadAttendance } from './course-attendance.service.js';
import { COURSE_EVENTS } from './course.constants.js';

export const SUMMARY_INCLUDE = Object.freeze({
  items: { include: { member: { select: { id: true, fullName: true } } }, orderBy: { id: 'asc' } },
  gymClass: true,
  coach: { select: { id: true, fullName: true } },
});

/** HLV tác giả được sửa, quản lý có quyền xem toàn bộ chỉ đọc. */
export const loadSummary = async (db, classId, context, editing = false) => {
  const summary = await db.courseSummary.findUnique({
    where: { classId },
    include: SUMMARY_INCLUDE,
  });
  if (!summary) throw ApiError.notFound('Lớp chưa có bản tổng kết');
  const assigned =
    context.permissions.has(P.COURSE_SUMMARY_MANAGE_ASSIGNED) &&
    summary.coachId === context.user.id;
  if (!assigned && (editing || !context.permissions.has(P.COURSE_SUMMARY_VIEW_ALL)))
    throw ApiError.forbidden();
  return summary;
};

/** Chuyên cần và kết quả gợi ý không nhận từ client. */
export const getSummary = async (classId, context) => {
  const summary = await loadSummary(prisma, classId, context);
  const attendance = await loadAttendance(prisma, summary);
  const threshold = await getValue(K.COURSE_PASS_MIN_ATTENDANCE_PERCENT);
  return {
    ...summary,
    items: summary.items.map((item) => {
      // Bản đã công bố phải khớp phiếu PDF và kết quả hội viên, kể cả khi điểm danh được sửa sau đó.
      const counts =
        summary.status === Enums.CourseSummaryStatus.PUBLISHED && item.attendanceSnapshot
          ? item.attendanceSnapshot
          : attendance.get(item.id);
      return {
        ...item,
        attendance: counts,
        suggestedResult:
          counts.percent >= threshold ? Enums.CourseResult.PASS : Enums.CourseResult.NOT_PASSED,
      };
    }),
  };
};

function assertDraft(summary) {
  if (summary.status !== Enums.CourseSummaryStatus.DRAFT)
    throw ApiError.conflict('Tổng kết đã công bố, cần quản lý mở lại');
}
function validateResult(data, attendance, threshold) {
  const suggested =
    attendance.percent >= threshold ? Enums.CourseResult.PASS : Enums.CourseResult.NOT_PASSED;
  if (data.result !== suggested && !data.comment.trim())
    throw ApiError.businessRule('Kết quả khác gợi ý cần nhận xét');
}

/** BR-S4-08: lưu nháp có audit, không sửa item của lớp khác dù đoán ID. */
export const updateItem = (classId, itemId, data, context) =>
  withScheduleTransaction(async (db) => {
    const summary = await loadSummary(db, classId, context, true);
    assertDraft(summary);
    if (!summary.items.some((item) => item.id === itemId))
      throw ApiError.notFound('Không có học viên trong bản tổng kết');
    const attendance = await loadAttendance(db, summary);
    validateResult(
      data,
      attendance.get(itemId),
      await getValue(K.COURSE_PASS_MIN_ATTENDANCE_PERCENT),
    );
    const item = await db.courseSummaryItem.update({ where: { id: itemId }, data });
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'CourseSummaryItem',
      entityId: itemId,
      meta: data,
    });
    return { ...item, attendance: attendance.get(itemId) };
  });

/** BR-S4-09: snapshot, revision, outbox và trạng thái commit cùng nhau. */
export const publish = (classId, data, context) =>
  withScheduleTransaction(async (db) => {
    const summary = await loadSummary(db, classId, context, true);
    assertDraft(summary);
    const attendance = await loadAttendance(db, summary);
    const threshold = await getValue(K.COURSE_PASS_MIN_ATTENDANCE_PERCENT);
    for (const item of summary.items) {
      if (!item.result || !item.progress)
        throw ApiError.businessRule('Cần đủ kết quả và mức tiến bộ của mọi học viên');
      validateResult(item, attendance.get(item.id), threshold);
    }
    const missing = summary.items
      .filter((item) => attendance.get(item.id).missing > 0)
      .map((item) => item.id);
    if (missing.length && !data.acknowledgeMissingAttendance)
      throw ApiError.conflict('Còn buổi chưa điểm danh; cần xác nhận trước khi công bố', {
        missingItemIds: missing,
      });
    for (const item of summary.items)
      await db.courseSummaryItem.update({
        where: { id: item.id },
        data: { attendanceSnapshot: attendance.get(item.id) },
      });
    const result = await db.courseSummary.update({
      where: { id: summary.id },
      data: {
        status: Enums.CourseSummaryStatus.PUBLISHED,
        publishedAt: new Date(),
        revision: { increment: 1 },
      },
    });
    await db.classEvent.create({
      data: {
        classId,
        kind: Enums.NotificationKind.TRAINING_RESULT_CREATED,
        title: summary.revision ? 'Kết quả khoá học đã cập nhật' : 'Đã có kết quả khoá học',
        message: `Tổng kết lớp ${summary.gymClass.name} đã công bố. Xem kết quả trong hồ sơ của bạn.`,
        recipientIds: summary.items.map((item) => item.memberId),
        changes: {
          type: COURSE_EVENTS.PUBLISHED,
          summaryId: summary.id,
          revision: result.revision,
          emailDeliveredTo: [],
        },
      },
    });
    await writeScheduleAudit(db, context.user, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'CourseSummary',
      entityId: summary.id,
      meta: { published: true, revision: result.revision, missingItemIds: missing },
    });
    return result;
  });

/** Quyền mở lại tách biệt với report.view; giữ bản cũ trong audit. */
export const reopen = (classId, reason, actor) =>
  withScheduleTransaction(async (db) => {
    const summary = await db.courseSummary.findUnique({ where: { classId } });
    if (!summary) throw ApiError.notFound('Không tìm thấy tổng kết');
    if (summary.status !== Enums.CourseSummaryStatus.PUBLISHED)
      throw ApiError.conflict('Tổng kết chưa công bố');
    const result = await db.courseSummary.update({
      where: { id: summary.id },
      data: { status: Enums.CourseSummaryStatus.DRAFT, reopenedReason: reason },
    });
    await writeScheduleAudit(db, actor, {
      action: AUDIT_ACTIONS.UPDATE,
      entity: 'CourseSummary',
      entityId: summary.id,
      meta: { reopened: true, reason, revision: summary.revision },
    });
    return result;
  });
