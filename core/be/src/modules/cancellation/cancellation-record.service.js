import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS } from '../../constants/index.js';
import { writeScheduleAudit } from '../../common/utils/schedule-transaction.js';
import { createForUsers } from '../notification/notification.service.js';

/** Snapshot tại thời điểm hủy; đăng ký lại cùng lớp không làm thay đổi lịch sử đã ghi. */
export const recordCourseCancellation = async (
  db,
  { change, enrollment, value, preview, actor, reason },
) => {
  await writeScheduleAudit(db, actor, {
    action: AUDIT_ACTIONS.DELETE,
    entity: 'PurchaseChange',
    entityId: change.id,
    meta: {
      reason,
      cancellation: {
        classId: enrollment.classId,
        courseName: value.invoice.planName,
        invoiceCode: value.invoice.code,
        enrolledAt: enrollment.enrolledAt,
        purchasedSessions: value.sessionCount,
        remainingSessions: value.remainingSessions,
        usedSessions: value.usedSessions ?? value.sessionCount - value.remainingSessions,
        cancelledSessions: value.cancelledSessions ?? 0,
        ...preview,
      },
    },
  });
  const sessions = enrollment.gymClass.sessions.filter(
    (s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt > change.createdAt,
  );
  const coachIds = [...new Set(sessions.map((s) => s.coachId ?? enrollment.gymClass.coachId))];
  const coaches = await db.user.findMany({
    where: { id: { in: coachIds }, status: Enums.UserStatus.ACTIVE },
    select: { id: true },
  });
  const member = await db.user.findUniqueOrThrow({
    where: { id: enrollment.memberId },
    select: { fullName: true },
  });
  await createForUsers({
    db,
    userIds: coaches.map((c) => c.id).filter((id) => id !== enrollment.memberId),
    kind: Enums.NotificationKind.CLASS_CHANGED,
    title: 'Đăng ký học viên đã bị hủy',
    message: `${member.fullName} không còn đăng ký ${enrollment.gymClass.name}. Vui lòng cập nhật danh sách các buổi còn lại.`,
    eventKey: `course-cancel:${change.id}:coaches`,
  });
  await createForUsers({
    db,
    userIds: [enrollment.memberId],
    kind: Enums.NotificationKind.CLASS_CHANGED,
    title: 'Đã hủy đăng ký khóa học',
    message: `${enrollment.gymClass.name}: đăng ký đã hủy. Xem lịch sử hủy trong hồ sơ để tra cứu yêu cầu hoàn tiền.`,
    eventKey: `course-cancel:${change.id}:member`,
  });
};
