import { CreditCardFilled } from '@ant-design/icons';
import { Card, Flex, Space, Tag, Typography } from 'antd';
import { formatDate } from '@/utils/format';

export function CurrentMembershipCard({ membership, canPurchase }) {
  if (!canPurchase || !membership) return null;
  const isActive = membership.status === 'ACTIVE';
  return (
    <Card variant="borderless" className="scms-current-membership">
      <Flex align="center" justify="space-between" gap={24} wrap>
        <Space size={16} align="center">
          <span className="scms-current-membership__icon">
            <CreditCardFilled />
          </span>
          <span>
            <Typography.Text className="scms-current-membership__eyebrow">
              GÓI TẬP HIỆN TẠI
            </Typography.Text>
            <Typography.Title level={3}>{membership.plan?.name}</Typography.Title>
            <Typography.Text>
              {formatDate(membership.startDate)} — {formatDate(membership.endDate)}
            </Typography.Text>
          </span>
        </Space>
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'ĐANG HOẠT ĐỘNG' : 'ĐÃ HẾT HẠN'}
        </Tag>
      </Flex>
    </Card>
  );
}
