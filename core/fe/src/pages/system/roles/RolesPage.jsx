import { PlusOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Table } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PermissionGate } from '@/components/common/PermissionGate';
import { QUERY_KEYS } from '@/constants';
import { usePermission } from '@/hooks/usePermission';
import * as roleService from '@/services/role.service';
import { RoleFormModal } from './RoleFormModal';
import { getRoleColumns } from './RoleTableColumns';

/** Trang quan ly vai tro & phan quyen (RBAC dynamic). Mau chuan cho trang CRUD. */
export default function RolesPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const [modal, setModal] = useState({ open: false, role: null });

  const rolesQuery = useQuery({ queryKey: QUERY_KEYS.ROLES, queryFn: roleService.listRoles });

  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES });
  const onError = (error) => message.error(error.message);

  const deleteMutation = useMutation({
    mutationFn: (role) => roleService.deleteRole(role.id),
    onSuccess: () => {
      message.success('Đã xoá vai trò');
      refresh();
    },
    onError,
  });

  const setDefaultMutation = useMutation({
    mutationFn: (role) => roleService.setDefaultRole(role.id),
    onSuccess: ({ message: msg }) => {
      message.success(msg);
      refresh();
    },
    onError,
  });

  const columns = useMemo(
    () =>
      getRoleColumns({
        can,
        onEdit: (role) => setModal({ open: true, role }),
        onDelete: deleteMutation.mutate,
        onSetDefault: setDefaultMutation.mutate,
      }),
    [can, deleteMutation.mutate, setDefaultMutation.mutate],
  );

  return (
    <>
      <PageHeader
        title="Vai trò & phân quyền"
        subtitle="Tạo vai trò và gán quyền; thay đổi có hiệu lực ngay, không cần đăng nhập lại"
        extra={
          <PermissionGate permission={PERMISSIONS.ROLE_CREATE}>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setModal({ open: true, role: null })}
            >
              Thêm vai trò
            </Button>
          </PermissionGate>
        }
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rolesQuery.data?.data ?? []}
        loading={rolesQuery.isPending}
        pagination={false}
      />
      <RoleFormModal
        open={modal.open}
        role={modal.role}
        onClose={() => setModal({ open: false, role: null })}
      />
    </>
  );
}
