import { CalendarOutlined, CreditCardOutlined } from '@ant-design/icons';
import { Card, Tag, Typography } from 'antd';
import { formatDate } from '@/utils/format';
import { PlanAccessSummary } from './PlanAccessSummary';
import './membershipOverview.css';

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

function PeriodAccess({ membership, upcoming }) {
  const access = <PlanAccessSummary plan={getPeriodAccess(membership)} />;
  return upcoming ? (
    <details className="scms-membership-period__details">
      <summary>Xem khung giờ và khu vực</summary>
      {access}
    </details>
  ) : (
    access
  );
}

function MembershipPeriod({ membership, upcoming = false }) {
  const status = membership.isFrozen ? 'FROZEN' : membership.status;
  return (
    <section
      className={`scms-membership-period${upcoming ? ' scms-membership-period--upcoming' : ''}`}
    >
      <div className="scms-membership-period__heading">
        <div>
          <span className="scms-current-membership__eyebrow">
            {upcoming ? 'Kỳ tiếp theo' : 'Gói tập hiện tại'}
          </span>
          <Typography.Title level={4}>{membership.plan?.name || 'Gói tập'}</Typography.Title>
        </div>
        <Tag color={status === 'ACTIVE' ? 'green' : 'default'}>
          {upcoming ? 'Sắp có hiệu lực' : STATUS_LABELS[status] || status}
        </Tag>
      </div>
      <div className="scms-membership-period__dates">
        <CalendarOutlined />
        <span>
          {formatDate(membership.startDate)} – {formatDate(membership.endDate)}
        </span>
      </div>
      <PeriodAccess membership={membership} upcoming={upcoming} />
    </section>
  );
}

/** Hiển thị riêng kỳ gói đang dùng và các kỳ mua nối tiếp. */
export function CurrentMembershipCard({ membership, canPurchase }) {
  if (!canPurchase || !membership) return null;
  return (
    <Card variant="borderless" className="scms-current-membership">
      <span className="scms-current-membership__icon">
        <CreditCardOutlined />
      </span>
      <div className="scms-current-membership__periods">
        <MembershipPeriod membership={membership} />
        {(membership.nextPeriods ?? []).map((period) => (
          <MembershipPeriod key={period.id} membership={period} upcoming />
        ))}
      </div>
    </Card>
  );
}
