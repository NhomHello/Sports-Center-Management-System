import { Enums } from '../../config/db.js';
import { purchaseLabel } from '../payment/invoice.service.js';
import { PAYMENT_OUTCOME } from '../payment/payment-apply.service.js';
import { fmtMoney, fmtTime, toMember, toReconcilers } from './payment-notify.service.js';

const { NotificationKind: KIND, ReconciliationReason: REASON } = Enums;

/**
 * Nội dung thông báo theo kết quả ghi nhận tiền vào một hoá đơn (webhook hoặc map thủ công).
 * @param {object} invoice
 * @param {{ outcome: string, received: number, missing: number, excess: number, expiresAt?: Date }} result
 * @param {string} key khoá sự kiện chống gửi trùng
 * @returns {object[]}
 */
export const outcomeNotices = (invoice, result, key) => {
  const userId = invoice.userId;
  if (result.outcome === PAYMENT_OUTCOME.UNDERPAID) {
    return [
      toMember({
        userId,
        kind: KIND.PAYMENT_TOPUP_REQUIRED,
        eventKey: `${key}:topup`,
        title: `Hoá đơn ${invoice.code} còn thiếu ${fmtMoney(result.missing)}`,
        message:
          `Trung tâm đã nhận ${fmtMoney(result.received)} / ${fmtMoney(invoice.amount)}. ` +
          `Vui lòng chuyển bù ${fmtMoney(result.missing)} với nội dung ${invoice.code} ` +
          `trước ${fmtTime(result.expiresAt)} để xác nhận giao dịch.`,
      }),
    ];
  }
  if (result.outcome === PAYMENT_OUTCOME.OVERPAID) {
    return [
      toMember({
        userId,
        kind: KIND.PAYMENT_REVIEW_ALERT,
        eventKey: `${key}:overpaid`,
        title: `Hoá đơn ${invoice.code}: trung tâm nhận ${fmtMoney(result.received)}`,
        message:
          `Số tiền nhiều hơn hoá đơn ${fmtMoney(invoice.amount)} (thừa ${fmtMoney(result.excess)}). ` +
          'Hoá đơn chờ trung tâm xác nhận; trung tâm sẽ liên hệ để xác nhận giao dịch và hoàn hoặc dùng phần thừa.',
      }),
      toReconcilers({
        eventKey: `${key}:overpaid`,
        title: `Hoá đơn ${invoice.code} chuyển thừa ${fmtMoney(result.excess)}`,
        message: 'Liên hệ hội viên, rồi chấp nhận hoá đơn (xác nhận giao dịch) hoặc hoàn toàn bộ.',
      }),
    ];
  }
  return [
    toMember({
      userId,
      kind: KIND.PAYMENT_CONFIRMED,
      eventKey: `${key}:paid`,
      title: `Đã thanh toán hoá đơn ${invoice.code}`,
      message: `${purchaseLabel(invoice)}: đã thanh toán và có hiệu lực. Bạn có thể tải hoá đơn PDF.`,
    }),
  ];
};

const REVIEW_TITLE = {
  [REASON.SCHEDULE_CONFLICT]: 'Khóa học trùng lịch, tiền chờ xử lý',
  [REASON.NO_MATCH]: 'Giao dịch không khớp hoá đơn',
  [REASON.LATE]: 'Tiền về sau khi hoá đơn hết hạn',
  [REASON.DUPLICATE_TRANSFER]: '[Cảnh báo] Hội viên chuyển 2 lần cho một mã',
};

/** Thông báo sau webhook: kết quả cho hội viên và cảnh báo cho người đối soát. */
export const buildWebhookNotices = ({ log, kase, invoice, result }) => {
  const key = `sepay:${log.id}`;
  if (result) return outcomeNotices(invoice, result, key);
  const notices = [
    toReconcilers({
      eventKey: key,
      title: `${REVIEW_TITLE[kase.reason] ?? 'Giao dịch cần đối soát'}: ${fmtMoney(log.transferAmount)}`,
      message: `${kase.note}. Mở hàng chờ đối soát để xử lý phiếu #${kase.id}.`,
    }),
  ];
  if (invoice && kase.reason !== REASON.NO_MATCH) {
    notices.push(
      toMember({
        userId: invoice.userId,
        kind: KIND.PAYMENT_REVIEW_ALERT,
        eventKey: `${key}:member`,
        title: `Trung tâm đã nhận ${fmtMoney(log.transferAmount)} cho hoá đơn ${invoice.code}`,
        message: reviewMessage(kase.reason),
      }),
    );
  }
  return notices;
};

function reviewMessage(reason) {
  if (reason === REASON.SCHEDULE_CONFLICT)
    return 'Trung tâm đã nhận tiền nhưng lịch khóa học bị trùng. Đăng ký chưa được xác nhận; trung tâm sẽ liên hệ để chọn khóa phù hợp hoặc hoàn tiền.';
  if (reason === REASON.DUPLICATE_TRANSFER)
    return 'Hóa đơn đã được thanh toán trước đó. Trung tâm sẽ liên hệ để hoàn khoản chuyển lặp hoặc dùng cho khóa khác.';
  return 'Hóa đơn hoặc chỗ giữ không còn hiệu lực khi tiền về. Trung tâm sẽ kiểm tra và liên hệ bạn.';
}
