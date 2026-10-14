import { Alert, Button } from 'antd';
import { Link } from 'react-router';
import { ROUTES } from '@/constants';
import { formatDate } from '@/utils/format';
/** Cảnh báo không chặn đăng ký; số buổi và ngày hết hạn lấy từ API. */
export function MembershipExpiryNotice({ item, memberId }) {
  if (!item.membershipExpiresBeforeClassEnd) return null;
  return (
    <Alert
      showIcon
      type="warning"
      title={`Gói hết hạn ngày ${formatDate(item.membershipEndDate)}. Có ${item.affectedSessionCount} buổi sau ngày hết hạn.`}
      description="Bạn vẫn có thể đăng ký lớp. Hãy gia hạn để tham gia đủ các buổi."
      action={
        <Link to={memberId ? ROUTES.MEMBERS : ROUTES.MEMBERSHIP_PLANS}>
          <Button>Gia hạn ngay</Button>
        </Link>
      }
    />
  );
}
