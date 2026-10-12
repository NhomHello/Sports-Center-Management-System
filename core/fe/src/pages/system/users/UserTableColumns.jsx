import { PERMISSIONS } from '@scms/shared';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { Button, Popconfirm, Select, Space } from 'antd';
import { StatusTag } from '@/components/common/StatusTag';
import { USER_STATUS, USER_STATUS_META } from '@/constants';
import { formatDateTime } from '@/utils/format';

const ROLE_SELECT_WIDTH = 180;

/**
 * Cot cho bang tai khoan.
 * @param {{ can: (p: string) => boolean, currentUserId: number, roleOptions: { value: number, label: string }[], onChangeRole: (user, roleId) => void, onToggleStatus: (user) => void }} handlers
 */
export const getUserColumns = ({
  can,
  currentUserId,
  roleOptions,
  onChangeRole,
  onToggleStatus,
}) => [
  { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
  {
    title: 'Vai trò',
    key: 'role',
    render: (_v, user) =>
      can(PERMISSIONS.USER_ASSIGN_ROLE) && user.id !== currentUserId ? (
        <Select
          size="small"
          style={{ width: ROLE_SELECT_WIDTH }}
          value={user.role.id}
          options={roleOptions}
          onChange={(roleId) => onChangeRole(user, roleId)}
        />
      ) : (
        user.role.name
      ),
  },
  {
    title: 'Trạng thái',
    dataIndex: 'status',
    key: 'status',
    render: (status) => <StatusTag value={status} meta={USER_STATUS_META} />,
  },
  { title: 'Tạo lúc', dataIndex: 'createdAt', key: 'createdAt', render: formatDateTime },
  {
    title: 'Thao tác',
    key: 'actions',
    render: (_v, user) => {
      const isActive = user.status === USER_STATUS.ACTIVE;
      return (
        <Space>
          {can(PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE) && user.id !== currentUserId && (
            <Popconfirm
              title={isActive ? 'Khoá tài khoản này?' : 'Mở khoá tài khoản này?'}
              description={
                isActive
                  ? 'Tài khoản sẽ không thể đăng nhập cho tới khi được mở khóa.'
                  : 'Tài khoản sẽ được phép đăng nhập trở lại ngay lập tức.'
              }
              okText={isActive ? 'Khóa tài khoản' : 'Mở khóa'}
              cancelText="Huỷ"
              onConfirm={() => onToggleStatus(user)}
            >
              <Button
                size="small"
                danger={isActive}
                type={isActive ? 'default' : 'primary'}
                icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
              >
                {isActive ? 'Khóa' : 'Mở khóa'}
              </Button>
            </Popconfirm>
          )}
        </Space>
      );
    },
  },
];
