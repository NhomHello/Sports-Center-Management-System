import { CreditCardFilled } from '@ant-design/icons';
import { Card, Flex, Space, Tag, Typography } from 'antd';
import { formatDate } from '@/utils/format';
import { daysLeft } from '@/utils/membershipEffect';

/** Gói chỉ quy định thời hạn: banner hiển thị hạn dùng và số lần đã cộng dồn, không nêu một "gói" riêng. */
export function CurrentMembershipCard({ membership, canPurchase }) {
  if (!canPurchase || !membership) return null;
  const isActive = membership.status === 'ACTIVE';
  const payments = membership.paidInvoiceCount ?? 0;
  return (
    <Card variant="borderless" className="scms-current-membership">
      <Flex align="center" justify="space-between" gap={24} wrap>
        <Space size={16} align="center">
          <span className="scms-current-membership__icon">
            <CreditCardFilled />
          </span>
          <span>
            <Typography.Text className="scms-current-membership__eyebrow">
              Gói tập của bạn
            </Typography.Text>
            <Typography.Title level={3}>
              {isActive
                ? `Còn hiệu lực đến ${formatDate(membership.endDate)}`
                : `Đã hết hạn ngày ${formatDate(membership.endDate)}`}
            </Typography.Title>
            <Typography.Text>
              Bắt đầu {formatDate(membership.startDate)}
              {isActive && ` · còn ${daysLeft(membership.endDate)} ngày`}
              {payments > 1 && ` · đã cộng dồn ${payments} lần thanh toán`}
            </Typography.Text>
          </span>
        </Space>
        <MembershipState membership={membership} isActive={isActive} />
      </Flex>
    </Card>
  );
}

function MembershipState({ membership, isActive }) {
  return (
    <Tag color={membership.isFrozen ? 'warning' : isActive ? 'success' : 'error'}>
      {membership.isFrozen ? 'Đang bảo lưu' : isActive ? 'Đang hoạt động' : 'Đã hết hạn'}
    </Tag>
  );
}
