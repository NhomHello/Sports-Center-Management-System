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
          `trước ${fmtTime(result.expiresAt)} để kích hoạt gói.`,
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
          'Hoá đơn chờ trung tâm xác nhận; trung tâm sẽ liên hệ để kích hoạt gói và hoàn hoặc dùng phần thừa.',
      }),
      toReconcilers({
        eventKey: `${key}:overpaid`,
        title: `Hoá đơn ${invoice.code} chuyển thừa ${fmtMoney(result.excess)}`,
        message: 'Liên hệ hội viên, rồi chấp nhận hoá đơn (kích hoạt gói) hoặc hoàn toàn bộ.',
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
      title: `${REVIEW_TITLE[kase.reason]}: ${fmtMoney(log.transferAmount)}`,
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
        message:
          kase.reason === REASON.DUPLICATE_TRANSFER
            ? 'Hoá đơn này đã được thanh toán trước đó. Trung tâm sẽ liên hệ để hoàn tiền hoặc dùng gia hạn.'
            : 'Hoá đơn đã hết hạn khi tiền về. Trung tâm sẽ kiểm tra và liên hệ bạn.',
      }),
    );
  }
  return notices;
};
