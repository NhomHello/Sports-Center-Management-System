import { Enums } from '../../config/db.js';
import { TIME } from '../../constants/index.js';

/** Đơn vị làm tròn tiền (nghìn đồng) theo hợp đồng GĐ2–4. */
const MONEY_STEP = 1000;
const PERCENT = 100;

/** Làm tròn tới nghìn đồng gần nhất. */
export const roundMoney = (value) => Math.round(value / MONEY_STEP) * MONEY_STEP;

/** Buổi còn tính tiền: chưa diễn ra và chưa bị hủy. */
export const futureSessions = (sessions, now = new Date()) =>
  sessions.filter((s) => s.status === Enums.SessionStatus.SCHEDULED && s.startAt > now);

/** Tổng buổi của khóa (buổi bị hủy không tính). */
export const countedSessions = (sessions) =>
  sessions.filter((s) => s.status !== Enums.SessionStatus.CANCELLED);

/** Học phí giữa khóa = làm tròn(giá × buổi còn lại / tổng buổi). */
export const coursePrice = (price, remaining, total) =>
  total > 0 ? roundMoney((price * remaining) / total) : 0;

/**
 * Giá trị chưa dùng của một kỳ gói tự tập: kỳ chưa bắt đầu = toàn bộ số đã trả,
 * đang chạy = theo số ngày còn lại trên tổng ngày của kỳ.
 */
export const remainingPlanValue = ({ paid, startDate, endDate }, now = new Date()) => {
  if (startDate > now) return paid;
  const total = (endDate - startDate) / TIME.MS_PER_DAY;
  const unused = Math.max(0, Math.floor((endDate - now) / TIME.MS_PER_DAY));
  return total > 0 ? Math.min(paid, roundMoney((paid * unused) / total)) : 0;
};

/** Giá trị chưa dùng của khóa học: số đã trả × buổi chưa diễn ra / số buổi đã mua. */
export const remainingCourseValue = ({ paid, sessionCount, unheld }) =>
  sessionCount > 0
    ? Math.min(paid, roundMoney((paid * Math.min(unheld, sessionCount)) / sessionCount))
    : 0;

/** Phí hủy: 0 nếu hủy trước khi bắt đầu, còn lại theo % cấu hình trên giá trị chưa dùng. */
export const cancellationFee = (remainingValue, percent, beforeStart) =>
  beforeStart ? 0 : roundMoney((remainingValue * percent) / PERCENT);

/** Bản xem trước hủy: số đã trả, giá trị còn lại, phí và số được hoàn / ghi số dư. */
export const cancelQuote = ({ paid, remainingValue, percent, beforeStart }) => {
  const fee = cancellationFee(remainingValue, percent, beforeStart);
  return { paidAmount: paid, remainingValue, fee, refundAmount: remainingValue - fee, beforeStart };
};
