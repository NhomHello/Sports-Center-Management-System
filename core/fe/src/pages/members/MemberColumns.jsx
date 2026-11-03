import { EyeOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Avatar, Button, Space, Typography, Tooltip, Tag } from 'antd';

const MEMBER_COLUMNS = [
  {
    title: 'HỘI VIÊN',
    dataIndex: 'fullName',
    key: 'fullName',
    width: 260,
    render: (fullName, member) => (
      <Space size="middle" className="scms-member-identity">
        <Avatar size={38} className="scms-member-avatar" style={{ fontWeight: 700, fontSize: 16 }}>
          {fullName?.trim().slice(0, 1)?.toUpperCase() || 'H'}
        </Avatar>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <Typography.Text strong className="scms-member-name" style={{ fontSize: 15 }}>
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
    title: 'KHÓA GẦN NHẤT',
    key: 'course',
    render: (_, member) => member.latestCourse?.name || 'Chưa đăng ký',
  },
  { title: 'SỐ KHÓA ĐÃ ĐĂNG KÝ', dataIndex: 'activeCourseCount', render: (value) => value ?? 0 },
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
            Đăng ký khóa học
          </Button>
        )}
      </Space>
    ),
  },
];
