import { EyeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Typography, Tooltip, Tag } from 'antd';
import { StatusTag } from '@/components/common/StatusTag';
import { MEMBERSHIP_STATUS_META } from '@/constants';
import { formatDate } from '@/utils/format';

const MEMBER_COLUMNS = [
  {
    title: 'HỘI VIÊN',
    dataIndex: 'fullName',
    key: 'fullName',
    width: 260,
    render: (fullName, member) => (
      <Space size="middle" className="scms-member-identity">
        <Avatar
          size={38}
          style={{ backgroundColor: '#e6f4ff', color: '#1677ff', fontWeight: 700, fontSize: 16 }}
        >
          {fullName?.trim().slice(0, 1)?.toUpperCase() || 'H'}
        </Avatar>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography.Text strong style={{ color: '#1f1f1f', fontSize: 15 }}>
            {fullName}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {member.email || 'Chưa cập nhật email'}
          </Typography.Text>
          {member.email && !member.emailVerifiedAt && (
            <Tag color="orange" style={{ width: 'fit-content', marginInlineEnd: 0 }}>
              Chưa xác minh email
            </Tag>
          )}
        </div>
      </Space>
    ),
  },
  {
    title: 'LIÊN HỆ',
    key: 'contact',
    width: 130,
    render: (_, member) => (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <Typography.Text style={{ fontWeight: 500 }}>{member.phone || '--'}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          ID: #{member.id}
        </Typography.Text>
      </div>
    ),
  },
  {
    // Gia hạn cộng dồn vào cùng một gói hội viên nên đây là gói của lần mua gần nhất.
    title: 'GÓI MUA GẦN NHẤT',
    key: 'membership',
    width: 180,
    render: (_, member) => {
      const planName = member.currentMembership?.plan?.name;
      return planName ? (
        <Tag
          color="blue"
          style={{
            borderRadius: 6,
            padding: '4px 12px',
            fontSize: 13,
            fontWeight: 500,
            border: 'none',
            background: '#e6f4ff',
            color: '#1677ff',
          }}
        >
          {planName}
        </Tag>
      ) : (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          Chưa đăng ký
        </Typography.Text>
      );
    },
  },
  {
    title: 'HIỆU LỰC',
    key: 'status',
    width: 160,
    render: (_, member) => {
      const status = member.currentMembership?.status;
      return status ? (
        <Space orientation="vertical" size={2}>
          {member.currentMembership.isFrozen ? (
            <Tag color="orange">Đang bảo lưu</Tag>
          ) : (
            <StatusTag value={status} meta={MEMBERSHIP_STATUS_META} />
          )}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Tới: {formatDate(member.currentMembership?.endDate)}
          </Typography.Text>
        </Space>
      ) : (
        <Typography.Text type="secondary">--</Typography.Text>
      );
    },
  },
];

/** Cột CRM dùng chung, giữ các hành động theo permission. */
export const getMemberColumns = (canManage, canUpdate, onPurchase, onViewDetail) => [
  ...MEMBER_COLUMNS,
  {
    title: 'THAO TÁC',
    key: 'actions',
    align: 'right',
    width: 230,
    render: (_, member) => (
      <Space size="small" className="scms-member-actions">
        <Tooltip title={canUpdate ? 'Xem và sửa hồ sơ' : 'Xem hồ sơ'}>
          <Button
            icon={<EyeOutlined />}
            aria-label={`${canUpdate ? 'Xem và sửa' : 'Xem'} hồ sơ ${member.fullName}`}
            onClick={(event) => {
              event.stopPropagation();
              onViewDetail(member);
            }}
          >
            {canUpdate ? 'Xem / sửa' : 'Xem'}
          </Button>
        </Tooltip>
        {canManage && (
          <Button
            type="default"
            icon={<ShoppingCartOutlined />}
            onClick={(event) => {
              event.stopPropagation();
              onPurchase(member);
            }}
          >
            {member.currentMembership?.status === 'ACTIVE' ? 'Gia hạn' : 'Mua gói'}
          </Button>
        )}
      </Space>
    ),
  },
];
