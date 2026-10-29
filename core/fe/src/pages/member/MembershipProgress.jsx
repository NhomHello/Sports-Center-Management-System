import { useState } from 'react';
import { Button, Progress, Space, Typography } from 'antd';
import { Link } from 'react-router';
import { PERMISSIONS } from '@scms/shared';
import { MS_PER_DAY, ROUTES } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
const PERCENT = 100;
/** Thời hạn còn lại và lối tắt theo quyền, không tự thay đổi gói. */
export function MembershipProgress({ membership }) {
  const { can } = usePermission();
  const [now] = useState(Date.now);
  const remaining = Math.max(0, new Date(membership.endDate) - now);
  const duration = Math.max(1, new Date(membership.endDate) - new Date(membership.startDate));
  return (
    <Space orientation="vertical">
      <Typography.Text>Còn {Math.ceil(remaining / MS_PER_DAY)} ngày hiệu lực</Typography.Text>
      <Progress percent={Math.min(PERCENT, Math.round((remaining / duration) * PERCENT))} />
      <Space>
        {can(PERMISSIONS.MEMBERSHIP_PURCHASE) && (
          <Link to={ROUTES.MEMBERSHIP_PLANS}>
            <Button>Gia hạn</Button>
          </Link>
        )}
        {can(PERMISSIONS.INVOICE_READ_OWN) && (
          <Link to={ROUTES.PAYMENTS}>
            <Button>Xem hóa đơn</Button>
          </Link>
        )}
      </Space>
    </Space>
  );
}
