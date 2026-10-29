import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { AUDIT_ACTIONS, ENTITIES } from '../../constants/index.js';
import { promoteWaitlist } from '../class/class-waitlist.service.js';
import { cancelPendingChanges } from '../purchase-change/purchase-change.service.js';

const lockSchedule = (db) => db.$queryRaw`SELECT id FROM schedule_locks WHERE id = 1 FOR UPDATE`;

const cancelHold = (db, enrollment, actorId) =>
  db.classEnrollment.update({
    where: { id: enrollment.id },
    data: {
      status: Enums.EnrollmentStatus.CANCELLED,
      cancelledAt: new Date(),
      cancelledBy: actorId ?? enrollment.enrolledBy,
      holdExpiresAt: null,
    },
  });

/**
 * Hội viên/lễ tân bỏ giữ chỗ khi chưa trả tiền: hóa đơn khóa học chưa nhận tiền chuyển FAILED,
 * đăng ký hủy và người chờ được mời. Hóa đơn đã nhận một phần tiền phải xử lý qua đối soát.
 */
export const releaseCourseHold = async (db, enrollment, actor) => {
  const invoice = enrollment.invoiceId
    ? await db.invoice.findUnique({
        where: { id: enrollment.invoiceId },
        include: { payments: true },
      })
    : null;
  if (invoice?.payments.length)
    throw ApiError.businessRule('Hóa đơn khóa học đã nhận tiền, hãy liên hệ quầy để xử lý');
  if (invoice?.status === Enums.InvoiceStatus.PENDING) {
    await db.invoice.update({
      where: { id: invoice.id },
      data: { status: Enums.InvoiceStatus.FAILED },
    });
    await db.auditLog.create({
      data: {
        userId: actor.id,
        action: AUDIT_ACTIONS.UPDATE,
        entity: ENTITIES.INVOICE,
        entityId: String(invoice.id),
        meta: { after: { status: Enums.InvoiceStatus.FAILED }, reason: 'COURSE_HOLD_RELEASED' },
      },
    });
    await cancelPendingChanges(db, invoice.id);
  }
  const result = await cancelHold(db, enrollment, actor.id);
  await promoteWaitlist(db, enrollment.classId);
  return result;
};

/**
 * Hóa đơn khóa học / chênh lệch hết hạn hoặc bị hủy (FAILED): nhả chỗ đang giữ và hủy lần đổi
 * đang chờ của hóa đơn đó.
 * Gọi trong transaction đã khóa hóa đơn.
 */
export const releaseHoldsForInvoice = async (tx, invoiceId) => {
  await cancelPendingChanges(tx, invoiceId);
  const holds = await tx.classEnrollment.findMany({
    where: { invoiceId, status: Enums.EnrollmentStatus.PENDING_PAYMENT },
  });
  if (!holds.length) return;
  await lockSchedule(tx);
  for (const hold of holds) {
    await cancelHold(tx, hold, null);
    await promoteWaitlist(tx, hold.classId);
  }
};

/** Chuyển bù làm hóa đơn có hạn mới thì hạn giữ chỗ đi theo. */
export const extendHolds = (tx, invoiceId, holdExpiresAt) =>
  tx.classEnrollment.updateMany({
    where: { invoiceId, status: Enums.EnrollmentStatus.PENDING_PAYMENT },
    data: { holdExpiresAt },
  });

/** Hóa đơn khóa học đủ tiền: chỗ đang giữ thành đăng ký chính thức (BR-2.1 mới). */
export const confirmCourseInvoice = async (tx, invoice) => {
  await lockSchedule(tx);
  const enrollment = await tx.classEnrollment.findFirst({ where: { invoiceId: invoice.id } });
  if (!enrollment) return null;
  return tx.classEnrollment.update({
    where: { id: enrollment.id },
    data: {
      status: Enums.EnrollmentStatus.BOOKED,
      enrolledAt: new Date(),
      holdExpiresAt: null,
      cancelledAt: null,
      cancelledBy: null,
    },
  });
};
