import { CreditCardFilled } from '@ant-design/icons';
import { Card, Flex, Space, Tag, Typography } from 'antd';
import { formatDate } from '@/utils/format';
import { daysLeft } from '@/utils/membershipEffect';
import { MembershipActions } from './MembershipActions';
import { PlanAccessTags } from './PlanAccessTags';

const STATE = Object.freeze({
  ACTIVE: { color: 'success', label: 'Đang hoạt động' },
  FROZEN: { color: 'warning', label: 'Đang bảo lưu' },
  EXPIRED: { color: 'error', label: 'Đã hết hạn' },
  CANCELLED: { color: 'default', label: 'Đã hủy' },
});

function NextPeriods({ periods }) {
  if (!periods?.length) return null;
  return (
    <Typography.Text type="secondary">
      Kỳ đã mua nối tiếp:{' '}
      {periods
        .map((p) => `${p.plan?.name ?? 'Gói'} ${formatDate(p.startDate)}–${formatDate(p.endDate)}`)
        .join(' · ')}
    </Typography.Text>
  );
}

/** GY-20: kỳ gói đang dùng (gói tự tập: thời hạn, khung giờ, khu vực) và các kỳ mua nối tiếp. */
export function CurrentMembershipCard({ membership, canPurchase, onChanged }) {
  if (!canPurchase || !membership) return null;
  const live = membership.status === 'ACTIVE' || membership.status === 'FROZEN';
  const state = STATE[membership.status] ?? STATE.EXPIRED;
  return (
    <Card variant="borderless" className="scms-current-membership">
      <Flex align="center" justify="space-between" gap={24} wrap>
        <Space size={16} align="center">
          <span className="scms-current-membership__icon">
            <CreditCardFilled />
          </span>
          <Space orientation="vertical" size={4}>
            <Typography.Text className="scms-current-membership__eyebrow">
              {membership.plan?.name ?? 'Gói tự tập của bạn'}
            </Typography.Text>
            <Typography.Title level={3} style={{ margin: 0 }}>
              {live
                ? `Còn hiệu lực đến ${formatDate(membership.endDate)}`
                : `Đã kết thúc ngày ${formatDate(membership.endDate)}`}
            </Typography.Title>
            <Typography.Text>
              Bắt đầu {formatDate(membership.startDate)}
              {membership.status === 'ACTIVE' && ` · còn ${daysLeft(membership.endDate)} ngày`}
            </Typography.Text>
            <PlanAccessTags plan={membership} />
            <NextPeriods periods={membership.nextPeriods} />
          </Space>
        </Space>
        <Space orientation="vertical" align="end">
          <Tag color={state.color}>{state.label}</Tag>
          {live && <MembershipActions membership={membership} onSuccess={onChanged} />}
        </Space>
      </Flex>
    </Card>
  );
}
