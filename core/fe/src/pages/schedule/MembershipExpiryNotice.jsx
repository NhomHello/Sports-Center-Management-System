import { Link } from 'react-router';
import { DATE_FORMATS, ROUTES } from '@/constants';
import { vietnamInput } from '@/utils/schedule';
/** Cảnh báo không chặn đăng ký; số buổi và ngày hết hạn lấy từ API. */
export function MembershipExpiryNotice({ item, memberId, compact = false }) {
  if (!item.membershipExpiresBeforeClassEnd) return null;
  return (
    <p
      className="scms-membership-expiry-notice"
      title={`Gói hết hạn ${vietnamInput(item.membershipEndDate).format(DATE_FORMATS.DATE)}. Bạn vẫn có thể đăng ký.`}
    >
      {compact
        ? `${item.affectedSessionCount} buổi sau hạn gói. `
        : `Có ${item.affectedSessionCount} buổi sau hạn gói (${vietnamInput(item.membershipEndDate).format(DATE_FORMATS.DATE)}). Bạn vẫn có thể đăng ký. `}
      <Link to={memberId ? ROUTES.MEMBERS : ROUTES.MEMBERSHIP_PLANS}>Gia hạn</Link>
    </p>
  );
}
