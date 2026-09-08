import { DeleteOutlined, EditOutlined, StarOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { Button, Popconfirm, Space, Tag } from 'antd';

/**
 * Cot cho bang role. Tach rieng de RolesPage ngan va de tai su dung.
 * @param {{ can: (p: string) => boolean, onEdit: (role) => void, onDelete: (role) => void, onSetDefault: (role) => void }} handlers
 */
export const getRoleColumns = ({ can, onEdit, onDelete, onSetDefault }) => [
  { title: 'Mã', dataIndex: 'code', key: 'code', render: (code) => <code>{code}</code> },
  {
    title: 'Tên',
    dataIndex: 'name',
    key: 'name',
    render: (name, role) => (
      <Space>
        {name}
        {role.isSystem && <Tag>Hệ thống</Tag>}
        {role.isDefault && <Tag color="blue">Mặc định khi đăng ký</Tag>}
      </Space>
    ),
  },
  { title: 'Mô tả', dataIndex: 'description', key: 'description' },
  { title: 'Số quyền', key: 'permissionCount', render: (_v, role) => role.permissionCodes.length },
  { title: 'Số tài khoản', dataIndex: 'userCount', key: 'userCount' },
  {
    title: 'Thao tác',
    key: 'actions',
    render: (_v, role) => (
      <Space>
        {can(PERMISSIONS.ROLE_UPDATE) && (
          <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(role)}>
            Sửa
          </Button>
        )}
        {can(PERMISSIONS.ROLE_UPDATE) && !role.isDefault && (
          <Button size="small" icon={<StarOutlined />} onClick={() => onSetDefault(role)}>
            Đặt mặc định
          </Button>
        )}
        {can(PERMISSIONS.ROLE_DELETE) && !role.isSystem && (
          <Popconfirm
            title="Xoá vai trò này?"
            okText="Xoá"
            cancelText="Huỷ"
            onConfirm={() => onDelete(role)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xoá
            </Button>
          </Popconfirm>
        )}
      </Space>
    ),
  },
];
