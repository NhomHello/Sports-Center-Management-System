import { ENROLLMENT_STATUS, WAITLIST_STATUS } from '@/constants/schedule';

/** Giữ đúng phạm vi đăng ký chờ của hội viên, dựa trên điều kiện server trả. */
export const getWaitlistAction = ({ item, allowed, booked, memberId }) => {
  if (!allowed || booked || memberId) return null;
  if (item.enrollment?.status === ENROLLMENT_STATUS.PENDING_PAYMENT) return null;
  if (Object.values(WAITLIST_STATUS).includes(item.waitlist?.status)) return 'leave';
  return item.seatsRemaining <= 0 && item.canJoinWaitlist ? 'join' : null;
};

/** Chỉ thay nút đăng ký bị vô hiệu bằng thao tác chờ khi thao tác đó thực sự dùng được. */
export const shouldShowEnrollmentAction = (context) => {
  const { item, allowed, booked } = context;
  if (!allowed || booked) return false;
  if (item.enrollment?.status === ENROLLMENT_STATUS.PENDING_PAYMENT) return true;
  return Boolean(item.canEnroll || !getWaitlistAction(context) || !item.canJoinWaitlist);
};

/** Chỉ bỏ lời giải thích trùng khi đã có thao tác chờ hợp lệ hoặc đăng ký được ngay. */
export const shouldHideEnrollmentReason = (context) =>
  Boolean(context.item.canEnroll || (getWaitlistAction(context) && context.item.canJoinWaitlist));
