import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Form, Input, Modal, Select } from 'antd';
import { QUERY_KEYS } from '@/constants';
import * as roleService from '@/services/role.service';
import * as userService from '@/services/user.service';

const PASSWORD_MIN = 8;

/**
 * Modal tao tai khoan (manager tao coach / le tan...).
 * @param {{ open: boolean, onClose: () => void }} props
 */
export function UserFormModal({ open, onClose }) {
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();

  const rolesQuery = useQuery({
    queryKey: QUERY_KEYS.ROLES,
    queryFn: roleService.listRoles,
    enabled: open,
  });
  const roleOptions = (rolesQuery.data?.data ?? []).map((role) => ({
    value: role.id,
    label: role.name,
  }));

  const createMutation = useMutation({
    mutationFn: userService.createUser,
    onSuccess: ({ message: msg }) => {
      message.success(msg);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      form.resetFields();
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
      title="Tạo tài khoản"
      okText="Tạo"
      cancelText="Huỷ"
      confirmLoading={createMutation.isPending}
      onOk={form.submit}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={createMutation.mutate}>
        <Form.Item
          name="fullName"
          label="Họ tên"
          rules={[{ required: true, message: 'Nhập họ tên' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Nhập email' },
            { type: 'email', message: 'Email không hợp lệ' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Số điện thoại">
          <Input />
        </Form.Item>
        <Form.Item
          name="password"
          label="Mật khẩu"
          rules={[
            { required: true, min: PASSWORD_MIN, message: `Tối thiểu ${PASSWORD_MIN} ký tự` },
          ]}
        >
          <Input.Password />
        </Form.Item>
        <Form.Item
          name="roleId"
          label="Vai trò"
          rules={[{ required: true, message: 'Chọn vai trò' }]}
        >
          <Select options={roleOptions} loading={rolesQuery.isPending} placeholder="Chọn vai trò" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
