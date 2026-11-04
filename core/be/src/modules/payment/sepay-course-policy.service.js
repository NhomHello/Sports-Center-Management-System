import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { assertCourseHold } from '../course-order/course-hold-policy.service.js';
import { assertCoursePaymentWindow } from './course-payment-window.service.js';
import { bankPaymentTime } from './sepay-time.js';

/** Tiền đã vào ngân hàng nhưng không thể nhận vào khóa thì lưu đối soát, không throw mất log. */
export const checkCourseTransfer = async (db, invoice, payload) => {
  if (invoice.kind !== Enums.InvoiceKind.COURSE) return {};
  const decisionAt = new Date();
  const timing = bankPaymentTime(payload, invoice, decisionAt);
  if (timing.error)
    return { rejection: { reason: Enums.ReconciliationReason.LATE, note: timing.error } };
  try {
    await assertCoursePaymentWindow(invoice, {
      now: decisionAt,
      paidAt: timing.paidAt,
      provider: Enums.PaymentProvider.SEPAY,
    });
    await assertCourseHold(db, invoice, decisionAt);
    return { ...timing, decisionAt };
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    const reason =
      error.details?.type === Enums.ReconciliationReason.SCHEDULE_CONFLICT
        ? Enums.ReconciliationReason.SCHEDULE_CONFLICT
        : Enums.ReconciliationReason.LATE;
    return { rejection: { reason, note: error.message } };
  }
};
