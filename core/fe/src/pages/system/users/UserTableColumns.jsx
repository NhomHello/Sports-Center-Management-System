import { PERMISSIONS } from '@scms/shared';
import { LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { Button, Space } from 'antd';
import { StatusTag } from '@/components/common/StatusTag';
import { USER_STATUS, USER_STATUS_META } from '@/constants';
import { formatDateTime } from '@/utils/format';

import { RoleChangeSelect } from './RoleChangeSelect';

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
  { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName', width: 220 },
  { title: 'Email', dataIndex: 'email', key: 'email' },
  { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
  {
    title: 'Vai trò',
    key: 'role',
    render: (_v, user) =>
      can(PERMISSIONS.USER_ASSIGN_ROLE) && user.id !== currentUserId ? (
        <RoleChangeSelect user={user} options={roleOptions} onChange={onChangeRole} />
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
          {can(PERMISSIONS.USER_DELETE) && user.id !== currentUserId && (
            <Button
              onClick={() => onToggleStatus(user)}
              size="small"
              danger={isActive}
              type={isActive ? 'default' : 'primary'}
              icon={isActive ? <LockOutlined /> : <UnlockOutlined />}
            >
              {isActive ? 'Khóa' : 'Mở khóa'}
            </Button>
          )}
        </Space>
      );
    },
  },
];
