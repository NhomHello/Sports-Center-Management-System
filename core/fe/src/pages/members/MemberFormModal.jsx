import { useMutation, useQueryClient } from '@tanstack/react-query';
import { App, Form, Input, Modal } from 'antd';
import { QUERY_KEYS } from '@/constants';
import * as memberService from '@/services/member.service';

const PASSWORD_MIN = 8;

/** Modal đăng ký hội viên tại quầy. @param {{ open: boolean, onClose: () => void }} props */
export function MemberFormModal({ open, onClose }) {
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const createMutation = useMutation({
    mutationFn: memberService.createMember,
    onSuccess: ({ message: text }) => {
      message.success(text || 'Đăng ký thành công!');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEMBERS });
      form.resetFields();
      onClose();
    },
    onError: (error) => {
      if (error.toFormFields) {
        form.setFields(error.toFormFields());
      }
      message.error(error.message || 'Có lỗi xảy ra');
    },
  });

  return (
    <Modal
      open={open}
      title="Đăng ký hội viên tại quầy"
      okText="Đăng ký"
      cancelText="Huỷ"
      confirmLoading={createMutation.isPending}
      onOk={form.submit}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={createMutation.mutate}>
        <Form.Item
          name="fullName"
          label="Họ và tên"
          rules={[{ required: true, message: 'Nhập họ tên' }]}
        >
          <Input placeholder="Nhập họ và tên" />
        </Form.Item>
        <Form.Item
          name="email"
          label="Email"
          rules={[{ type: 'email', message: 'Email không hợp lệ' }]}
        >
          <Input placeholder="Không bắt buộc nếu có số điện thoại" />
        </Form.Item>
        <Form.Item 
          name="phone" 
          label="Số điện thoại"
          rules={[{ required: true, message: 'Nhập số điện thoại' }]}
        >
          <Input placeholder="Nhập số điện thoại" />
        </Form.Item>
        <Form.Item
          name="password"
          label="Mật khẩu tạm thời"
          rules={[
            { required: true, min: PASSWORD_MIN, message: `Tối thiểu ${PASSWORD_MIN} ký tự` },
          ]}
        >
          <Input.Password placeholder="Nhập mật khẩu cho hội viên" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
