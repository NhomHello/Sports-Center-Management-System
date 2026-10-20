import { Card, Space, Tag, Typography } from 'antd';
import { formatDate } from '@/utils/format';
import { PlanAccessSummary } from './PlanAccessSummary';
const STATUS_LABELS = {
  ACTIVE: 'Đang hoạt động',
  FROZEN: 'Đang bảo lưu',
  EXPIRED: 'Đã hết hạn',
  CANCELLED: 'Đã hủy',
};
const getPeriodAccess = (membership) => ({
  ...membership.plan,
  frames: membership.frames ?? membership.plan?.frames,
  areas: membership.areas ?? membership.plan?.areas,
});
function MembershipPeriod({ membership, upcoming = false }) {
  const status = membership.isFrozen ? 'FROZEN' : membership.status;
  return (
    <Space orientation="vertical" className="scms-full-width">
      <Typography.Title level={4}>{membership.plan?.name || 'Gói tự tập'}</Typography.Title>
      <Tag>{upcoming ? 'Kỳ đã mua nối tiếp' : STATUS_LABELS[status] || status}</Tag>
      <Typography.Text>
        {formatDate(membership.startDate)} – {formatDate(membership.endDate)}
      </Typography.Text>
      <PlanAccessSummary plan={getPeriodAccess(membership)} />
    </Space>
  );
}
/** Hiển thị riêng kỳ hiện tại và các kỳ đã mua nối tiếp. */
export function CurrentMembershipCard({ membership, canPurchase }) {
  if (!canPurchase || !membership) return null;
  return (
    <Card title="Gói tự tập của bạn" variant="borderless" className="scms-current-membership">
      <Space orientation="vertical" size="large" className="scms-full-width">
        <MembershipPeriod membership={membership} />
        {(membership.nextPeriods ?? []).map((period) => (
          <MembershipPeriod key={period.id} membership={period} upcoming />
        ))}
      </Space>
    </Card>
  );
}
