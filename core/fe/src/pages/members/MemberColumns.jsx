import { EditOutlined, EyeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Typography, Tooltip, Tag } from 'antd';
import { StatusTag } from '@/components/common/StatusTag';
import { MEMBERSHIP_STATUS_META } from '@/constants';
import { formatDate } from '@/utils/format';

const MEMBER_COLUMNS = [
  {
    title: 'HỘI VIÊN',
    dataIndex: 'fullName',
    key: 'fullName',
    width: 300,
    render: (fullName, member) => (
      <Space size="middle">
        <Avatar
          size={44}
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
        </div>
      </Space>
    ),
  },
  {
    title: 'LIÊN HỆ',
    key: 'contact',
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
    title: 'GÓI ĐANG TẬP',
    key: 'membership',
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
    render: (_, member) => {
      const status = member.currentMembership?.status;
      return status ? (
        <Space orientation="vertical" size={2}>
          <StatusTag value={status} meta={MEMBERSHIP_STATUS_META} />
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
    title: '',
    key: 'actions',
    align: 'right',
    render: (_, member) => (
      <Space size="middle">
        <Tooltip title={canUpdate ? 'Xem và sửa hồ sơ' : 'Xem hồ sơ'}>
          <Button
            shape="circle"
            icon={canUpdate ? <EditOutlined /> : <EyeOutlined />}
            aria-label={`${canUpdate ? 'Xem và sửa' : 'Xem'} hồ sơ ${member.fullName}`}
            onClick={() => onViewDetail(member)}
            style={{ color: '#595959', background: '#f5f5f5', border: 'none' }}
          />
        </Tooltip>
        {canManage && (
          <Button
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => onPurchase(member)}
            style={{
              borderRadius: 6,
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(22,119,255,0.25)',
            }}
          >
            Mua gói
          </Button>
        )}
      </Space>
    ),
  },
];
