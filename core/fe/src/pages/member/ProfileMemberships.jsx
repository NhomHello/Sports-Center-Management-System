import { Card, Empty, Space, Table, Typography } from 'antd';
import { StatusTag } from '@/components/common/StatusTag';
import { MEMBERSHIP_STATUS_META } from '@/constants';
import { formatDate } from '@/utils/format';

const HISTORY_COLUMNS = [
  { title: 'Gói tập', key: 'plan', render: (_, item) => item.plan?.name || '—' },
  { title: 'Hiệu lực từ', dataIndex: 'startDate', render: (value) => formatDate(value) },
  { title: 'Hết hạn', dataIndex: 'endDate', render: (value) => formatDate(value) },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    render: (status) => <StatusTag value={status} meta={MEMBERSHIP_STATUS_META} />,
  },
];

/** Hiển thị gói và lịch sử của chính tài khoản theo phạm vi API cho phép. */
export function ProfileMemberships({ profile }) {
  const membership = profile.currentMembership;
  if (profile.membershipAccess === false) {
    return (
      <Card title="Gói tập của tôi">
        <Typography.Text type="secondary">
          Tài khoản chưa được cấp quyền xem membership.
        </Typography.Text>
      </Card>
    );
  }
  return (
    <Space orientation="vertical" size="middle" className="scms-full-width">
      <Card title="Gói hiện tại" className="scms-profile-membership">
        {membership ? (
          <Space orientation="vertical">
            <Typography.Title level={4} style={{ margin: 0 }}>
              {membership.plan?.name}
            </Typography.Title>
            <StatusTag value={membership.status} meta={MEMBERSHIP_STATUS_META} />
            <Typography.Text>Hiệu lực từ: {formatDate(membership.startDate)}</Typography.Text>
            <Typography.Text>Hết hạn: {formatDate(membership.endDate)}</Typography.Text>
            {Array.isArray(membership.plan?.benefits) &&
              membership.plan.benefits.map((benefit) => (
                <Typography.Text key={benefit}>{benefit}</Typography.Text>
              ))}
          </Space>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Bạn chưa có gói đang hiệu lực."
          />
        )}
      </Card>
      <Card title="Lịch sử gói tập">
        <Table
          rowKey="id"
          columns={HISTORY_COLUMNS}
          dataSource={profile.memberships ?? []}
          pagination={false}
          scroll={{ x: true }}
          locale={{ emptyText: 'Chưa có lịch sử gói tập' }}
        />
      </Card>
    </Space>
  );
}
