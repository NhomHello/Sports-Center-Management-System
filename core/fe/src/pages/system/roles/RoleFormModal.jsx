import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import { PageLoading } from '@/components/common/PageLoading';
import { QUERY_KEYS } from '@/constants';
import * as permissionService from '@/services/permission.service';
import * as roleService from '@/services/role.service';
import { PermissionMatrix } from './PermissionMatrix';

const MODAL_WIDTH = 900;
const CODE_PATTERN = /^[A-Z][A-Z0-9_]{2,49}$/;

/**
 * Modal tao / sua role. role = null => tao moi.
 * @param {{ open: boolean, role: object|null, onClose: () => void }} props
 */
export function RoleFormModal({ open, role, onClose }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const isEdit = Boolean(role);

  const permissionsQuery = useQuery({
    queryKey: QUERY_KEYS.PERMISSIONS,
    queryFn: permissionService.listPermissions,
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(role ?? { code: '', name: '', description: '', permissionCodes: [] });
  }, [open, role, form]);

  const saveMutation = useMutation({
    mutationFn: (values) =>
      isEdit ? roleService.updateRole(role.id, values) : roleService.createRole(values),
    onSuccess: ({ message: msg }) => {
      message.success(msg);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.ROLES });
      onClose();
    },
    onError: (error) => {
      form.setFields(error.toFormFields());
      message.error(error.message);
    },
  });

  return (
    <Modal
      open={open}
      title={isEdit ? `Sửa vai trò: ${role.name}` : 'Tạo vai trò mới'}
      width={MODAL_WIDTH}
      okText="Lưu"
      cancelText="Huỷ"
      confirmLoading={saveMutation.isPending}
      onOk={form.submit}
      onCancel={onClose}
      forceRender
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={saveMutation.mutate}>
        <Form.Item
          name="code"
          label="Mã vai trò"
          tooltip="IN_HOA, số, gạch dưới. Không đổi được sau khi tạo."
          rules={[
            { required: true, message: 'Nhập mã vai trò' },
            { pattern: CODE_PATTERN, message: 'VD: SALES_STAFF (3-50 ký tự in hoa)' },
          ]}
        >
          <Input disabled={isEdit} placeholder="SALES_STAFF" />
        </Form.Item>
        <Form.Item
          name="name"
          label="Tên hiển thị"
          rules={[{ required: true, message: 'Nhập tên' }]}
        >
          <Input placeholder="Nhân viên kinh doanh" />
        </Form.Item>
        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={2} />
        </Form.Item>
        <Form.Item name="permissionCodes" label="Quyền">
          {permissionsQuery.isPending ? (
            <PageLoading />
          ) : (
            <PermissionMatrix groups={permissionsQuery.data?.data ?? []} />
          )}
        </Form.Item>
      </Form>
    </Modal>
  );
}
