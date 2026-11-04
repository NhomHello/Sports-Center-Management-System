import { TIME } from '../../constants/index.js';
const bankFormat = new Intl.DateTimeFormat('sv-SE', {
  timeZone: TIME.VIETNAM_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});
import { wholeSecond } from './course-payment-window.service.js';

const BANK_TIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/u;
/** SePay cung cấp YYYY-MM-DD HH:mm:ss theo giờ Việt Nam, không theo timezone của server. */
export const parseSepayTime = (value) => {
  if (typeof value !== 'string' || !BANK_TIME.test(value)) return null;
  const date = new Date(`${value.replace(' ', 'T')}+07:00`);
  if (!Number.isFinite(date.getTime())) return null;
  return bankFormat.format(date) === value ? date : null;
};

/** Thiếu timestamp chỉ dùng giờ nhận nếu còn hạn; timestamp sai không tự ghi nhận tiền. */
export const bankPaymentTime = (payload, invoice, receivedAt = new Date()) => {
  if (payload.transactionDate === null || payload.transactionDate === undefined)
    return { paidAt: null };
  const paidAt = parseSepayTime(payload.transactionDate);
  if (!paidAt || paidAt > receivedAt || paidAt.getTime() < wholeSecond(invoice.createdAt))
    return { error: 'Thời điểm ngân hàng không hợp lệ; cần đối chiếu sao kê trước khi xác nhận' };
  if (paidAt >= invoice.expiresAt)
    return { error: 'Ngân hàng ghi nhận tiền từ hạn thanh toán trở đi; cần đối soát' };
  return { paidAt };
};
