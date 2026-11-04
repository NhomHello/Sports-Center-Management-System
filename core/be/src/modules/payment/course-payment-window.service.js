import { SETTING_KEYS } from '@scms/shared';
import { ApiError } from '../../common/errors/api-error.js';
import { Enums } from '../../config/db.js';
import { TIME } from '../../constants/index.js';
import { getValue } from '../setting/setting.service.js';

/** Giây ngân hàng không có mili giây; chỉ tự chốt nếu cả giây đó nằm trước deadline. */
export const wholeSecond = (date) =>
  Math.floor(new Date(date).getTime() / TIME.MS_PER_SECOND) * TIME.MS_PER_SECOND;

/** Hạn chuyển tiền cố định; chỉ khóa online có khoảng chờ thông báo từ ngân hàng. */
export const paymentWindow = (invoice, graceSeconds) => {
  const isCourse = invoice.kind === Enums.InvoiceKind.COURSE;
  const hasGrace = isCourse && invoice.channel === Enums.InvoiceChannel.ONLINE;
  return {
    paymentDeadline: invoice.expiresAt,
    holdReleaseAt: new Date(
      new Date(invoice.expiresAt).getTime() + (hasGrace ? graceSeconds * TIME.MS_PER_SECOND : 0),
    ),
  };
};

/** Lấy policy từ settings để UI, webhook và job dùng chung một mốc nhả chỗ. */
export const getPaymentWindow = async (invoice) =>
  paymentWindow(invoice, await getValue(SETTING_KEYS.PAYMENT_WEBHOOK_GRACE_SECONDS));

const expiredError = () =>
  ApiError.conflict(
    'Đã hết hạn thanh toán hoặc không xác định được tiền vào đúng hạn. Không thu thêm; cần đối soát nếu đã chuyển tiền.',
    { type: Enums.ReconciliationReason.LATE },
  );

/** Chỉ timestamp ngân hàng đã xác thực mới được đi qua hạn thanh toán trong khoảng chờ webhook. */
export const assertCoursePaymentWindow = async (
  invoice,
  { paidAt, provider, now = new Date() },
) => {
  if (invoice.kind !== Enums.InvoiceKind.COURSE) return;
  const deadline = new Date(invoice.expiresAt);
  if (now < deadline) return;
  const { holdReleaseAt } = await getPaymentWindow(invoice);
  const timelyBank =
    provider === Enums.PaymentProvider.SEPAY && paidAt && paidAt.getTime() < wholeSecond(deadline);
  if (!timelyBank || now >= holdReleaseAt) throw expiredError();
};

/** Chấp nhận tiền thừa cũng không được hồi sinh chỗ hết hạn; payment lưu thời điểm ngân hàng. */
export const assertCourseSettlementWindow = async (db, invoice, now = new Date()) => {
  if (invoice.kind !== Enums.InvoiceKind.COURSE || now < invoice.expiresAt) return;
  const { holdReleaseAt } = await getPaymentWindow(invoice);
  if (now >= holdReleaseAt) throw expiredError();
  const payments = await db.payment.findMany({ where: { invoiceId: invoice.id } });
  if (!payments.length || payments.some((p) => p.paidAt.getTime() >= invoice.expiresAt.getTime()))
    throw expiredError();
};
