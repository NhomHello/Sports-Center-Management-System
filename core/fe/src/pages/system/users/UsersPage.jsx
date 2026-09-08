import { PlusOutlined } from '@ant-design/icons';
import { PERMISSIONS } from '@scms/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Table } from 'antd';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { PermissionGate } from '@/components/common/PermissionGate';
import { QUERY_KEYS, USER_STATUS } from '@/constants';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useTableQuery } from '@/hooks/useTableQuery';
import * as roleService from '@/services/role.service';
import * as userService from '@/services/user.service';
import { UserFilters } from './UserFilters';
import { UserFormModal } from './UserFormModal';
import { getUserColumns } from './UserTableColumns';

const NEXT_STATUS = {
  [USER_STATUS.ACTIVE]: USER_STATUS.INACTIVE,
  [USER_STATUS.INACTIVE]: USER_STATUS.ACTIVE,
};

/** Trang quan ly tai khoan: mau chuan cho bang phan trang phia server + filter. */
export default function UsersPage() {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const { can } = usePermission();
  const { user: currentUser } = useAuth();
  const table = useTableQuery();
  const [createOpen, setCreateOpen] = useState(false);

  const usersQuery = useQuery({
    queryKey: [...QUERY_KEYS.USERS, table.params],
    queryFn: () => userService.listUsers(table.params),
  });
  const rolesQuery = useQuery({ queryKey: QUERY_KEYS.ROLES, queryFn: roleService.listRoles });
  const roleOptions = useMemo(
    () => (rolesQuery.data?.data ?? []).map((role) => ({ value: role.id, label: role.name })),
    [rolesQuery.data],
  );

  const onMutated = ({ message: msg }) => {
    message.success(msg);
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
  };
  const onError = (error) => message.error(error.message);

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ user, roleId }) => userService.updateUserRole(user.id, roleId),
    onSuccess: onMutated,
    onError,
  });
  const { mutate: toggleStatus } = useMutation({
    mutationFn: (user) => userService.updateUserStatus(user.id, NEXT_STATUS[user.status]),
    onSuccess: onMutated,
    onError,
  });

  const columns = useMemo(
    () =>
      getUserColumns({
        can,
        currentUserId: currentUser?.id,
        roleOptions,
        onChangeRole: (user, roleId) => changeRole({ user, roleId }),
        onToggleStatus: toggleStatus,
      }),
    [can, currentUser?.id, roleOptions, changeRole, toggleStatus],
  );

  return (
    <>
      <PageHeader
        title="Tài khoản"
        extra={
          <PermissionGate permission={PERMISSIONS.USER_CREATE}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              Tạo tài khoản
            </Button>
          </PermissionGate>
        }
      />
      <UserFilters roleOptions={roleOptions} onChange={table.setFilters} />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={usersQuery.data?.data ?? []}
        loading={usersQuery.isPending}
        pagination={table.paginationProps(usersQuery.data?.meta)}
        onChange={table.onTableChange}
        scroll={{ x: true }}
      />
      <UserFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
