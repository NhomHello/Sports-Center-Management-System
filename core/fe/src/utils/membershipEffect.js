import { MS_PER_DAY } from '@/constants';

export const MEMBERSHIP_EFFECT = Object.freeze({
  NEW: 'NEW',
  EXTEND: 'EXTEND',
  RENEW_AFTER_EXPIRED: 'RENEW_AFTER_EXPIRED',
});

/**
 * Dự đoán tác động của việc thu tiền lên gói của hội viên, khớp quy tắc BE (BR-1.2):
 * còn hạn thì cộng dồn vào cuối gói hiện tại, hết hạn hoặc chưa có thì bắt đầu từ ngày thu.
 * @param {{ endDate: string, plan?: { name: string } }|null} current gói gần nhất của hội viên
 * @param {number} durationDays
 * @param {number} [now] ms
 */
export const computeMembershipEffect = (current, durationDays, now = Date.now()) => {
  const durationMs = durationDays * MS_PER_DAY;
  const currentEnd = current ? new Date(current.endDate).getTime() : null;
  if (currentEnd && currentEnd > now) {
    return {
      kind: MEMBERSHIP_EFFECT.EXTEND,
      planName: current.plan?.name,
      currentEnd,
      nextEnd: currentEnd + durationMs,
    };
  }
  return {
    kind: current ? MEMBERSHIP_EFFECT.RENEW_AFTER_EXPIRED : MEMBERSHIP_EFFECT.NEW,
    planName: current?.plan?.name,
    currentEnd,
    nextStart: now,
    nextEnd: now + durationMs,
  };
};

/**
 * Số ngày còn hiệu lực của gói, làm tròn lên; gói đã hết hạn trả 0.
 * @param {string} endDate
 * @param {number} [now] ms
 */
export const daysLeft = (endDate, now = Date.now()) =>
  Math.max(0, Math.ceil((new Date(endDate).getTime() - now) / MS_PER_DAY));
